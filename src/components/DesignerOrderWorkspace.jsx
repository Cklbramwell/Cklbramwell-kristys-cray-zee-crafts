import { useState } from "react";
import AdminProofUploader from "./AdminProofUploader";
import ProductionExportPanel from "../editor/components/ProductionExportPanel";
import { ConfigurationSummary } from "./CartView";
import { normalizeOrderStatus, orderNeededBy, orderNeedsRush } from "../config/production";

export default function DesignerOrderWorkspace({
  order,
  user,
  notify,
  onUpdate,
  onProofSaved,
  onBack,
}) {
  const [productionNotes, setProductionNotes] = useState(order.productionNotes || "");
  const [proofStatus, setProofStatus] = useState(order.proofStatus || "Not Started");

  const saveNotes = async () => {
    await onUpdate(order, {
      productionNotes,
      proofStatus,
      status:
        proofStatus === "Proof Sent"
          ? "Proof Sent"
          : proofStatus === "Approved"
          ? "Proof Approved"
          : normalizeOrderStatus(order.status),
    });
  };

  return (
    <section className="wrap designer-workspace">
      <div className="row space">
        <button className="text-button" onClick={onBack}>← Back to My Queue</button>
        <div className="row">
          {orderNeedsRush(order) && <span className="rush-badge">RUSH</span>}
          <span className="status">{normalizeOrderStatus(order.status)}</span>
        </div>
      </div>

      <div className="designer-workspace-header">
        <div>
          <div className="eyebrow">Designer Workspace</div>
          <h1>{order.orderNumber || order.id}</h1>
          <p className="muted">
            {order.customerName || "Customer"} • {order.customerEmail || ""}
          </p>
        </div>

        <div className="designer-due-card">
          <span>Due Date</span>
          <b>{orderNeededBy(order) || "Not set"}</b>
        </div>
      </div>

      <div className="grid g2 designer-workspace-grid">
        <section className="card">
          <h3>Order Details</h3>
          {(order.items || []).map((item, index) => (
            <div className="item" key={`${order.id}-${index}`}>
              <div className="row space">
                <div>
                  <b>{item.name || "Product"}</b>
                  <div className="muted">Qty {item.quantity || 0}</div>
                </div>
              </div>
              <ConfigurationSummary options={item} />
            </div>
          ))}
        </section>

        <section className="card">
          <h3>Customer Artwork</h3>
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
            <p className="muted">No customer artwork uploaded yet.</p>
          )}
        </section>
      </div>

      <section className="card designer-export-section">
        <ProductionExportPanel order={order} notify={notify} />
      </section>

      <section className="card designer-proof-section">
        <div className="grid g2">
          <div>
            <h3>Proof Workflow</h3>

            <label className="field">
              <span>Proof Status</span>
              <select
                value={proofStatus}
                onChange={(e) => setProofStatus(e.target.value)}
              >
                <option>Not Started</option>
                <option>In Design</option>
                <option>Proof Ready</option>
                <option>Proof Sent</option>
                <option>Approved</option>
                <option>Changes Requested</option>
              </select>
            </label>

            <label className="field">
              <span>Designer / Production Notes</span>
              <textarea
                value={productionNotes}
                onChange={(e) => setProductionNotes(e.target.value)}
                placeholder="Design notes, changes, production instructions..."
              />
            </label>

            <button className="btn primary" onClick={saveNotes}>
              Save Designer Update
            </button>
          </div>

          <div>
            <AdminProofUploader
              order={order}
              user={user}
              onProofSaved={onProofSaved}
              notify={notify}
            />

            {order.proofUrl && (
              <a
                className="btn secondary designer-open-proof"
                href={order.proofUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open Current Proof
              </a>
            )}

            {order.proofRevisionNotes && (
              <div className="revision-history">
                <b>Customer Requested Changes</b>
                <p>{order.proofRevisionNotes}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
