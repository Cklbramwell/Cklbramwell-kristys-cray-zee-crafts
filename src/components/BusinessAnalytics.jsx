import { useMemo, useState } from "react";
import AnalyticsBars from "./AnalyticsBars";
import {
  analyticsSnapshot,
  inDateRange,
  orderDate,
  paidOrders,
} from "../utils/analytics";
import { money } from "../utils";

const RANGES = [
  ["today", "Today"],
  ["7d", "Last 7 Days"],
  ["30d", "Last 30 Days"],
  ["90d", "Last 90 Days"],
  ["year", "This Year"],
  ["all", "All Time"],
];

export default function BusinessAnalytics({ orders }) {
  const [range, setRange] = useState("30d");

  const filtered = useMemo(
    () => orders.filter((order) => inDateRange(order, range)),
    [orders, range]
  );

  const snapshot = useMemo(
    () => analyticsSnapshot(filtered),
    [filtered]
  );

  const exportOrders = () => {
    const rows = paidOrders(filtered).map((order) => ({
      orderNumber: order.orderNumber || order.id,
      customerName: order.customerName || "",
      customerEmail: order.customerEmail || "",
      status: order.status || "",
      paymentStatus: order.paymentStatus || "",
      total: (Number(order.total || 0) / 100).toFixed(2),
      date: orderDate(order)?.toISOString() || "",
      rush: (order.items || []).some((item) => item.rushOrder === "Yes")
        ? "Yes"
        : "No",
      products: (order.items || [])
        .filter((item) => !item.isOrderAddOn)
        .map((item) => `${item.name || "Product"} x${item.quantity || 1}`)
        .join(" | "),
    }));

    const headers = Object.keys(rows[0] || {
      orderNumber: "",
      customerName: "",
      customerEmail: "",
      status: "",
      paymentStatus: "",
      total: "",
      date: "",
      rush: "",
      products: "",
    });

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => csvCell(row[header]))
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kcc-orders-${range}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="business-analytics">
      <div className="analytics-toolbar">
        <div>
          <div className="eyebrow">Business Analytics</div>
          <h2>Sales & Order Performance</h2>
        </div>

        <div className="row analytics-toolbar-actions">
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            {RANGES.map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>

          <button className="btn secondary" onClick={exportOrders}>
            Export Orders CSV
          </button>
        </div>
      </div>

      <div className="metric-grid analytics-metrics">
        <Metric label="Gross Sales" value={money(snapshot.revenue)} />
        <Metric label="Paid Orders" value={snapshot.orderCount} />
        <Metric label="Average Order" value={money(snapshot.avgOrderValue)} />
        <Metric label="Repeat Customers" value={snapshot.repeatCustomerCount} />
        <Metric label="Rush Orders" value={snapshot.rushCount} sub={`${snapshot.rushRate}% of paid orders`} />
        <Metric label="Active Production" value={snapshot.activeCount} />
      </div>

      <div className="grid g2 analytics-grid">
        <section className="card analytics-card">
          <h3>Top Products</h3>
          <AnalyticsBars items={snapshot.topProducts.slice(0, 8)} />
        </section>

        <section className="card analytics-card">
          <h3>Popular Sizes</h3>
          <AnalyticsBars items={snapshot.topSizes.slice(0, 8)} />
        </section>

        <section className="card analytics-card">
          <h3>Product Families</h3>
          <AnalyticsBars items={snapshot.topCategories.slice(0, 8)} />
        </section>

        <section className="card analytics-card">
          <h3>Production Status</h3>
          <AnalyticsBars items={snapshot.statusCounts.slice(0, 10)} />
        </section>

        <section className="card analytics-card">
          <h3>Top Customers</h3>
          <AnalyticsBars
            items={snapshot.topCustomers.slice(0, 8)}
            formatter={(value) => `${value} order${value === 1 ? "" : "s"}`}
          />
        </section>

        <section className="card analytics-card">
          <h3>Revenue Trend</h3>
          <AnalyticsBars
            items={snapshot.revenueTrend.slice(-14)}
            labelKey="date"
            valueKey="revenue"
            formatter={money}
          />
        </section>
      </div>

      <div className="analytics-note">
        <b>Gross sales only.</b>
        <span>
          Profit is not estimated yet because product/material cost data has not been entered.
          When you add your costs, we can add true profit and margin reporting.
        </span>
      </div>
    </section>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div className="metric analytics-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}
