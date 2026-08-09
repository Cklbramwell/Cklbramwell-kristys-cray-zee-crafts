import { detectProductFamily } from "../config/catalog";
import ApparelBuilder from "./builders/ApparelBuilder";
import DrinkwareBuilder from "./builders/DrinkwareBuilder";
import LaserBuilder from "./builders/LaserBuilder";
import MarketingBuilder from "./builders/MarketingBuilder";

export default function ProductBuilder({ product, onAdd, onBack, preset = null }) {
  if (!product) {
    return (
      <section className="wrap">
        <div className="card">
          <h2>Product not found</h2>
          <button className="btn secondary" onClick={onBack}>Back to Shop</button>
        </div>
      </section>
    );
  }

  const family = detectProductFamily(product);

  return (
    <section className="wrap product-builder-page">
      <div className="builder-topbar">
        <button className="text-button" onClick={onBack}>← Back to Shop</button>
        <span className="tag">{family.toUpperCase()}</span>
      </div>

      <div className="grid g2 builder-layout">
        <aside className="card product builder-product">
          <div className="product-art product-art-large">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name}/>
            ) : (
              <span>{product.emoji || "🎨"}</span>
            )}
          </div>
          <div className="product-body">
            <span className="tag">{product.category || "Custom Product"}</span>
            <h1>{product.name}</h1>
            <p className="muted">{product.description}</p>
            <div className="builder-help">
              <b>Need help?</b>
              <span>Choose the closest options and use Design Notes for anything special.</span>
            </div>
          </div>
        </aside>

        <div className="card builder-panel">
          {family === "apparel" && <ApparelBuilder product={product} preset={preset} onAdd={onAdd}/>}
          {family === "drinkware" && <DrinkwareBuilder product={product} preset={preset} onAdd={onAdd}/>}
          {family === "laser" && <LaserBuilder product={product} preset={preset} onAdd={onAdd}/>}
          {family === "marketing" && <MarketingBuilder product={product} preset={preset} onAdd={onAdd}/>}
        </div>
      </div>
    </section>
  );
}
