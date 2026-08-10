import { useState } from "react";
import { uploadOrderFile } from "../services/uploads";

export default function AdminProofUploader({
  order,
  user,
  onProofSaved,
  notify,
}) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!file) {
      notify("Choose a proof file first.");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const uploaded = await uploadOrderFile({
        userId: user.uid,
        orderId: order.id,
        file,
        kind: "proof",
        onProgress: setProgress,
      });

      await onProofSaved(order, uploaded);
      setFile(null);
      notify("Proof uploaded and marked Proof Sent");
    } catch (error) {
      notify(error.message || "Unable to upload proof.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-proof-uploader">
      <h4>Upload Customer Proof</h4>

      <label className="upload-dropzone compact">
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.pdf"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
        <span>🎨</span>
        <b>{file ? file.name : "Choose proof image or PDF"}</b>
        <small>PNG, JPG, WEBP or PDF</small>
      </label>

      {uploading && (
        <div className="upload-progress">
          <div style={{ width: `${progress}%` }} />
          <span>{progress}%</span>
        </div>
      )}

      <button
        className="btn secondary"
        disabled={uploading}
        onClick={upload}
      >
        {uploading ? "Uploading Proof..." : "Upload & Send Proof"}
      </button>
    </div>
  );
}
