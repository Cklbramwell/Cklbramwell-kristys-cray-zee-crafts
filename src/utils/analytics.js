import { normalizeOrderStatus, orderNeedsRush } from "../config/production";

export function orderDate(order) {
  const raw =
    order.createdAt?.toDate?.() ||
    order.createdAt ||
    order.paidAt ||
    order.updatedAt ||
    null;

  if (!raw) return null;
  const date = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function inDateRange(order, range) {
  const date = orderDate(order);
  if (!date) return range === "all";

  const now = new Date();
  const start = new Date(now);

  if (range === "today") {
    return date.toDateString() === now.toDateString();
  }

  if (range === "7d") {
    start.setDate(now.getDate() - 7);
    return date >= start;
  }

  if (range === "30d") {
    start.setDate(now.getDate() - 30);
    return date >= start;
  }

  if (range === "90d") {
    start.setDate(now.getDate() - 90);
    return date >= start;
  }

  if (range === "year") {
    return date.getFullYear() === now.getFullYear();
  }

  return true;
}

export function paidOrders(orders) {
  return orders.filter((order) => {
    const payment = String(order.paymentStatus || "").toLowerCase();
    return (
      payment === "paid" ||
      payment === "succeeded" ||
      payment === "complete" ||
      Number(order.total || 0) > 0
    );
  });
}

export function analyticsSnapshot(orders) {
  const paid = paidOrders(orders);

  const revenue = paid.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const avgOrderValue = paid.length ? Math.round(revenue / paid.length) : 0;
  const rushCount = paid.filter(orderNeedsRush).length;

  const activeCount = orders.filter(
    (order) =>
      !["Completed", "Cancelled"].includes(normalizeOrderStatus(order.status))
  ).length;

  const completedCount = orders.filter(
    (order) => normalizeOrderStatus(order.status) === "Completed"
  ).length;

  const productCounts = new Map();
  const sizeCounts = new Map();
  const categoryCounts = new Map();
  const customerCounts = new Map();

  paid.forEach((order) => {
    const email = String(order.customerEmail || "").trim().toLowerCase();
    const customerKey = email || order.customerName || order.id;
    customerCounts.set(customerKey, (customerCounts.get(customerKey) || 0) + 1);

    (order.items || [])
      .filter((item) => !item.isOrderAddOn)
      .forEach((item) => {
        const qty = Math.max(1, Number(item.quantity || 1));
        const name = item.name || "Custom Product";
        const size = item.size || "";
        const category =
          item.builderType ||
          item.category ||
          item.apparelKind ||
          "Other";

        productCounts.set(name, (productCounts.get(name) || 0) + qty);
        if (size) sizeCounts.set(size, (sizeCounts.get(size) || 0) + qty);
        categoryCounts.set(
          String(category),
          (categoryCounts.get(String(category)) || 0) + qty
        );
      });
  });

  return {
    revenue,
    orderCount: paid.length,
    avgOrderValue,
    rushCount,
    rushRate: paid.length ? Math.round((rushCount / paid.length) * 100) : 0,
    activeCount,
    completedCount,
    repeatCustomerCount: [...customerCounts.values()].filter((count) => count > 1).length,
    topProducts: sortedMap(productCounts),
    topSizes: sortedMap(sizeCounts),
    topCategories: sortedMap(categoryCounts),
    topCustomers: [...customerCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    statusCounts: statusSummary(orders),
    revenueTrend: revenueByDay(paid),
  };
}

function sortedMap(map) {
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function statusSummary(orders) {
  const map = new Map();
  orders.forEach((order) => {
    const status = normalizeOrderStatus(order.status);
    map.set(status, (map.get(status) || 0) + 1);
  });
  return sortedMap(map);
}

function revenueByDay(orders) {
  const map = new Map();

  orders.forEach((order) => {
    const date = orderDate(order);
    if (!date) return;

    const key = date.toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + Number(order.total || 0));
  });

  return [...map.entries()]
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
}
