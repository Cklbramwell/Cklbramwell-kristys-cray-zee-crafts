import {
  firestoreGet,
  firestorePatch,
  getBearerToken,
  sendEmail,
  verifyFirebaseIdToken,
} from "./_shared.mjs";

const ALLOWED_STRING_FIELDS = new Set([
  "status",
  "carrier",
  "trackingNumber",
  "trackingUrl",
  "designer",
  "printer",
  "priority",
  "dueDate",
  "proofStatus",
  "proofUrl",
  "internalNotes",
  "productionNotes",
]);

const CUSTOMER_VISIBLE_UPDATE_FIELDS = new Set([
  "status",
  "trackingNumber",
  "trackingUrl",
  "carrier",
  "proofStatus",
  "proofUrl",
  "dueDate",
]);

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error("Firebase project ID is not configured.");

    const bearer = getBearerToken(request);
    if (!bearer) {
      return Response.json({ error: "Admin sign-in required." }, { status: 401 });
    }

    const decoded = await verifyFirebaseIdToken(bearer, projectId);
    const adminUser = await firestoreGet(
      projectId,
      `users/${encodeURIComponent(decoded.sub)}`
    );

    if (!adminUser || adminUser.role !== "admin") {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    const payload = await request.json();
    const orderId = String(payload.orderId || "").trim();
    const incoming =
      payload.changes && typeof payload.changes === "object"
        ? payload.changes
        : {};

    if (!orderId) {
      return Response.json({ error: "Order ID is required." }, { status: 400 });
    }

    const order = await firestoreGet(
      projectId,
      `orders/${encodeURIComponent(orderId)}`
    );

    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    const changes = {};
    for (const [key, value] of Object.entries(incoming)) {
      if (ALLOWED_STRING_FIELDS.has(key)) {
        const limit =
          key === "internalNotes" || key === "productionNotes" ? 5000 : 1000;
        changes[key] = String(value ?? "").slice(0, limit);
      }
    }

    const now = new Date().toISOString();
    changes.updatedAt = now;

    const statusChanged =
      changes.status && changes.status !== (order.status || "New Order");

    if (statusChanged) {
      const history = Array.isArray(order.statusHistory)
        ? [...order.statusHistory]
        : [];

      history.push({
        status: changes.status,
        at: now,
        updatedBy: adminUser.name || adminUser.email || decoded.sub,
      });

      changes.statusHistory = history.slice(-100);
    }

    const updatedOrder = {
      ...order,
      ...changes,
    };

    await firestorePatch(
      projectId,
      `orders/${encodeURIComponent(orderId)}`,
      updatedOrder
    );

    const customerVisibleChange = Object.keys(changes).some(
      (key) =>
        CUSTOMER_VISIBLE_UPDATE_FIELDS.has(key) &&
        String(changes[key] ?? "") !== String(order[key] ?? "")
    );

    if (order.customerEmail && customerVisibleChange) {
      const effectiveStatus = changes.status || order.status || "New Order";
      const effectiveProof = changes.proofStatus || order.proofStatus || "";
      const effectiveProofUrl = changes.proofUrl || order.proofUrl || "";
      const effectiveTracking =
        changes.trackingNumber || order.trackingNumber || "";
      const effectiveCarrier = changes.carrier || order.carrier || "";
      const effectiveTrackingUrl =
        changes.trackingUrl || order.trackingUrl || "";
      const effectiveDueDate = changes.dueDate || order.dueDate || "";

      const proofHtml =
        effectiveProof && effectiveProof !== "Not Started"
          ? `<p><strong>Proof Status:</strong> ${escapeHtml(effectiveProof)}</p>
             ${
               effectiveProofUrl
                 ? `<p><a href="${escapeAttribute(effectiveProofUrl)}">View your proof</a></p>`
                 : ""
             }`
          : "";

      const trackingHtml = effectiveTracking
        ? `<p><strong>${escapeHtml(effectiveCarrier || "Carrier")}:</strong> ${escapeHtml(effectiveTracking)}</p>
           ${
             effectiveTrackingUrl
               ? `<p><a href="${escapeAttribute(effectiveTrackingUrl)}">Track your package</a></p>`
               : ""
           }`
        : "";

      const dueHtml = effectiveDueDate
        ? `<p><strong>Current Production Due Date:</strong> ${escapeHtml(effectiveDueDate)}</p>`
        : "";

      await sendEmail({
        to: order.customerEmail,
        subject: `Order ${order.orderNumber || orderId} update`,
        html: `<h2>Your order has been updated</h2>
          <p>Order <strong>${escapeHtml(order.orderNumber || orderId)}</strong></p>
          <p><strong>Status:</strong> ${escapeHtml(effectiveStatus)}</p>
          ${proofHtml}
          ${dueHtml}
          ${trackingHtml}
          <p>Sign in to your account to view your full order progress.</p>`,
        text: `Order ${order.orderNumber || orderId} status: ${effectiveStatus}. ${
          effectiveProof ? `Proof: ${effectiveProof}. ` : ""
        }${effectiveDueDate ? `Due date: ${effectiveDueDate}. ` : ""}${
          effectiveTracking ? `Tracking: ${effectiveTracking}.` : ""
        }`,
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("update-order error:", error);
    return Response.json(
      { error: error?.message || "Unable to update order." },
      { status: 500 }
    );
  }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
