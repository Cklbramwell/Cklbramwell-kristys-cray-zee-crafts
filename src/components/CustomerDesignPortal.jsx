import { useMemo, useState } from "react";
import { uploadOrderFile } from "../services/uploads";
import { normalizeOrderStatus } from "../config/production";

export default function CustomerDesignPortal({
  order,
  user,
  onArtworkSaved,
  onProofResponse,
  notify,
}) {
  const [file, setFile] = useState(null);
  const [uploadKind, setUploadKind] = useState("artwork");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [responding, setResponding] = useState(false);

  const designFiles = useMemo(
    () => Array.isArray(order.customerArtwork) ? order.customerArtwork : [],
    [order.customerArtwork]
  );

  const proofStatus = order.proofStatus || "Not Started";
  const canRespondToProof =
    Boolean(order.proofUrl) &&
    ["Proof Ready", "Proof Sent", "Changes Requested"].includes(proofStatus);

  const upload = async () => {
    if (!file) {
      notify("Choose an artwork or inspiration file first.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const uploaded = await uploadOrderFile({
        userId: user.uid,
        orderId: order.id,
        file,
        kind: uploadKind,
        onProgress: setUploadProgress,
      });

      await onArtworkSaved(order, uploaded);
      setFile(null);
      setUploadProgress(100);
      notify("File uploaded to your order");
    } catch (error) {
      notify(error.message || "Unable to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const respond = async (decision) => {
    if (decision === "changes" && !revisionNotes.trim()) {
      notify("Please tell us what changes you want.");
      return;
    }

    try {
      setResponding(true);
      await onProofResponse(order, {
        decision,
        revisionNotes: revisionNotes.trim(),
      });
      if (decision === "approve") setRevisionNotes("");
    } finally {
      setResponding(false);
    }
  };

  return (
    <section className="customer-design-portal">
      <div className="row space design-portal-heading">
        <div>
          <div className="eyebrow">Design Center</div>
          <h3>Artwork & Proof Approval</h3>
        </div>
        <span className="status">{normalizeOrderStatus(order.status)}</span>
      </div>

      <div className="design-portal-grid">
        <section className="design-portal-card">
          <h4>Upload Your Artwork</h4>
          <p className="muted">
            Add logos, photos, artwork or inspiration images for this order.
          </p>

          <label className="field">
            <span>File Type</span>
            <select
              value={uploadKind}
              onChange={(event) => setUploadKind(event.target.value)}
            >
              <option value="artwork">Artwork / Logo</option>
              <option value="inspiration">Inspiration Photo</option>
              <option value="reference">Reference File</option>
            </select>
          </label>

          <label className="upload-dropzone">
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
            <span>📤</span>
            <b>{file ? file.name : "Choose artwork or inspiration file"}</b>
            <small>PNG, JPG, WEBP, SVG or PDF • up to 20 MB</small>
          </label>

          {uploading && (
            <div className="upload-progress">
              <div style={{ width: `${uploadProgress}%` }} />
              <span>{uploadProgress}%</span>
            </div>
          )}

          <button
            className="btn primary"
            disabled={uploading}
            onClick={upload}
          >
            {uploading ? "Uploading..." : "Upload to Order"}
          </button>

          {designFiles.length > 0 && (
            <div className="customer-file-list">
              <h4>Your Files</h4>
              {designFiles.map((item, index) => (
                <a
                  key={`${item.url}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="customer-file-row"
                >
                  <span>{item.kind === "inspiration" ? "🖼️" : "📎"}</span>
                  <div>
                    <b>{item.name || "Uploaded file"}</b>
                    <small>{item.kind || "artwork"}</small>
                  </div>
                  <span>Open ↗</span>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="design-portal-card proof-card">
          <h4>Your Design Proof</h4>

          {!order.proofUrl ? (
            <div className="proof-empty">
              <span>🎨</span>
              <b>Your proof isn't ready yet.</b>
              <p>
                Current proof status: <strong>{proofStatus}</strong>
              </p>
              <small>
                We'll update this section when your design proof is ready.
              </small>
            </div>
          ) : (
            <>
              <div className="proof-status-banner">
                <span>Proof Status</span>
                <b>{proofStatus}</b>
              </div>

              <a
                href={order.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="proof-preview-link"
              >
                <span>👀</span>
                <div>
                  <b>View Current Proof</b>
                  <small>Open proof in a new window</small>
                </div>
                <span>Open ↗</span>
              </a>

              {order.proofApprovedAt && (
                <div className="proof-approved-message">
                  ✓ Approved {formatDateTime(order.proofApprovedAt)}
                </div>
              )}

              {order.proofRevisionNotes && proofStatus === "Changes Requested" && (
                <div className="revision-history">
                  <b>Your latest change request</b>
                  <p>{order.proofRevisionNotes}</p>
                </div>
              )}

              {canRespondToProof && proofStatus !== "Approved" && (
                <div className="proof-actions-panel">
                  <h4>Ready to respond?</h4>

                  <button
                    className="btn primary proof-approve"
                    disabled={responding}
                    onClick={() => respond("approve")}
                  >
                    ✓ Approve This Proof
                  </button>

                  <label className="field">
                    <span>Request Changes</span>
                    <textarea
                      value={revisionNotes}
                      onChange={(event) => setRevisionNotes(event.target.value)}
                      placeholder="Tell us exactly what you'd like changed..."
                    />
                  </label>

                  <button
                    className="btn secondary"
                    disabled={responding}
                    onClick={() => respond("changes")}
                  >
                    Request Changes
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </section>
  );
}

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
