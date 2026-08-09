import {
  firestoreCreateWithId,
  sendEmail,
  verifyStripeSignature,
} from "./_shared.mjs";

function stripeAuthHeaders(secret) {
  return { Authorization: `Bearer ${secret}` };
}

async function getStripeLineItems(stripeSecret, sessionId) {
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=100&expand[]=data.price.product`,
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
    const items = lineItems.map((item) => {
      const product = item.price?.product && typeof item.price.product === "object"
        ? item.price.product
        : null;

      return {
        productId: product?.metadata?.firestoreProductId || product?.metadata?.parentFirestoreProductId || "",
        stripeProductId: product?.id || "",
        lineKey: product?.metadata?.lineKey || "",
        isOrderAddOn: product?.metadata?.isOrderAddOn === "true",
        name: product?.name || item.description || "Custom Product",
        description: product?.description || "",
        size: product?.metadata?.size || "",
        color: product?.metadata?.color || "",
        shirtStyle: product?.metadata?.shirtStyle || "",
        designType: product?.metadata?.designType || "",
        apparelKind: product?.metadata?.apparelKind || "",
        templateId: product?.metadata?.templateId || "",
        templateLabel: product?.metadata?.templateLabel || "",
        marketingProductType: product?.metadata?.marketingProductType || "",
        sleevePrint: product?.metadata?.sleevePrint || "",
        printLocation: product?.metadata?.printLocation || "",
        printMethod: product?.metadata?.printMethod || "",
        personalization: product?.metadata?.personalization || "",
        designNotes: product?.metadata?.designNotes || "",
        artworkMethod: product?.metadata?.artworkMethod || "",
        proofBeforePrinting: product?.metadata?.proofBeforePrinting || "",
        rushOrder: product?.metadata?.rushOrder || "",
        deliveryMethod: product?.metadata?.deliveryMethod || "",
        neededBy: product?.metadata?.neededBy || "",
        occasion: product?.metadata?.occasion || "",
        laserItemType: product?.metadata?.laserItemType || "",
        laserMaterial: product?.metadata?.laserMaterial || "",
        dimensions: product?.metadata?.dimensions || "",
        layoutStyle: product?.metadata?.layoutStyle || "",
        finishColor: product?.metadata?.finishColor || "",
        engravingText: product?.metadata?.engravingText || "",
        fullWrap: product?.metadata?.fullWrap || "",
        extraEngravingSide: product?.metadata?.extraEngravingSide || "",
        designFee: product?.metadata?.designFee || "",
        baseUnitPrice: Number(product?.metadata?.baseUnitPrice || 0),
        calculatedUnitPrice: Number(product?.metadata?.calculatedUnitPrice || item.price?.unit_amount || 0),
        oneTimeAddOn: Number(product?.metadata?.oneTimeAddOn || 0),
        quantity: Number(item.quantity || 0),
        unitAmount: item.price?.unit_amount ?? null,
        amountTotal: Number(item.amount_total || 0),
        currency: item.currency || session.currency || "usd",
      };
    });

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

    if (!result?.alreadyExists) {
      const itemLines = items.map(i =>
        `<li>${i.name} — Qty ${i.quantity} — $${(i.amountTotal/100).toFixed(2)}</li>`
      ).join("");

      await sendEmail({
        to: order.customerEmail,
        subject: `Order ${order.orderNumber} received`,
        html: `<h2>Thank you for your order!</h2>
          <p>Your order <strong>${order.orderNumber}</strong> has been received and paid.</p>
          <ul>${itemLines}</ul>
          <p><strong>Total:</strong> $${(order.total/100).toFixed(2)}</p>
          <p>You can sign in at endlessbv.com to see your order status and tracking details.</p>`,
        text: `Thank you for your order. ${order.orderNumber} has been received and paid. Total: $${(order.total/100).toFixed(2)}.`
      });

      const adminEmail = process.env.ADMIN_ORDER_EMAIL;
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `New paid order ${order.orderNumber}`,
          html: `<h2>New paid order</h2>
            <p><strong>${order.customerName || order.customerEmail}</strong></p>
            <p>${order.customerEmail}</p>
            <ul>${itemLines}</ul>
            <p><strong>Total:</strong> $${(order.total/100).toFixed(2)}</p>`,
          text: `New paid order ${order.orderNumber} from ${order.customerEmail}. Total: $${(order.total/100).toFixed(2)}.`
        });
      }
    }

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
