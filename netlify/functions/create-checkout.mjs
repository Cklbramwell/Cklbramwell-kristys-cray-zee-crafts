import Stripe from "stripe";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseAdmin() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");
    const serviceAccount = JSON.parse(raw);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return {
    auth: getAuth(),
    firestore: getFirestore()
  };
}

function bearerToken(request) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice(7).trim();
}

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY is not configured.");

    const token = bearerToken(request);
    if (!token) {
      return Response.json({ error: "Please sign in before checkout." }, { status: 401 });
    }

    const { auth, firestore } = getFirebaseAdmin();
    const decoded = await auth.verifyIdToken(token);

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
      if (!item.id || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) {
        return Response.json({ error: "One or more cart items are invalid." }, { status: 400 });
      }
    }

    const products = [];
    for (const item of normalized) {
      const snap = await firestore.collection("products").doc(item.id).get();
      if (!snap.exists) {
        return Response.json({ error: `A product in your cart no longer exists.` }, { status: 400 });
      }
      const product = { id: snap.id, ...snap.data() };
      if (product.active === false) {
        return Response.json({ error: `${product.name || "A product"} is not currently available.` }, { status: 400 });
      }

      const regular = Number(product.price || 0);
      const sale = Number(product.salePrice || 0);
      const amount = sale > 0 && sale < regular ? sale : regular;
      if (!Number.isInteger(amount) || amount < 50) {
        return Response.json({ error: `${product.name || "A product"} has an invalid price.` }, { status: 400 });
      }

      products.push({ ...product, checkoutAmount: amount, qty: item.qty });
    }

    const stripe = new Stripe(stripeSecret);
    const originHeader = request.headers.get("origin");
    const origin = originHeader && /^https?:\/\//i.test(originHeader)
      ? originHeader
      : new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: decoded.email || undefined,
      client_reference_id: decoded.uid,
      metadata: {
        firebaseUid: decoded.uid
      },
      line_items: products.map((p) => ({
        quantity: p.qty,
        price_data: {
          currency: "usd",
          unit_amount: p.checkoutAmount,
          product_data: {
            name: p.name || "Custom Product",
            metadata: {
              firestoreProductId: p.id
            }
          }
        }
      })),
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancel`
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("create-checkout error", error);
    return Response.json(
      { error: error?.message || "Unable to create checkout." },
      { status: 500 }
    );
  }
};
