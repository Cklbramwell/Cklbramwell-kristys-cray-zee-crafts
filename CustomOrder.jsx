import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import OrderDetails from "../components/OrderDetails";
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

      notify("Order updated");
    } catch (error) {
      notify(error.message || "Unable to update order.");
    }
  };

  return (
    <section className="wrap">
      <div className="eyebrow">Owner dashboard</div>
      <div className="row space">
        <h2>Business Dashboard</h2>
        <span className="status">Admin</span>
      </div>

      <div className="metric-grid">
        <div className="metric">Products<strong>{products.length}</strong></div>
        <div className="metric">Customers<strong>{users.length}</strong></div>
        <div className="metric">Custom Requests<strong>{requests.length}</strong></div>
        <div className="metric">Orders<strong>{orders.length}</strong></div>
      </div>

      <div className="tabs admin-tabs">
        {["dashboard", "products", "orders", "requests", "customers"].map((tab) => (
          <button
            key={tab}
            className={adminTab === tab ? "active" : ""}
            onClick={() => {
              setAdminTab(tab);
              setEditing(null);
            }}
          >
            {tab === "requests" ? "Custom Requests" : `${tab[0].toUpperCase()}${tab.slice(1)}`}
          </button>
        ))}
      </div>

      {adminTab === "dashboard" && (
        <div className="grid g2">
          <div className="card">
            <h3>Order Summary</h3>
            {["Paid", "Designing", "Ready for Pickup", "Shipped", "Completed"].map(
              (status) => (
                <div className="item row space" key={status}>
                  <span>{status}</span>
                  <b>{orders.filter((order) => order.status === status).length}</b>
                </div>
              )
            )}
          </div>
          <div className="card">
            <h3>Revenue</h3>
            <div className="price">
              {money(orders.reduce((sum, order) => sum + Number(order.total || 0), 0))}
            </div>
            <p className="muted">Based on orders currently saved in Firestore.</p>
          </div>
        </div>
      )}

      {adminTab === "products" && (
        <ProductManager
          products={products}
          editing={editing}
          setEditing={setEditing}
          notify={notify}
        />
      )}

      {adminTab === "orders" && (
        <div className="orders-stack">
          {orders.length ? (
            orders.map((order) => (
              <OrderDetails
                key={order.id}
                order={order}
                admin
                onUpdate={updateOrder}
              />
            ))
          ) : (
            <div className="card muted">No orders have been saved yet.</div>
          )}
        </div>
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
                <p><b>Size:</b> {request.size || "—"} &nbsp; <b>Colors:</b> {request.colors || "—"}</p>
                <p><b>Wording:</b> {request.wording || "—"}</p>
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
