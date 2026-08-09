import { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import ProductionBoard from "../components/ProductionBoard";
import ProductionOrderCard from "../components/ProductionOrderCard";
import {
  daysUntil,
  normalizeOrderStatus,
  orderNeededBy,
  orderNeedsRush,
} from "../config/production";
import { money } from "../utils";

export default function Admin({
  profile,
  user,
  products,
  users,
  requests,
  orders,
  adminTab,
  setAdminTab,
  editing,
  setEditing,
  notify,
}) {
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  if (profile?.role !== "admin") {
    return (
      <section className="wrap">
        <div className="card">Admin access required.</div>
      </section>
    );
  }

  const updateOrder = async (order, changes) => {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/.netlify/functions/update-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ orderId: order.id, changes }),
      });

      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {}

      if (!response.ok) {
        throw new Error(data.error || text || "Unable to update order.");
      }

      notify("Production update saved");
    } catch (error) {
      notify(error.message || "Unable to update order.");
    }
  };

  const filteredOrders = useMemo(() => {
    const needle = orderSearch.trim().toLowerCase();

    return [...orders]
      .filter((order) => {
        if (statusFilter !== "All" && normalizeOrderStatus(order.status) !== statusFilter) {
          return false;
        }

        const rush = orderNeedsRush(order);
        if (priorityFilter === "Rush" && !rush) return false;
        if (priorityFilter === "Normal" && rush) return false;

        if (!needle) return true;

        const itemText = (order.items || [])
          .map((item) =>
            [
              item.name,
              item.size,
              item.color,
              item.personalization,
              item.templateLabel,
              item.designType,
            ].join(" ")
          )
          .join(" ");

        return [
          order.orderNumber,
          order.customerName,
          order.customerEmail,
          order.customerPhone,
          order.designer,
          order.printer,
          order.trackingNumber,
          itemText,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => {
        const aDue = orderNeededBy(a);
        const bDue = orderNeededBy(b);
        if (aDue && bDue) return aDue.localeCompare(bDue);
        if (aDue) return -1;
        if (bDue) return 1;
        return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      });
  }, [orders, orderSearch, statusFilter, priorityFilter]);

  const rushOrders = orders.filter(orderNeedsRush);
  const activeOrders = orders.filter(
    (order) => !["Completed", "Cancelled"].includes(normalizeOrderStatus(order.status))
  );
  const dueSoon = activeOrders.filter((order) => {
    const days = daysUntil(orderNeededBy(order));
    return days !== null && days >= 0 && days <= 7;
  });

  const openFromBoard = (orderId) => {
    setAdminTab("orders");
    setExpandedOrderId(orderId);
    setTimeout(() => {
      document.getElementById(`admin-order-${orderId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  return (
    <section className="wrap">
      <div className="eyebrow">Owner dashboard</div>
      <div className="row space">
        <div>
          <h1 className="admin-title">Business & Production Dashboard</h1>
          <p className="muted">
            Manage paid orders from design through production, pickup and shipping.
          </p>
        </div>
        <span className="status">Admin</span>
      </div>

      <div className="metric-grid admin-metrics">
        <div className="metric">
          Active Orders
          <strong>{activeOrders.length}</strong>
        </div>
        <div className="metric metric-rush">
          Rush Orders
          <strong>{rushOrders.length}</strong>
        </div>
        <div className="metric">
          Due in 7 Days
          <strong>{dueSoon.length}</strong>
        </div>
        <div className="metric">
          Revenue
          <strong>{money(orders.reduce((sum, order) => sum + Number(order.total || 0), 0))}</strong>
        </div>
      </div>

      <div className="tabs admin-tabs">
        {["dashboard", "production", "orders", "products", "requests", "customers"].map((tab) => (
          <button
            key={tab}
            className={adminTab === tab ? "active" : ""}
            onClick={() => {
              setAdminTab(tab);
              setEditing(null);
            }}
          >
            {tab === "requests"
              ? "Custom Requests"
              : `${tab[0].toUpperCase()}${tab.slice(1)}`}
          </button>
        ))}
      </div>

      {adminTab === "dashboard" && (
        <>
          <div className="grid g2 admin-dashboard-grid">
            <div className="card">
              <div className="row space">
                <h3>Production Snapshot</h3>
                <button className="text-button" onClick={() => setAdminTab("production")}>
                  Open board →
                </button>
              </div>

              {[
                "New Order",
                "Designing",
                "Proof Sent",
                "Proof Approved",
                "Printing",
                "Quality Check",
                "Ready for Pickup",
                "Shipped",
              ].map((status) => (
                <div className="item row space" key={status}>
                  <span>{status}</span>
                  <b>
                    {orders.filter(
                      (order) => normalizeOrderStatus(order.status) === status
                    ).length}
                  </b>
                </div>
              ))}
            </div>

            <div className="card">
              <h3>Attention Needed</h3>

              <div className="attention-block">
                <b>Rush Orders</b>
                <span>{rushOrders.length}</span>
              </div>
              <div className="attention-block">
                <b>Due Within 7 Days</b>
                <span>{dueSoon.length}</span>
              </div>
              <div className="attention-block">
                <b>Awaiting Proof Approval</b>
                <span>
                  {
                    orders.filter(
                      (order) =>
                        normalizeOrderStatus(order.status) === "Proof Sent" ||
                        order.proofStatus === "Proof Sent"
                    ).length
                  }
                </span>
              </div>
              <div className="attention-block">
                <b>Ready for Pickup</b>
                <span>
                  {
                    orders.filter(
                      (order) =>
                        normalizeOrderStatus(order.status) === "Ready for Pickup"
                    ).length
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="card recent-orders-card">
            <div className="row space">
              <h3>Newest Orders</h3>
              <button className="text-button" onClick={() => setAdminTab("orders")}>
                View all →
              </button>
            </div>

            {[...orders]
              .sort((a, b) =>
                String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
              )
              .slice(0, 5)
              .map((order) => (
                <button
                  className="recent-order-row"
                  key={order.id}
                  onClick={() => openFromBoard(order.id)}
                >
                  <div>
                    <b>{order.orderNumber || order.id}</b>
                    <span>{order.customerName || order.customerEmail || "Customer"}</span>
                  </div>
                  <div>
                    {orderNeedsRush(order) && <span className="rush-badge">RUSH</span>}
                    <span className="status">{normalizeOrderStatus(order.status)}</span>
                    <strong>{money(order.total || 0)}</strong>
                  </div>
                </button>
              ))}
          </div>
        </>
      )}

      {adminTab === "production" && (
        <>
          <div className="section-heading">
            <div>
              <div className="eyebrow">Production workflow</div>
              <h2>Order Board</h2>
            </div>
            <p className="muted">Click an order card to open its full production record.</p>
          </div>

          <ProductionBoard orders={orders} onOpenOrder={openFromBoard} />
        </>
      )}

      {adminTab === "orders" && (
        <>
          <div className="order-toolbar card">
            <div className="order-search">
              <label className="field">
                <span>Search Orders</span>
                <input
                  value={orderSearch}
                  onChange={(event) => setOrderSearch(event.target.value)}
                  placeholder="Order #, customer, product, size, color, designer..."
                />
              </label>
            </div>

            <label className="field">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option>All</option>
                <option>New Order</option>
                <option>Designing</option>
                <option>Proof Sent</option>
                <option>Proof Approved</option>
                <option>Printing</option>
                <option>Quality Check</option>
                <option>Ready for Pickup</option>
                <option>Shipped</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </label>

            <label className="field">
              <span>Priority</span>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
              >
                <option>All</option>
                <option>Rush</option>
                <option>Normal</option>
              </select>
            </label>
          </div>

          <div className="order-results-count">
            Showing <b>{filteredOrders.length}</b> of {orders.length} orders
          </div>

          <div className="orders-stack">
            {filteredOrders.length ? (
              filteredOrders.map((order) => (
                <ProductionOrderCard
                  key={order.id}
                  order={order}
                  onUpdate={updateOrder}
                  expanded={expandedOrderId === order.id}
                  onToggle={() =>
                    setExpandedOrderId((current) =>
                      current === order.id ? null : order.id
                    )
                  }
                />
              ))
            ) : (
              <div className="card muted">No orders match those filters.</div>
            )}
          </div>
        </>
      )}

      {adminTab === "products" && (
        <ProductManager
          products={products}
          editing={editing}
          setEditing={setEditing}
          notify={notify}
        />
      )}

      {adminTab === "requests" && (
        <div className="card">
          <h3>Custom Requests</h3>
          {requests.length ? (
            requests.map((request) => (
              <div className="item" key={request.id}>
                <div className="row space">
                  <div>
                    <b>{request.type || "Custom Request"}</b>
                    <div className="muted">
                      {request.email || ""} • Qty {request.quantity || 1}
                    </div>
                  </div>
                  <select
                    value={request.status || "Request Received"}
                    onChange={(event) =>
                      updateDoc(doc(db, "customRequests", request.id), {
                        status: event.target.value,
                        updatedAt: serverTimestamp(),
                      })
                    }
                  >
                    <option>Request Received</option>
                    <option>Reviewing</option>
                    <option>Designing</option>
                    <option>Waiting for Approval</option>
                    <option>Approved</option>
                    <option>In Production</option>
                    <option>Ready for Pickup</option>
                    <option>Completed</option>
                  </select>
                </div>
                <p>
                  <b>Size:</b> {request.size || "—"} &nbsp; <b>Colors:</b>{" "}
                  {request.colors || "—"}
                </p>
                <p>
                  <b>Wording:</b> {request.wording || "—"}
                </p>
                <p>{request.details || ""}</p>
              </div>
            ))
          ) : (
            <p className="muted">No custom requests yet.</p>
          )}
        </div>
      )}

      {adminTab === "customers" && (
        <div className="card">
          <h3>Customers & Loyalty</h3>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Punches</th>
                  <th>Rewards</th>
                  <th>Adjust</th>
                </tr>
              </thead>
              <tbody>
                {users.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name || ""}</td>
                    <td>{customer.email || ""}</td>
                    <td>{customer.loyaltyPunches || 0}</td>
                    <td>{customer.availableRewards || 0}</td>
                    <td>
                      <div className="row">
                        <button
                          className="btn secondary"
                          onClick={() =>
                            updateDoc(doc(db, "users", customer.id), {
                              loyaltyPunches: Math.max(
                                0,
                                Number(customer.loyaltyPunches || 0) + 1
                              ),
                            })
                          }
                        >
                          + Punch
                        </button>
                        <button
                          className="btn secondary"
                          onClick={() =>
                            updateDoc(doc(db, "users", customer.id), {
                              loyaltyPunches: Math.max(
                                0,
                                Number(customer.loyaltyPunches || 0) - 1
                              ),
                            })
                          }
                        >
                          − Punch
                        </button>
                        <button
                          className="btn secondary"
                          onClick={() =>
                            updateDoc(doc(db, "users", customer.id), {
                              availableRewards: Math.max(
                                0,
                                Number(customer.availableRewards || 0) + 1
                              ),
                            })
                          }
                        >
                          + Reward
                        </button>
                        <button
                          className="btn secondary"
                          onClick={() =>
                            updateDoc(doc(db, "users", customer.id), {
                              availableRewards: Math.max(
                                0,
                                Number(customer.availableRewards || 0) - 1
                              ),
                            })
                          }
                        >
                          − Reward
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function ProductManager({ products, editing, setEditing, notify }) {
  return (
    <div className="grid g2">
      <form
        className="card form"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const data = {
            name: form.get("name"),
            category: form.get("category"),
            emoji: form.get("emoji") || "🎨",
            price: Math.round(Number(form.get("price") || 0) * 100),
            salePrice: Math.round(Number(form.get("salePrice") || 0) * 100),
            description: form.get("description"),
            sizes: form.get("sizes"),
            colors: form.get("colors"),
            imageUrl: form.get("imageUrl"),
            active: form.get("active") === "on",
            featured: form.get("featured") === "on",
            updatedAt: serverTimestamp(),
          };

          if (editing?.id) {
            await updateDoc(doc(db, "products", editing.id), data);
          } else {
            await addDoc(collection(db, "products"), {
              ...data,
              createdAt: serverTimestamp(),
            });
          }

          setEditing(null);
          event.currentTarget.reset();
          notify("Product saved");
        }}
      >
        <h3 className="full">{editing ? "Edit" : "Add"} Product</h3>
        <label className="field full">
          <span>Name</span>
          <input name="name" defaultValue={editing?.name || ""} required />
        </label>
        <label className="field">
          <span>Category</span>
          <input name="category" defaultValue={editing?.category || "T-Shirts"} />
        </label>
        <label className="field">
          <span>Emoji</span>
          <input name="emoji" defaultValue={editing?.emoji || "🎨"} />
        </label>
        <label className="field">
          <span>Price</span>
          <input
            name="price"
            type="number"
            step=".01"
            defaultValue={editing?.price ? (editing.price / 100).toFixed(2) : ""}
          />
        </label>
        <label className="field">
          <span>Sale Price</span>
          <input
            name="salePrice"
            type="number"
            step=".01"
            defaultValue={
              editing?.salePrice ? (editing.salePrice / 100).toFixed(2) : ""
            }
          />
        </label>
        <label className="field full">
          <span>Description</span>
          <textarea name="description" defaultValue={editing?.description || ""} />
        </label>
        <label className="field">
          <span>Sizes (comma-separated)</span>
          <input name="sizes" defaultValue={editing?.sizes || ""} />
        </label>
        <label className="field">
          <span>Colors (comma-separated)</span>
          <input name="colors" defaultValue={editing?.colors || ""} />
        </label>
        <label className="field full">
          <span>Image URL</span>
          <input name="imageUrl" defaultValue={editing?.imageUrl || ""} />
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            name="active"
            defaultChecked={editing ? editing.active !== false : true}
          />
          <span>Show in shop</span>
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={Boolean(editing?.featured)}
          />
          <span>Featured</span>
        </label>
        <div className="full row">
          <button className="btn primary">Save Product</button>
          {editing && (
            <button
              type="button"
              className="btn secondary"
              onClick={() => setEditing(null)}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h3>Catalog</h3>
        {products.length ? (
          products.map((product) => (
            <div className="item" key={product.id}>
              <div className="row space">
                <div>
                  <b>{product.name}</b>
                  <div className="muted">
                    {product.category} • {money(product.price)}
                  </div>
                </div>
                <div className="row">
                  <button className="btn secondary" onClick={() => setEditing(product)}>
                    Edit
                  </button>
                  <button
                    className="btn danger"
                    onClick={async () => {
                      if (confirm(`Delete ${product.name}?`)) {
                        await deleteDoc(doc(db, "products", product.id));
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">No products yet.</p>
        )}
      </div>
    </div>
  );
}
