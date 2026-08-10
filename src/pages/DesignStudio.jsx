import InteractiveDesignStudio from "../editor/components/InteractiveDesignStudio";
import { explicitBuilderFamily } from "../config/catalog";

export default function DesignStudio({ user, order, notify, onBack }) {
  if (!user) return <section className="wrap"><div className="card">Sign in to use the Design Studio.</div></section>;
  if (!order) return <section className="wrap"><div className="card"><h2>Order not found</h2><button className="btn secondary" onClick={onBack}>Back to My Orders</button></div></section>;

  const primaryItem = (order.items || []).find((item) => !item.isOrderAddOn);
  const family = explicitBuilderFamily(primaryItem || {});

  return (
    <section className="wrap design-studio-page">
      <div className="row space design-studio-topbar">
        <button className="text-button" onClick={onBack}>← Back to My Orders</button>
        <span className="tag">Order {order.orderNumber || order.id}</span>
      </div>
      <div className="eyebrow">Interactive Design Studio</div>
      <h1 className="page-title">Create your design.</h1>
      <p className="lead section-lead">Add text and artwork, position each layer, and save your design directly to this order.</p>
      <InteractiveDesignStudio order={order} user={user} family={family} notify={notify} />
    </section>
  );
}
