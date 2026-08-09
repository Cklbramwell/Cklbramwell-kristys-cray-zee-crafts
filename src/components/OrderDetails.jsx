import { money } from "../utils";
import { ConfigurationSummary } from "./CartView";

export default function OrderDetails({ order, admin = false, onUpdate }) {
  return (
    <article className="card order-card">
      <div className="row space">
        <div>
          <h3>{order.orderNumber || order.id}</h3>
          <div className="muted">{order.customerName || "Customer"}</div>
          <div className="muted">{order.customerEmail || ""}</div>
          {order.customerPhone && <div className="muted">{order.customerPhone}</div>}
        </div>

        {admin && onUpdate ? (
          <select
            value={order.status || "Paid"}
            onChange={(event) => onUpdate(order, { status: event.target.value })}
          >
            <option>Paid</option>
            <option>Designing</option>
            <option>Waiting for Approval</option>
            <option>Ready for Pickup</option>
            <option>Shipped</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        ) : (
          <span className="status">{order.status || "Paid"}</span>
        )}
      </div>

      <section className="order-section">
        <h4>Items Purchased</h4>
        {(order.items || []).length ? (
          order.items.map((item, index) => (
            <div className="item order-line" key={`${order.id}-item-${index}`}>
              <div className="row space">
                <div>
                  <b>{item.name || "Product"}</b>
                  <div className="muted">Quantity: {item.quantity || 0}</div>
                  {item.productId && <div className="muted">Product ID: {item.productId}</div>}
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
          <h4>Shipping Address</h4>
          {order.shippingAddress ? (
            <address>
              {order.shippingAddress.line1 || ""}
              {order.shippingAddress.line2 && <><br />{order.shippingAddress.line2}</>}
              <br />
              {order.shippingAddress.city || ""}
              {order.shippingAddress.city && order.shippingAddress.state ? ", " : ""}
              {order.shippingAddress.state || ""} {order.shippingAddress.postalCode || ""}
              <br />
              {order.shippingAddress.country || ""}
            </address>
          ) : (
            <p className="muted">No shipping address saved.</p>
          )}

          {admin && onUpdate && (
            <TrackingEditor order={order} onUpdate={onUpdate} />
          )}

          {!admin && (
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
          )}
        </div>

        <div className="card">
          <h4>Payment</h4>
          <div className="row space">
            <span>Subtotal</span>
            <b>{money(order.subtotal || 0)}</b>
          </div>
          <div className="row space total-row">
            <span>Total</span>
            <span className="price">{money(order.total || 0)}</span>
          </div>
          <p><b>Payment Status:</b> {order.paymentStatus || "—"}</p>
          {admin && (
            <details>
              <summary>Stripe / Technical Details</summary>
              <p className="technical"><b>Payment Intent:</b><br />{order.paymentIntentId || "—"}</p>
              <p className="technical"><b>Stripe Session:</b><br />{order.stripeSessionId || "—"}</p>
              <p className="technical"><b>Firebase User ID:</b><br />{order.userId || "—"}</p>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}

function TrackingEditor({ order, onUpdate }) {
  const save = () => {
    const carrier = document.getElementById(`carrier-${order.id}`)?.value || "";
    const trackingNumber =
      document.getElementById(`tracking-${order.id}`)?.value || "";
    const trackingUrl =
      document.getElementById(`tracking-url-${order.id}`)?.value || "";

    onUpdate(order, {
      carrier,
      trackingNumber,
      trackingUrl,
      status: trackingNumber ? "Shipped" : order.status || "Paid",
    });
  };

  return (
    <div className="tracking-editor">
      <h4>Tracking</h4>
      <label className="field">
        <span>Carrier</span>
        <input id={`carrier-${order.id}`} defaultValue={order.carrier || ""} />
      </label>
      <label className="field">
        <span>Tracking Number</span>
        <input
          id={`tracking-${order.id}`}
          defaultValue={order.trackingNumber || ""}
        />
      </label>
      <label className="field">
        <span>Tracking URL</span>
        <input
          id={`tracking-url-${order.id}`}
          defaultValue={order.trackingUrl || ""}
        />
      </label>
      <button className="btn primary" onClick={save}>
        Save Tracking
      </button>
    </div>
  );
}
