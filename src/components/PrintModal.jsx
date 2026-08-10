import {
  InvoiceDocument,
  PackingSlipDocument,
} from "./PrintDocuments";

export default function PrintModal({ order, type, onClose }) {
  if (!order || !type) return null;

  const printNow = () => window.print();

  return (
    <div className="print-modal-backdrop">
      <div className="print-modal-shell">
        <div className="print-modal-toolbar no-print">
          <div>
            <b>
              {type === "invoice" ? "Invoice Preview" : "Packing Slip Preview"}
            </b>
            <span>{order.orderNumber || order.id}</span>
          </div>

          <div className="row">
            <button className="btn primary" onClick={printNow}>
              Print / Save PDF
            </button>
            <button className="btn secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="print-preview">
          {type === "invoice" ? (
            <InvoiceDocument order={order} />
          ) : (
            <PackingSlipDocument order={order} />
          )}
        </div>
      </div>
    </div>
  );
}
