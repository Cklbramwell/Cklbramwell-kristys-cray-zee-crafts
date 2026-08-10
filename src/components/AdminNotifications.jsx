import { normalizeOrderStatus, orderNeedsRush } from "../config/production";

export default function AdminNotifications({ orders, seenIds, onOpenOrder, onMarkSeen }) {
  const newOrders = orders
    .filter((order) => normalizeOrderStatus(order.status) === "New Order")
    .filter((order) => !seenIds.includes(order.id))
    .slice(0, 8);

  if (!newOrders.length) return null;

  return (
    <section className="card admin-notification-panel">
      <div className="row space">
        <div>
          <div className="eyebrow">New order alert</div>
          <h3>{newOrders.length} new order{newOrders.length === 1 ? "" : "s"} waiting</h3>
        </div>

        <button className="btn secondary" onClick={() => onMarkSeen(newOrders.map((o) => o.id))}>
          Mark Seen
        </button>
      </div>

      <div className="admin-alert-list">
        {newOrders.map((order) => (
          <button
            key={order.id}
            className={`admin-alert-row ${orderNeedsRush(order) ? "rush" : ""}`}
            onClick={() => onOpenOrder(order.id)}
          >
            <div>
              <b>{order.orderNumber || order.id}</b>
              <span>{order.customerName || order.customerEmail || "Customer"}</span>
            </div>

            <div>
              {orderNeedsRush(order) && <span className="rush-badge">RUSH</span>}
              <strong>${((Number(order.total || 0)) / 100).toFixed(2)}</strong>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
