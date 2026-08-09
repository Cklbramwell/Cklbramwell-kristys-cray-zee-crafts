import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function CustomOrder({ user, notify }) {
  if (!user) {
    return (
      <section className="wrap">
        <div className="card">Sign in first to submit a custom request.</div>
      </section>
    );
  }

  return (
    <section className="wrap">
      <div className="eyebrow">Special request</div>
      <h2>Custom Order Request</h2>

      <form
        className="card form"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await addDoc(collection(db, "customRequests"), {
            userId: user.uid,
            email: user.email,
            type: form.get("type"),
            quantity: Number(form.get("quantity") || 1),
            size: form.get("size"),
            colors: form.get("colors"),
            wording: form.get("wording"),
            details: form.get("details"),
            status: "Request Received",
            createdAt: serverTimestamp(),
          });
          event.currentTarget.reset();
          notify("Custom request submitted");
        }}
      >
        <label className="field">
          <span>Product</span>
          <select name="type">
            <option>Custom Shirt</option>
            <option>Custom Tumbler</option>
            <option>Laser Engraving</option>
            <option>Custom Graphic</option>
            <option>Other</option>
          </select>
        </label>
        <label className="field">
          <span>Quantity</span>
          <input name="quantity" type="number" defaultValue="1" min="1" />
        </label>
        <label className="field">
          <span>Size / Dimensions</span>
          <input name="size" />
        </label>
        <label className="field">
          <span>Colors / Finish</span>
          <input name="colors" />
        </label>
        <label className="field full">
          <span>Wording / Engraving Text</span>
          <input name="wording" />
        </label>
        <label className="field full">
          <span>Design Description / Special Instructions</span>
          <textarea name="details" required />
        </label>
        <div className="full">
          <button className="btn primary">Submit Request</button>
        </div>
      </form>
    </section>
  );
}
