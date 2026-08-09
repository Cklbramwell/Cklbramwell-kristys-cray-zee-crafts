import {
  ACTIVE_PRODUCTION_STATUSES,
  normalizeOrderStatus,
  orderNeededBy,
  orderNeedsRush,
} from "../config/production";

export default function ProductionBoard({ orders, onOpenOrder }) {
  return (
    <div className="production-board">
      {ACTIVE_PRODUCTION_STATUSES.map((status) => {
        const matching = orders.filter(
          (order) => normalizeOrderStatus(order.status) === status
        );

        return (
          <section className="production-column" key={status}>
            <div className="production-column-header">
              <b>{status}</b>
              <span>{matching.length}</span>
            </div>

            <div className="production-column-list">
              {matching.length ? (
                matching.map((order) => (
                  <button
                    key={order.id}
                    className={`production-ticket ${orderNeedsRush(order) ? "rush" : ""}`}
                    onClick={() => onOpenOrder(order.id)}
                  >
                    <div className="row space">
                      <b>{order.orderNumber || order.id}</b>
                      {orderNeedsRush(order) && <span className="rush-badge">RUSH</span>}
                    </div>

                    <span>{order.customerName || order.customerEmail || "Customer"}</span>

                    <small>
                      {(order.items || [])
                        .filter((item) => !item.isOrderAddOn)
                        .map((item) => `${item.name} × ${item.quantity}`)
                        .slice(0, 2)
                        .join(" • ") || "Order"}
                    </small>

                    {orderNeededBy(order) && (
                      <small className="due-label">Due {orderNeededBy(order)}</small>
                    )}

                    {(order.designer || order.printer) && (
                      <small>
                        {order.designer ? `Designer: ${order.designer}` : ""}
                        {order.designer && order.printer ? " • " : ""}
                        {order.printer ? `Printer: ${order.printer}` : ""}
                      </small>
                    )}
                  </button>
                ))
              ) : (
                <div className="production-empty">No orders</div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
