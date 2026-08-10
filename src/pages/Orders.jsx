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
      <div className="eyebrow">My Account</div>
      <h1 className="page-title">My Orders</h1>

      {!user ? (
        <div className="card">
          <h3>Sign in to view your orders.</h3>
        </div>
      ) : orders.length ? (
        <div className="orders-stack">
          {orders.map((order) => (
            <div key={order.id} className="customer-order-shell">
              <div className="row customer-order-actions">
                <button
                  className="btn secondary"
                  onClick={() => onOpenDesignStudio(order.id)}
                >
                  Open Design Studio
                </button>
              </div>

              <OrderDetails
                order={order}
                user={user}
                onArtworkSaved={saveArtwork}
                onProofResponse={respondToProof}
                notify={notify}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <h3>No orders yet.</h3>
          <p className="muted">
            Your paid orders will appear here after checkout.
          </p>
        </div>
      )}
    </section>
  );
}
