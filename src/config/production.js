export const PRODUCTION_STATUSES = [
  "New Order",
  "Designing",
  "Proof Sent",
  "Proof Approved",
  "Printing",
  "Quality Check",
  "Ready for Pickup",
  "Shipped",
  "Completed",
  "Cancelled",
];

export const ACTIVE_PRODUCTION_STATUSES = [
  "New Order",
  "Designing",
  "Proof Sent",
  "Proof Approved",
  "Printing",
  "Quality Check",
  "Ready for Pickup",
  "Shipped",
];

export const PROOF_STATUSES = [
  "Not Started",
  "In Design",
  "Proof Ready",
  "Proof Sent",
  "Approved",
  "Changes Requested",
];

export const PRIORITIES = ["Normal", "Rush", "Urgent"];

export function normalizeOrderStatus(status) {
  if (!status || status === "Paid") return "New Order";
  return status;
}

export function orderNeedsRush(order) {
  return (
    order?.priority === "Rush" ||
    order?.priority === "Urgent" ||
    (order?.items || []).some((item) => item.rushOrder === "Yes")
  );
}

export function orderNeededBy(order) {
  return (
    order?.dueDate ||
    (order?.items || []).map((item) => item.neededBy).find(Boolean) ||
    ""
  );
}

export function daysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(`${dateString}T23:59:59`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / 86400000);
}

export function statusProgress(status) {
  const normalized = normalizeOrderStatus(status);
  const progressStatuses = PRODUCTION_STATUSES.filter(
    (value) => value !== "Cancelled"
  );
  const index = progressStatuses.indexOf(normalized);
  return index < 0 ? 0 : index;
}
