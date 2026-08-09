import {
  firestoreGet,
  firestorePatch,
  getBearerToken,
  sendEmail,
  verifyFirebaseIdToken,
} from "./_shared.mjs";

const ALLOWED_FIELDS = new Set([
  "status",
  "carrier",
  "trackingNumber",
  "trackingUrl",
]);

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error("Firebase project ID is not configured.");

    const bearer = getBearerToken(request);
    if (!bearer) return Response.json({ error: "Admin sign-in required." }, { status: 401 });

    const decoded = await verifyFirebaseIdToken(bearer, projectId);
    const adminUser = await firestoreGet(projectId, `users/${encodeURIComponent(decoded.sub)}`);

    if (!adminUser || adminUser.role !== "admin") {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    const payload = await request.json();
    const orderId = String(payload.orderId || "").trim();
    const incoming = payload.changes && typeof payload.changes === "object"
      ? payload.changes
      : {};

    if (!orderId) return Response.json({ error: "Order ID is required." }, { status: 400 });

    const order = await firestoreGet(projectId, `orders/${encodeURIComponent(orderId)}`);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });

    const changes = {};
    for (const [key,value] of Object.entries(incoming)) {
      if (ALLOWED_FIELDS.has(key)) changes[key] = String(value ?? "").slice(0,500);
    }
    changes.updatedAt = new Date().toISOString();

    await firestorePatch(projectId, `orders/${encodeURIComponent(orderId)}`, {
      ...order,
      ...changes,
    });

    const statusChanged = changes.status && changes.status !== order.status;
    const trackingChanged = changes.trackingNumber && changes.trackingNumber !== order.trackingNumber;

    if (order.customerEmail && (statusChanged || trackingChanged)) {
      const trackingHtml = changes.trackingNumber
        ? `<p><strong>${changes.carrier || "Carrier"}:</strong> ${changes.trackingNumber}</p>
           ${changes.trackingUrl ? `<p><a href="${changes.trackingUrl}">Track your package</a></p>` : ""}`
        : "";

      await sendEmail({
        to: order.customerEmail,
        subject: `Order ${order.orderNumber || orderId} update`,
        html: `<h2>Your order has been updated</h2>
          <p>Order <strong>${order.orderNumber || orderId}</strong></p>
          <p><strong>Status:</strong> ${changes.status || order.status || "Updated"}</p>
          ${trackingHtml}
          <p>Sign in at endlessbv.com to view your full order history.</p>`,
        text: `Order ${order.orderNumber || orderId} status: ${changes.status || order.status || "Updated"}. ${changes.trackingNumber ? `Tracking: ${changes.trackingNumber}` : ""}`
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("update-order error:", error);
    return Response.json({ error: error?.message || "Unable to update order." }, { status: 500 });
  }
};
