import {
  firestoreCreateWithId,
  verifyStripeSignature,
} from "./_shared.mjs";

function stripeAuthHeaders(secret) {
  return { Authorization: `Bearer ${secret}` };
}

async function getStripeLineItems(stripeSecret, sessionId) {
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=100`,
    { headers: stripeAuthHeaders(stripeSecret) }
  );
  const data = await response.json();
  if (!response.ok) {
    console.error("Stripe line items error:", data);
    throw new Error("Unable to load Stripe line items.");
  }
  return data.data || [];
}

function plainAddress(address) {
  if (!address) return null;
  return {
    line1: address.line1 || "",
    line2: address.line2 || "",
    city: address.city || "",
    state: address.state || "",
    postalCode: address.postal_code || "",
    country: address.country || "",
  };
}

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

  if (!stripeSecret || !webhookSecret || !projectId) {
    console.error("Webhook environment configuration is incomplete.");
    return new Response("Webhook not configured", { status: 500 });
  }

  const rawBody = await request.text();

  try {
    verifyStripeSignature(
      rawBody,
      request.headers.get("stripe-signature"),
      webhookSecret
    );
  } catch (error) {
    console.error("Stripe signature verification failed:", error.message);
    return new Response("Invalid signature", { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true });
  }

  try {
    const session = event.data?.object;
    if (!session?.id) throw new Error("Stripe session is missing.");
    if (session.payment_status !== "paid") {
      return Response.json({ received: true, skipped: "not_paid" });
    }

    const lineItems = await getStripeLineItems(stripeSecret, session.id);
    const items = lineItems.map((item) => ({
      name: item.description || "Custom Product",
      quantity: Number(item.quantity || 0),
      unitAmount: item.price?.unit_amount ?? null,
      amountTotal: Number(item.amount_total || 0),
      currency: item.currency || session.currency || "usd",
    }));

    const shipping =
      session.collected_information?.shipping_details ||
      session.shipping_details ||
      null;

    const now = new Date().toISOString();

    const order = {
      orderNumber: `KCC-${session.id.slice(-8).toUpperCase()}`,
      stripeSessionId: session.id,
      paymentIntentId: session.payment_intent || "",
      userId: session.metadata?.firebaseUid || session.client_reference_id || "",
      customerEmail: session.customer_details?.email || session.customer_email || "",
      customerName: session.customer_details?.name || shipping?.name || "",
      customerPhone: session.customer_details?.phone || "",
      shippingAddress: plainAddress(shipping?.address),
      items,
      subtotal: Number(session.amount_subtotal || 0),
      total: Number(session.amount_total || 0),
      currency: session.currency || "usd",
      paymentStatus: session.payment_status || "paid",
      status: "Paid",
      createdAt: now,
      updatedAt: now,
    };

    // Using the Stripe Checkout Session ID as Firestore document ID prevents
    // duplicate orders if Stripe retries the same webhook delivery.
    const result = await firestoreCreateWithId(
      projectId,
      "orders",
      session.id,
      order
    );

    return Response.json({
      received: true,
      orderId: session.id,
      duplicate: Boolean(result?.alreadyExists),
    });
  } catch (error) {
    console.error("Webhook fulfillment error:", error);
    // Non-2xx tells Stripe to retry later.
    return new Response("Order fulfillment failed", { status: 500 });
  }
};
