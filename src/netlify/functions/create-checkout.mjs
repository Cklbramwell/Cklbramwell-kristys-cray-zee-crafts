const FALLBACK_PRODUCTS = {
  shirt: {
    name: "Custom T-Shirt",
    price: 2500,
    salePrice: 0,
    active: true
  },
  tumbler: {
    name: "20 oz Custom Tumbler",
    price: 3000,
    salePrice: 0,
    active: true
  },
  graphic: {
    name: "Custom Graphic Design",
    price: 2000,
    salePrice: 0,
    active: true
  }
};

function firestoreValue(fields, key) {
  const value = fields?.[key];
  if (!value) return undefined;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return value.booleanValue;
  return undefined;
}

async function loadProduct(projectId, id) {
  const safeId = encodeURIComponent(id);
  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/(default)/documents/products/${safeId}`;

  const response = await fetch(url);

  if (response.status === 404 && FALLBACK_PRODUCTS[id]) {
    return { id, ...FALLBACK_PRODUCTS[id] };
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Unable to load product ${id}: ${response.status} ${text.slice(0, 160)}`);
  }

  const document = await response.json();
  const fields = document.fields || {};

  return {
    id,
    name: firestoreValue(fields, "name"),
    price: firestoreValue(fields, "price"),
    salePrice: firestoreValue(fields, "salePrice") || 0,
    active: firestoreValue(fields, "active") !== false
  };
}

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

  if (!stripeSecret) {
    return Response.json({ error: "Stripe is not configured on the server." }, { status: 500 });
  }

  if (!projectId) {
    return Response.json({ error: "Firebase project ID is not configured on the server." }, { status: 500 });
  }

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
    qty: Number(item?.qty)
  }));

  for (const item of normalized) {
    if (!item.id || item.id.length > 180 || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) {
      return Response.json({ error: "One or more cart items are invalid." }, { status: 400 });
    }
  }

  try {
    const products = await Promise.all(
      normalized.map((item) => loadProduct(projectId, item.id))
    );

    const form = new URLSearchParams();
    form.set("mode", "payment");

    const requestOrigin = request.headers.get("origin");
    const fallbackOrigin = new URL(request.url).origin;
    const origin =
      requestOrigin && /^https?:\/\//i.test(requestOrigin) ? requestOrigin : fallbackOrigin;

    form.set(
      "success_url",
      `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`
    );
    form.set("cancel_url", `${origin}/?checkout=cancel`);

    const email = String(payload.customerEmail || "").trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.set("customer_email", email);
    }

    products.forEach((product, index) => {
      if (!product.active) {
        throw new Error(`${product.name || "A product"} is not currently available.`);
      }

      const regular = Number(product.price);
      const sale = Number(product.salePrice || 0);
      const amount = sale > 0 && sale < regular ? sale : regular;

      if (!Number.isInteger(amount) || amount < 50) {
        throw new Error(`${product.name || "A product"} has an invalid price.`);
      }

      form.set(`line_items[${index}][price_data][currency]`, "usd");
      form.set(`line_items[${index}][price_data][product_data][name]`, product.name || "Custom Product");
      form.set(`line_items[${index}][price_data][unit_amount]`, String(amount));
      form.set(`line_items[${index}][quantity]`, String(normalized[index].qty));
    });

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form
    });

    const stripeData = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error("Stripe Checkout error:", stripeData);
      return Response.json(
        { error: stripeData?.error?.message || "Stripe could not start checkout." },
        { status: 502 }
      );
    }

    return Response.json({ url: stripeData.url });
  } catch (error) {
    console.error("Checkout function error:", error);
    return Response.json(
      { error: error?.message || "Unable to create checkout." },
      { status: 500 }
    );
  }
};
