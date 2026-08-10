import { useEffect, useState } from "react";
import { ConfigurationSummary } from "./CartView";
import AdminProofUploader from "./AdminProofUploader";
import ProductionExportPanel from "../editor/components/ProductionExportPanel";
import {
  PRIORITIES,
  PRODUCTION_STATUSES,
  PROOF_STATUSES,
  normalizeOrderStatus,
  orderNeededBy,
  orderNeedsRush,
} from "../config/production";
import { money } from "../utils";

export default function ProductionOrderCard({
  order,
  onUpdate,
  onPrintInvoice,
  onPrintPackingSlip,
  user,
  notify,
  onProofSaved,
  expanded = false,
  onToggle,
}) {
  const [status, setStatus] = useState(normalizeOrderStatus(order.status));
  const [designer, setDesigner] = useState(order.designer || "");
  const [printer, setPrinter] = useState(order.printer || "");
  const [priority, setPriority] = useState(
    order.priority || (orderNeedsRush(order) ? "Rush" : "Normal")
  );
  const [dueDate, setDueDate] = useState(order.dueDate || orderNeededBy(order) || "");
  const [proofStatus, setProofStatus] = useState(order.proofStatus || "Not Started");
  const [proofUrl, setProofUrl] = useState(order.proofUrl || "");
  const [internalNotes, setInternalNotes] = useState(order.internalNotes || "");
  const [productionNotes, setProductionNotes] = useState(order.productionNotes || "");

  useEffect(() => {
    setStatus(normalizeOrderStatus(order.status));
    setDesigner(order.designer || "");
    setPrinter(order.printer || "");
    setPriority(order.priority || (orderNeedsRush(order) ? "Rush" : "Normal"));
    setDueDate(order.dueDate || orderNeededBy(order) || "");
    setProofStatus(order.proofStatus || "Not Started");
    setProofUrl(order.proofUrl || "");
    setInternalNotes(order.internalNotes || "");
    setProductionNotes(order.productionNotes || "");
  }, [order]);

  const save = () =>
    onUpdate(order, {
      status,
      designer,
      printer,
      priority,
      dueDate,
      proofStatus,
      proofUrl,
      internalNotes,
      productionNotes,
    });

  return (
    <article
      id={`admin-order-${order.id}`}
      className={`card production-order-card ${orderNeedsRush(order) ? "rush-order" : ""}`}
    >
      <button className="production-order-summary" onClick={onToggle}>
        <div>
          <div className="row">
            <h3>{order.orderNumber || order.id}</h3>
            {orderNeedsRush(order) && <span className="rush-badge">RUSH</span>}
            <span className="status">{normalizeOrderStatus(order.status)}</span>
          </div>
          <div className="muted">
            {order.customerName || "Customer"} • {order.customerEmail || ""}
          </div>
        </div>

        <div className="order-summary-right">
          <strong className="price">{money(order.total || 0)}</strong>
          <span>{expanded ? "Hide Details ↑" : "Open Order ↓"}</span>
        </div>
      </button>

      {expanded && (
        <div className="production-order-details">
          <div className="admin-order-grid">
            <section className="admin-order-section">
              <h4>Order Items</h4>
              {(order.items || []).map((item, index) => (
                <div className="item" key={`${order.id}-${index}`}>
                  <div className="row space">
                    <div>
                      <b>{item.name || "Product"}</b>
                      <div className="muted">
                        Qty {item.quantity || 0}
                        {item.size ? ` • ${item.size}` : ""}
                        {item.color ? ` • ${item.color}` : ""}
                      </div>
                    </div>
                    <strong>{money(item.amountTotal || 0)}</strong>
                  </div>
                  <ConfigurationSummary options={item} />
                </div>
              ))}
            </section>

            <section className="admin-order-section">
              <h4>Customer & Deadline</h4>
              <p><b>Name:</b> {order.customerName || "—"}</p>
              <p><b>Email:</b> {order.customerEmail || "—"}</p>
              <p><b>Phone:</b> {order.customerPhone || "—"}</p>
              <p><b>Needed By:</b> {orderNeededBy(order) || "—"}</p>
              <p><b>Payment:</b> {order.paymentStatus || "—"}</p>
            </section>
          </div>

          <section className="admin-customer-artwork">
            <div className="row space">
              <div>
                <h4>Customer Artwork & Proofs</h4>
                <p className="muted">Files uploaded by the customer for this order.</p>
              </div>
            </div>

            {(order.customerArtwork || []).length ? (
              <div className="admin-file-grid">
                {(order.customerArtwork || []).map((file, index) => (
                  <a
                    className="admin-file-card"
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    key={`${file.url}-${index}`}
                  >
                    <span>{file.kind === "inspiration" ? "🖼️" : "📎"}</span>
                    <div>
                      <b>{file.name || "Customer file"}</b>
                      <small>{file.kind || "artwork"}</small>
                    </div>
                    <span>Open ↗</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="muted">Customer has not uploaded artwork yet.</p>
            )}

            <AdminProofUploader
              order={order}
              user={user}
              onProofSaved={onProofSaved}
              notify={notify}
            />
          </section>

          <ProductionExportPanel order={order} notify={notify} />

          <section className="production-control-panel">
            <h4>Production Control</h4>
            <div className="form">
              <label className="field">
                <span>Production Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {PRODUCTION_STATUSES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Priority</span>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {PRIORITIES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Designer</span>
                <input
                  value={designer}
                  onChange={(e) => setDesigner(e.target.value)}
                  placeholder="Assign designer"
                />
              </label>

              <label className="field">
                <span>Printer / Production</span>
                <input
                  value={printer}
                  onChange={(e) => setPrinter(e.target.value)}
                  placeholder="Assign printer / production"
                />
              </label>

              <label className="field">
                <span>Production Due Date</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Proof Status</span>
                <select
                  value={proofStatus}
                  onChange={(e) => setProofStatus(e.target.value)}
                >
                  {PROOF_STATUSES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>

              <label className="field full">
                <span>Proof URL</span>
                <input
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="Paste proof link here"
                />
              </label>

              <label className="field full">
                <span>Production Notes</span>
                <textarea
                  value={productionNotes}
                  onChange={(e) => setProductionNotes(e.target.value)}
                  placeholder="Printing instructions, materials, special production notes..."
                />
              </label>

              <label className="field full">
                <span>Internal Notes</span>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Private notes for your team. Customers do not see these."
                />
              </label>
            </div>

            <div className="row production-actions">
              <button className="btn primary" onClick={save}>
                Save Production Update
              </button>
              <button className="btn secondary" onClick={() => onPrintInvoice(order)}>
                Print Invoice
              </button>
              <button className="btn secondary" onClick={() => onPrintPackingSlip(order)}>
                Print Packing Slip
              </button>
              {proofUrl && (
                <a className="btn secondary" href={proofUrl} target="_blank" rel="noreferrer">
                  Open Proof
                </a>
              )}
            </div>
          </section>

          <div className="admin-order-grid">
            <section className="admin-order-section">
              <h4>Shipping / Tracking</h4>
              <TrackingEditor order={order} onUpdate={onUpdate} />
            </section>

            <section className="admin-order-section">
              <h4>Status History</h4>
              {(order.statusHistory || []).length ? (
                <div className="status-history">
                  {[...(order.statusHistory || [])].reverse().map((entry, index) => (
                    <div className="status-history-row" key={`${entry.at}-${index}`}>
                      <b>{entry.status}</b>
                      <span>{formatDateTime(entry.at)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Status history starts with the next production update.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </article>
  );
}

function TrackingEditor({ order, onUpdate }) {
  const [carrier, setCarrier] = useState(order.carrier || "");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || "");

  return (
    <div className="tracking-editor">
      <label className="field">
        <span>Carrier</span>
        <input value={carrier} onChange={(e) => setCarrier(e.target.value)} />
      </label>
      <label className="field">
        <span>Tracking Number</span>
        <input
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Tracking URL</span>
        <input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
      </label>

      <button
        className="btn secondary"
        onClick={() =>
          onUpdate(order, {
            carrier,
            trackingNumber,
            trackingUrl,
            status: trackingNumber ? "Shipped" : normalizeOrderStatus(order.status),
          })
        }
      >
        Save Tracking
      </button>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
