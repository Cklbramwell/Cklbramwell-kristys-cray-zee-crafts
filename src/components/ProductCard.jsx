import { money, productPrice } from "../utils";

export default function ProductCard({ product, onCustomize }) {
  const price = productPrice(product);

  return (
    <article className="card product">
      {product.featured && <span className="featured">FEATURED</span>}
      {product.salePrice > 0 && product.salePrice < product.price && (
        <span className="sale">SALE</span>
      )}

      <div className="product-art">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <span>{product.emoji || "🎨"}</span>
        )}
      </div>

      <div className="product-body">
        <span className="tag">{product.category}</span>
        <h3>{product.name}</h3>
        <p className="muted">{product.description}</p>
        <div className="price">{money(price)}</div>
        <div className="row product-actions">
          <button className="btn primary" onClick={() => onCustomize(product.id)}>
            Design / Customize
          </button>
        </div>
      </div>
    </article>
  );
}
