import ProductCard from "../components/ProductCard";
import { CATEGORIES } from "../config/storefront";

function matchesCategory(product, categoryId) {
  if (!categoryId || categoryId === "all") return true;
  const category = CATEGORIES.find((item) => item.id === categoryId);
  if (!category) return true;

  const haystack = [
    product.name,
    product.category,
    product.description,
  ].join(" ").toLowerCase();

  return category.keywords.some((keyword) => haystack.includes(keyword));
}

export default function Shop({
  products,
  search,
  setSearch,
  category,
  setCategory,
  sort,
  setSort,
  onCustomize,
}) {
  const visibleProducts = [...products]
    .filter((product) => matchesCategory(product, category))
    .filter((product) => {
      const needle = search.trim().toLowerCase();
      if (!needle) return true;
      return [
        product.name,
        product.category,
        product.description,
        product.colors,
        product.sizes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    })
    .sort((a, b) => {
      const priceA = a.salePrice > 0 && a.salePrice < a.price ? a.salePrice : a.price;
      const priceB = b.salePrice > 0 && b.salePrice < b.price ? b.salePrice : b.price;
      if (sort === "price-low") return priceA - priceB;
      if (sort === "price-high") return priceB - priceA;
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });

  const activeCategory = CATEGORIES.find((item) => item.id === category);

  return (
    <section className="wrap">
      <div className="eyebrow">Shop</div>
      <div className="section-heading">
        <div>
          <h1 className="page-title">
            {activeCategory ? activeCategory.name : "Choose a product to customize"}
          </h1>
          <p className="muted">
            {activeCategory
              ? activeCategory.description
              : "Every product starts with your idea. Choose one to open its guided builder."}
          </p>
        </div>
      </div>

      <div className="shop-category-tabs">
        <button
          className={!category || category === "all" ? "active" : ""}
          onClick={() => setCategory("all")}
        >
          All
        </button>
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            className={category === item.id ? "active" : ""}
            onClick={() => setCategory(item.id)}
          >
            {item.emoji} {item.name}
          </button>
        ))}
      </div>

      <div className="searchbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products, colors, sizes..."
          aria-label="Search products"
        />
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="featured">Featured first</option>
          <option value="price-low">Price low to high</option>
          <option value="price-high">Price high to low</option>
        </select>
      </div>

      <div className="grid g4">
        {visibleProducts.length ? (
          visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onCustomize={onCustomize}
            />
          ))
        ) : (
          <div className="card empty-state">
            <h3>No products in this category yet.</h3>
            <p className="muted">
              Add products from Admin and assign a category such as T-Shirts,
              Tumblers, Laser Engraving or Business Products.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
