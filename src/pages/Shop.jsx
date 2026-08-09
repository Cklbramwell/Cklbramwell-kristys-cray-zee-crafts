import ProductCard from "../components/ProductCard";

export default function Shop({
  products,
  search,
  setSearch,
  category,
  setCategory,
  sort,
  setSort,
  onCustomize,
  onQuickAdd,
}) {
  const categories = ["All", ...new Set(products.map((product) => product.category))];

  const visibleProducts = [...products]
    .filter((product) => category === "All" || product.category === category)
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

  return (
    <section className="wrap">
      <div className="eyebrow">Shop</div>
      <h2>Choose a product to customize</h2>

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

      <div className="filters">
        {categories.map((value) => (
          <button
            key={value}
            className={category === value ? "active" : ""}
            onClick={() => setCategory(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid g4">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onCustomize={onCustomize}
            onQuickAdd={onQuickAdd}
          />
        ))}
      </div>
    </section>
  );
}
