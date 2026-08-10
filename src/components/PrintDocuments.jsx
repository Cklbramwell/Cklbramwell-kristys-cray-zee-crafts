import { money } from "../utils";

export function InvoiceDocument({ order }) {
  const items = (order.items || []).filter((item) => !item.isOrderAddOn);

  return (
    <div className="print-document invoice-document">
      <PrintHeader title="INVOICE" order={order} />

      <div className="print-two-col">
        <section>
          <h3>Bill To</h3>
          <p><b>{order.customerName || "Customer"}</b></p>
          <p>{order.customerEmail || ""}</p>
          <p>{order.customerPhone || ""}</p>
        </section>

        <section>
          <h3>Order Details</h3>
          <p><b>Order:</b> {order.orderNumber || order.id}</p>
          <p><b>Status:</b> {order.status || "New Order"}</p>
          <p><b>Payment:</b> {order.paymentStatus || "—"}</p>
          {order.dueDate && <p><b>Due:</b> {order.dueDate}</p>}
        </section>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Configuration</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${order.id}-${index}`}>
              <td>{item.name || "Product"}</td>
              <td>{configurationText(item)}</td>
              <td>{item.quantity || 0}</td>
              <td>{money(item.unitAmount || 0)}</td>
              <td>{money(item.amountTotal || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="print-totals">
        <div><span>Subtotal</span><b>{money(order.subtotal || 0)}</b></div>
        <div className="grand"><span>Total</span><b>{money(order.total || 0)}</b></div>
      </div>

      <div className="print-note">
        <b>Thank you for choosing Kristy's Cray-Zee Crafts!</b>
        <p>Made with creativity. Crafted with care.</p>
      </div>
    </div>
  );
}

export function PackingSlipDocument({ order }) {
  const items = (order.items || []).filter((item) => !item.isOrderAddOn);

  return (
    <div className="print-document packing-slip-document">
      <PrintHeader title="PACKING SLIP" order={order} />

      <div className="print-two-col">
        <section>
          <h3>Customer</h3>
          <p><b>{order.customerName || "Customer"}</b></p>
          <p>{order.customerEmail || ""}</p>
          <p>{order.customerPhone || ""}</p>
        </section>

        <section>
          <h3>Delivery</h3>
          {order.shippingAddress ? (
            <address>
              {order.shippingAddress.line1 || ""}<br />
              {order.shippingAddress.line2 ? <>{order.shippingAddress.line2}<br /></> : null}
              {order.shippingAddress.city || ""}
              {order.shippingAddress.city && order.shippingAddress.state ? ", " : ""}
              {order.shippingAddress.state || ""} {order.shippingAddress.postalCode || ""}
            </address>
          ) : (
            <p>Local Pickup</p>
          )}
        </section>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th>Pack</th>
            <th>Item</th>
            <th>Configuration</th>
            <th>Qty</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${order.id}-${index}`}>
              <td className="pack-check">☐</td>
              <td>{item.name || "Product"}</td>
              <td>{configurationText(item)}</td>
              <td>{item.quantity || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="packing-production-box">
        <h3>Production Check</h3>
        <div className="packing-check-grid">
          <span>☐ Design matches approved proof</span>
          <span>☐ Correct size / color</span>
          <span>☐ Correct personalization</span>
          <span>☐ Quality check completed</span>
          <span>☐ All items packed</span>
          <span>☐ Customer label attached</span>
        </div>
      </div>

      <div className="packing-signoff">
        <span>Packed by: __________________________</span>
        <span>Date: __________________</span>
      </div>
    </div>
  );
}

function PrintHeader({ title, order }) {
  return (
    <header className="print-header">
      <div className="print-brand">
        <img src="/assets/kristys-logo.png" alt="Kristy's Cray-Zee Crafts" />
        <div>
          <h1>Kristy's Cray-Zee Crafts</h1>
          <p>832-901-3433</p>
          <p>Design@Endlessbv.com</p>
        </div>
      </div>

      <div className="print-doc-title">
        <h2>{title}</h2>
        <p>{order.orderNumber || order.id}</p>
      </div>
    </header>
  );
}

function configurationText(item) {
  const parts = [
    item.templateLabel,
    item.drinkwareType,
    item.marketingProductType,
    item.laserItemType,
    item.size,
    item.color,
    item.printLocation,
    item.printMethod,
    item.sleevePrint === "Yes" ? "Sleeve Print" : "",
    item.personalization ? `Personalized: ${item.personalization}` : "",
    item.wrapStyle,
    item.laserMaterial,
    item.engravingSides,
    item.engravingText ? `Engraving: ${item.engravingText}` : "",
  ].filter(Boolean);

  return parts.join(" • ") || "Custom configuration";
}
