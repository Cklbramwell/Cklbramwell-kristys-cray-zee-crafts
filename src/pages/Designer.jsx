import { useMemo, useState } from "react";
import DesignerQueue from "../components/DesignerQueue";
import DesignerOrderWorkspace from "../components/DesignerOrderWorkspace";

export default function Designer({
  user,
  profile,
  orders,
  notify,
}) {
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const designerName =
    profile?.name ||
    user?.displayName ||
    profile?.email ||
    user?.email ||
    "";

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const updateOrder = async (order, changes) => {
    try {
      const idToken = await user.getIdToken();

      const response = await fetch("/.netlify/functions/designer-order-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          changes,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to update design job.");
      }

      notify("Designer update saved");
    } catch (error) {
      notify(error.message || "Unable to update design job.");
    }
  };

  const saveProof = async (order, uploaded) => {
    await updateOrder(order, {
      proofStatus: "Proof Sent",
      proofUrl: uploaded.url,
      status: "Proof Sent",
    });
  };

  if (!user) {
    return (
      <section className="wrap">
        <div className="card">Sign in to open the Designer Dashboard.</div>
      </section>
    );
  }

  if (!["admin", "designer"].includes(profile?.role)) {
    return (
      <section className="wrap">
        <div className="card">Designer access required.</div>
      </section>
    );
  }

  if (selectedOrder) {
    return (
      <DesignerOrderWorkspace
        order={selectedOrder}
        user={user}
        notify={notify}
        onUpdate={updateOrder}
        onProofSaved={saveProof}
        onBack={() => setSelectedOrderId(null)}
      />
    );
  }

  return (
    <section className="wrap">
      <div className="eyebrow">Designer Dashboard</div>
      <h1 className="page-title">Welcome, {profile?.name || "Designer"}.</h1>
      <p className="lead section-lead">
        Your assigned design jobs, artwork, proof status and due dates are all in one place.
      </p>

      <DesignerQueue
        orders={orders}
        currentUserName={designerName}
        onOpen={setSelectedOrderId}
      />
    </section>
  );
}
