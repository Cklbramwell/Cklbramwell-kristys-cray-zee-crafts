import ProductCard from "../components/ProductCard";

export default function Home({ products, navigate, onCustomize }) {
  const featured = products.filter((product) => product.featured).slice(0, 3);

  return (
    <>
      <section className="wrap hero">
        <div>
          <div className="eyebrow">Custom creations made for you</div>
          <h1>
            Turn your ideas into something{" "}
            <span className="gradient">Cray-Zee creative.</span>
          </h1>
          <p className="lead">
            Shop personalized apparel, drinkware, graphics, laser products,
            gifts, and custom creations.
          </p>
          <div className="row">
            <button className="btn primary" onClick={() => navigate("shop")}>
              Shop Now
            </button>
            <button className="btn secondary" onClick={() => navigate("custom")}>
              Custom Order
            </button>
          </div>
        </div>

        <img src="/assets/kristys-logo.png" alt="Kristy's Cray-Zee Crafts" />
      </section>

      <section className="wrap">
        <div className="eyebrow">Popular picks</div>
        <h2>Featured Products</h2>
        <div className="grid g3">
          {featured.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onCustomize={onCustomize}
            />
          ))}
        </div>
      </section>
    </>
  );
}
