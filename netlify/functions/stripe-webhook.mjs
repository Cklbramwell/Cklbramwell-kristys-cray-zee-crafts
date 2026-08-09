import Stripe from "stripe";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function getFirestoreAdmin() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");
    initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  return getFirestore();
}

function addressToPlain(address) {
  if (!address) return null;
  return {
    line1: address.line1 || "",
    line2: address.line2 || "",
    city: address.city || "",
    state: address.state || "",
    postalCode: address.postal_code || "",
    country: address.country || ""
  };
}

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecret || !webhookSecret) {
    console.error("Stripe webhook environment variables are missing.");
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing Stripe signature", { status: 400 });

  const rawBody = await request.text();
  const stripe = new Stripe(stripeSecret);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe signature verification failed:", error.message);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true });
  }

  try {
    const session = event.data.object;

    // For standard card Checkout, only fulfill paid sessions.
    if (session.payment_status !== "paid") {
      return Response.json({ received: true, skipped: "not_paid" });
    }

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100
    });

    const items = lineItems.data.map((item) => ({
      name: item.description || "Custom Product",
      quantity: Number(item.quantity || 0),
      unitAmount: item.price?.unit_amount || null,
      amountTotal: item.amount_total || 0,
      currency: item.currency || session.currency || "usd"
    }));

    const db = getFirestoreAdmin();
    const orderRef = db.collection("orders").doc(session.id);

    // Stripe can retry webhooks. Using the session ID as the document ID
    // makes order creation idempotent.
    await db.runTransaction(async (tx) => {
      const existing = await tx.get(orderRef);
      if (existing.exists) return;

      tx.set(orderRef, {
        orderNumber: `KCC-${session.id.slice(-8).toUpperCase()}`,
        stripeSessionId: session.id,
        paymentIntentId: session.payment_intent || null,
        userId: session.metadata?.firebaseUid || session.client_reference_id || null,
        customerEmail: session.customer_details?.email || session.customer_email || "",
        customerName: session.customer_details?.name || "",
        customerPhone: session.customer_details?.phone || "",
        shippingAddress: addressToPlain(
          session.collected_information?.shipping_details?.address ||
          session.shipping_details?.address
        ),
        items,
        subtotal: session.amount_subtotal || 0,
        total: session.amount_total || 0,
        currency: session.currency || "usd",
        paymentStatus: session.payment_status || "paid",
        status: "Paid",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    return Response.json({ received: true, orderId: session.id });
  } catch (error) {
    console.error("Webhook fulfillment error:", error);
    // Return 500 so Stripe retries delivery.
    return new Response("Order fulfillment failed", { status: 500 });
  }
};
