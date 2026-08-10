import {
  firestoreGet,
  firestorePatch,
  getBearerToken,
  sendEmail,
  verifyFirebaseIdToken,
} from "./_shared.mjs";

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error("Firebase project ID is not configured.");

    const bearer = getBearerToken(request);
    if (!bearer) {
      return Response.json({ error: "Sign-in required." }, { status: 401 });
    }

    const decoded = await verifyFirebaseIdToken(bearer, projectId);
    const payload = await request.json();

    const orderId = String(payload.orderId || "").trim();
    const action = String(payload.action || "").trim();

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

    const ownsOrder =
      order.customerUid === decoded.sub ||
      order.userId === decoded.sub ||
      order.uid === decoded.sub;

    if (!ownsOrder) {
      return Response.json({ error: "You do not have access to this order." }, { status: 403 });
    }

    const now = new Date().toISOString();
    const changes = { updatedAt: now };

    if (action === "add-artwork") {
      const file = payload.file && typeof payload.file === "object" ? payload.file : null;
      if (!file?.url) {
        return Response.json({ error: "Uploaded file details are missing." }, { status: 400 });
      }

      const existing = Array.isArray(order.customerArtwork)
        ? [...order.customerArtwork]
        : [];

      existing.push({
        name: String(file.name || "Artwork").slice(0, 255),
        url: String(file.url).slice(0, 3000),
        path: String(file.path || "").slice(0, 1500),
        contentType: String(file.contentType || "").slice(0, 200),
        size: Number(file.size || 0),
        uploadedAt: String(file.uploadedAt || now),
        kind: String(file.kind || "artwork").slice(0, 50),
      });

      changes.customerArtwork = existing.slice(-30);
    } else if (action === "proof-response") {
      const decision = String(payload.decision || "").toLowerCase();
      const revisionNotes = String(payload.revisionNotes || "").trim().slice(0, 5000);

      if (!order.proofUrl) {
        return Response.json({ error: "There is no proof ready for this order." }, { status: 400 });
      }

      if (decision === "approve") {
        changes.proofStatus = "Approved";
        changes.status = "Proof Approved";
        changes.proofApprovedAt = now;
        changes.proofRevisionNotes = "";

        const history = Array.isArray(order.statusHistory)
          ? [...order.statusHistory]
          : [];

        history.push({
          status: "Proof Approved",
          at: now,
          updatedBy: order.customerName || order.customerEmail || decoded.sub,
        });

        changes.statusHistory = history.slice(-100);
      } else if (decision === "changes") {
        if (!revisionNotes) {
          return Response.json({ error: "Please enter the requested changes." }, { status: 400 });
        }

        changes.proofStatus = "Changes Requested";
        changes.status = "Designing";
        changes.proofRevisionNotes = revisionNotes;
        changes.proofChangesRequestedAt = now;

        const history = Array.isArray(order.statusHistory)
          ? [...order.statusHistory]
          : [];

        history.push({
          status: "Changes Requested",
          at: now,
          updatedBy: order.customerName || order.customerEmail || decoded.sub,
        });

        changes.statusHistory = history.slice(-100);
      } else {
        return Response.json({ error: "Invalid proof response." }, { status: 400 });
      }

      const adminEmail = process.env.ADMIN_ORDER_EMAIL;
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `Proof ${decision === "approve" ? "approved" : "changes requested"} — ${order.orderNumber || orderId}`,
          html: `<h2>Customer proof response</h2>
            <p><strong>Order:</strong> ${escapeHtml(order.orderNumber || orderId)}</p>
            <p><strong>Customer:</strong> ${escapeHtml(order.customerName || order.customerEmail || "Customer")}</p>
            <p><strong>Response:</strong> ${decision === "approve" ? "APPROVED" : "CHANGES REQUESTED"}</p>
            ${revisionNotes ? `<p><strong>Requested changes:</strong><br>${escapeHtml(revisionNotes)}</p>` : ""}`,
          text: `Order ${order.orderNumber || orderId}: customer ${decision === "approve" ? "approved the proof" : `requested changes: ${revisionNotes}`}.`,
        });
      }
    } else {
      return Response.json({ error: "Unsupported action." }, { status: 400 });
    }

    await firestorePatch(
      projectId,
      `orders/${encodeURIComponent(orderId)}`,
      { ...order, ...changes }
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("customer-order-update error:", error);
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
