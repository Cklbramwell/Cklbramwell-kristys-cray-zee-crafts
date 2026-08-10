import OrderDetails from "../components/OrderDetails";

export default function Orders({ user, orders, notify, onOpenDesignStudio }) {
  const saveArtwork = async (order, file) => {
    const idToken = await user.getIdToken();
    const response = await fetch("/.netlify/functions/customer-order-update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        orderId: order.id,
        action: "add-artwork",
        file,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Unable to attach artwork to order.");
    }
  };

  const respondToProof = async (order, responseData) => {
    const idToken = await user.getIdToken();
    const response = await fetch("/.netlify/functions/customer-order-update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        orderId: order.id,
        action: "proof-response",
        ...responseData,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Unable to update proof.");
    }

    notify(
      responseData.decision === "approve"
        ? "Proof approved — thank you!"
        : "Your requested changes were sent."
    );
  };

  return (
    <section className="wrap">
      <div className="eyebrow">My account</div>
      <h2>Order History</h2>

      {!user ? (
        <div className="card">Please sign in to view your orders.</div>
      ) : orders.length ? (
        orders.map((order) => (
          <OrderDetails
              key={order.id}
              order={order}
              user={user}
              onArtworkSaved={saveArtwork}
              onProofResponse={respondToProof}
              notify={notify}
            /></div>
        ))
      ) : (
        <div className="card muted">No orders yet.</div>
      )}
    </section>
  );
}
