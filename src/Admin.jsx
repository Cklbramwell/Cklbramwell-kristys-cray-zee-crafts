export const money = (cents = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(cents || 0) / 100);

export const productPrice = (product) =>
  product?.salePrice > 0 && product.salePrice < product.price
    ? product.salePrice
    : product?.price || 0;

export const splitOptions = (value, fallback = []) => {
  const items = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
};
