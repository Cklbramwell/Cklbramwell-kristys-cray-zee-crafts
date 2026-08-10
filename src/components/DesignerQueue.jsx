import {
  normalizeOrderStatus,
  orderNeededBy,
  orderNeedsRush,
} from "../config/production";

export default function DesignerQueue({
  orders,
  currentUserName,
  onOpen,
}) {
  const normalizedName = String(currentUserName || "").trim().toLowerCase();

  const assigned = orders.filter((order) => {
    if (!normalizedName) return false;
    return String(order.designer || "").trim().toLowerCase() === normalizedName;
  });

  const active = assigned.filter(
    (order) => !["Completed", "Cancelled"].includes(normalizeOrderStatus(order.status))
  );

  return (
    <section className="designer-queue">
      <div className="row space">
        <div>
          <div className="eyebrow">My Work Queue</div>
          <h2>{active.length} active design job{active.length === 1 ? "" : "s"}</h2>
        </div>
      </div>

      <div className="designer-job-grid">
        {active.length ? (
          active.map((order) => (
            <button
              className={`designer-job-card ${orderNeedsRush(order) ? "rush" : ""}`}
              onClick={() => onOpen(order.id)}
              key={order.id}
            >
              <div className="row space">
                <b>{order.orderNumber || order.id}</b>
                {orderNeedsRush(order) && <span className="rush-badge">RUSH</span>}
              </div>

              <span>{order.customerName || order.customerEmail || "Customer"}</span>

              <small>
                {(order.items || [])
                  .filter((item) => !item.isOrderAddOn)
                  .map((item) => item.name)
                  .slice(0, 2)
                  .join(" • ") || "Custom Order"}
              </small>

              <div className="designer-job-meta">
                <span>Status: {normalizeOrderStatus(order.status)}</span>
                <span>Proof: {order.proofStatus || "Not Started"}</span>
                {orderNeededBy(order) && <span>Due: {orderNeededBy(order)}</span>}
              </div>
            </button>
          ))
        ) : (
          <div className="card muted">No active jobs assigned to you.</div>
        )}
      </div>
    </section>
  );
}
