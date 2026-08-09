import OrderDetails from "../components/OrderDetails";

export default function Orders({ user, orders }) {
  return (
    <section className="wrap">
      <div className="eyebrow">My account</div>
      <h2>Order History</h2>

      {!user ? (
        <div className="card">Please sign in to view your orders.</div>
      ) : orders.length ? (
        orders.map((order) => (
          <OrderDetails key={order.id} order={order} />
        ))
      ) : (
        <div className="card muted">No orders yet.</div>
      )}
    </section>
  );
}
