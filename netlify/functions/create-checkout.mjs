import {
  firestoreGet,
  getBearerToken,
  verifyFirebaseIdToken,
} from "./_shared.mjs";

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

    if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY is not configured.");
    if (!projectId) throw new Error("VITE_FIREBASE_PROJECT_ID is not configured.");

    const token = getBearerToken(request);
    if (!token) {
      return Response.json({ error: "Please sign in before checkout." }, { status: 401 });
    }

    const customer = await verifyFirebaseIdToken(token, projectId);

    let payload;
    try {
      payload = await request.json();
    } catch {
      return Response.json({ error: "Invalid checkout request." }, { status: 400 });
    }

    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!items.length || items.length > 50) {
      return Response.json({ error: "Your cart is empty or too large." }, { status: 400 });
    }

    const normalized = items.map((item) => ({
      id: String(item?.id || "").trim(),
      qty: Number(item?.qty),
    }));

    for (const item of normalized) {
      if (!item.id || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) {
        return Response.json({ error: "One or more cart items are invalid." }, { status: 400 });
      }
    }

    const products = [];
    for (const item of normalized) {
      const p = await firestoreGet(projectId, `products/${encodeURIComponent(item.id)}`);
      if (!p) {
        return Response.json({ error: "A product in your cart no longer exists." }, { status: 400 });
      }
      if (p.active === false) {
        return Response.json({ error: `${p.name || "A product"} is not currently available.` }, { status: 400 });
      }

      const regular = Number(p.price || 0);
      const sale = Number(p.salePrice || 0);
      const amount = sale > 0 && sale < regular ? sale : regular;

      if (!Number.isInteger(amount) || amount < 50) {
        return Response.json({ error: `${p.name || "A product"} has an invalid price.` }, { status: 400 });
      }

      products.push({ ...p, id: item.id, qty: item.qty, checkoutAmount: amount });
    }

    const originHeader = request.headers.get("origin");
    const origin =
      originHeader && /^https?:\/\//i.test(originHeader)
        ? originHeader
        : new URL(request.url).origin;

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("client_reference_id", customer.sub);
    form.set("metadata[firebaseUid]", customer.sub);
    if (customer.email) form.set("customer_email", customer.email);

    // Collect phone and US shipping address for fulfillment.
    form.set("phone_number_collection[enabled]", "true");
    form.set("shipping_address_collection[allowed_countries][0]", "US");

    form.set("success_url", `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${origin}/?checkout=cancel`);

    products.forEach((p, index) => {
      form.set(`line_items[${index}][quantity]`, String(p.qty));
      form.set(`line_items[${index}][price_data][currency]`, "usd");
      form.set(`line_items[${index}][price_data][unit_amount]`, String(p.checkoutAmount));
      form.set(`line_items[${index}][price_data][product_data][name]`, p.name || "Custom Product");
      form.set(`line_items[${index}][price_data][product_data][metadata][firestoreProductId]`, p.id);
    });

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    const stripeData = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error("Stripe create session error:", stripeData);
      return Response.json(
        { error: stripeData?.error?.message || "Stripe could not start checkout." },
        { status: 502 }
      );
    }

    return Response.json({ url: stripeData.url });
  } catch (error) {
    console.error("create-checkout error:", error);
    return Response.json(
      { error: error?.message || "Unable to start checkout." },
      { status: 500 }
    );
  }
};
