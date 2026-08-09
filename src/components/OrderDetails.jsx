import { money } from "../utils";
import { ConfigurationSummary } from "./CartView";
import {
  PRODUCTION_STATUSES,
  normalizeOrderStatus,
  statusProgress,
} from "../config/production";

export default function OrderDetails({ order }) {
  const currentStatus = normalizeOrderStatus(order.status);

  return (
    <article className="card order-card customer-order-card">
      <div className="row space">
        <div>
          <h3>{order.orderNumber || order.id}</h3>
          <div className="muted">
            {order.customerName || "Customer"} • {order.customerEmail || ""}
          </div>
        </div>
        <span className="status">{currentStatus}</span>
      </div>

      <ProductionTimeline status={currentStatus} />

      {order.proofStatus && order.proofStatus !== "Not Started" && (
        <div className="customer-proof-box">
          <div>
            <b>Artwork Proof</b>
            <span>{order.proofStatus}</span>
          </div>
          {order.proofUrl && (
            <a
              className="btn secondary"
              href={order.proofUrl}
              target="_blank"
              rel="noreferrer"
            >
              View Proof
            </a>
          )}
        </div>
      )}

      <section className="order-section">
        <h4>Items Purchased</h4>
        {(order.items || []).length ? (
          order.items.map((item, index) => (
            <div className="item order-line" key={`${order.id}-item-${index}`}>
              <div className="row space">
                <div>
                  <b>{item.name || "Product"}</b>
                  <div className="muted">Quantity: {item.quantity || 0}</div>
                </div>
                <div className="order-price">
                  {item.unitAmount != null && <div>{money(item.unitAmount)} each</div>}
                  <div className="price">{money(item.amountTotal || 0)}</div>
                </div>
              </div>

              <ConfigurationSummary options={item} />
            </div>
          ))
        ) : (
          <p className="muted">No item details were saved for this order.</p>
        )}
      </section>

      <div className="grid g2 order-grid">
        <div className="card">
          <h4>Delivery</h4>

          {order.shippingAddress ? (
            <address>
              {order.shippingAddress.line1 || ""}
              {order.shippingAddress.line2 && (
                <>
                  <br />
                  {order.shippingAddress.line2}
                </>
              )}
              <br />
              {order.shippingAddress.city || ""}
              {order.shippingAddress.city && order.shippingAddress.state ? ", " : ""}
              {order.shippingAddress.state || ""}{" "}
              {order.shippingAddress.postalCode || ""}
              <br />
              {order.shippingAddress.country || ""}
            </address>
          ) : (
            <p className="muted">Pickup / shipping details will appear here.</p>
          )}

          <div className="tracking-summary">
            <h4>Tracking</h4>
            {order.trackingNumber ? (
              <>
                <p>
                  <b>{order.carrier || "Carrier"}:</b> {order.trackingNumber}
                </p>
                {order.trackingUrl && (
                  <a href={order.trackingUrl} target="_blank" rel="noreferrer">
                    Track package
                  </a>
                )}
              </>
            ) : (
              <p className="muted">
                Tracking will appear here once your order ships.
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <h4>Payment & Schedule</h4>
          <div className="row space">
            <span>Subtotal</span>
            <b>{money(order.subtotal || 0)}</b>
          </div>
          <div className="row space total-row">
            <span>Total</span>
            <span className="price">{money(order.total || 0)}</span>
          </div>
          <p>
            <b>Payment Status:</b> {order.paymentStatus || "—"}
          </p>
          {order.dueDate && (
            <p>
              <b>Production Due Date:</b> {order.dueDate}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function ProductionTimeline({ status }) {
  const steps = PRODUCTION_STATUSES.filter(
    (value) =>
      !["Cancelled", "Shipped"].includes(value) &&
      value !== "Ready for Pickup"
  );

  const displaySteps = [
    "New Order",
    "Designing",
    "Proof Sent",
    "Proof Approved",
    "Printing",
    "Quality Check",
    status === "Shipped" ? "Shipped" : "Ready for Pickup",
    "Completed",
  ];

  const currentIndex =
    status === "Cancelled"
      ? -1
      : displaySteps.indexOf(status) >= 0
        ? displaySteps.indexOf(status)
        : statusProgress(status);

  return (
    <div className="customer-production">
      <div className="production-progress-track">
        {displaySteps.map((step, index) => {
          const complete = currentIndex >= index;
          const active = currentIndex === index;

          return (
            <div
              className={`production-progress-step ${complete ? "complete" : ""} ${
                active ? "active" : ""
              }`}
              key={step}
            >
              <span>{complete ? "✓" : index + 1}</span>
              <small>{step}</small>
            </div>
          );
        })}
      </div>

      {status === "Cancelled" && (
        <div className="notice production-cancelled">
          This order is marked Cancelled. Contact us if you have questions.
        </div>
      )}
    </div>
  );
}
