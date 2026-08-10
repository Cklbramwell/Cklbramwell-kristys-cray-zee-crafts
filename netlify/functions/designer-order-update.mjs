import {
  firestoreGet,
  firestorePatch,
  getBearerToken,
  verifyFirebaseIdToken,
} from "./_shared.mjs";

const ALLOWED_FIELDS = new Set([
  "status",
  "proofStatus",
  "proofUrl",
  "productionNotes",
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
      return Response.json({ error: "Sign-in required." }, { status: 401 });
    }

    const decoded = await verifyFirebaseIdToken(bearer, projectId);

    const userRecord = await firestoreGet(
      projectId,
      `users/${encodeURIComponent(decoded.sub)}`
    );

    if (!userRecord || !["admin", "designer"].includes(userRecord.role)) {
      return Response.json({ error: "Designer access required." }, { status: 403 });
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

    if (userRecord.role === "designer") {
      const assigned = String(order.designer || "").trim().toLowerCase();
      const names = [
        userRecord.name,
        userRecord.email,
        decoded.email,
      ]
        .filter(Boolean)
        .map((value) => String(value).trim().toLowerCase());

      if (!assigned || !names.includes(assigned)) {
        return Response.json(
          { error: "This order is not assigned to you." },
          { status: 403 }
        );
      }
    }

    const changes = {};
    for (const [key, value] of Object.entries(incoming)) {
      if (!ALLOWED_FIELDS.has(key)) continue;

      changes[key] = String(value ?? "").slice(
        0,
        key === "productionNotes" ? 5000 : 1500
      );
    }

    const now = new Date().toISOString();
    changes.updatedAt = now;

    if (changes.status && changes.status !== order.status) {
      const history = Array.isArray(order.statusHistory)
        ? [...order.statusHistory]
        : [];

      history.push({
        status: changes.status,
        at: now,
        updatedBy:
          userRecord.name ||
          userRecord.email ||
          decoded.email ||
          decoded.sub,
      });

      changes.statusHistory = history.slice(-100);
    }

    await firestorePatch(
      projectId,
      `orders/${encodeURIComponent(orderId)}`,
      {
        ...order,
        ...changes,
      }
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("designer-order-update error:", error);
    return Response.json(
      { error: error?.message || "Unable to update design job." },
      { status: 500 }
    );
  }
};
