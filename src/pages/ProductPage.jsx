import ProductCard from "../components/ProductCard";
import ProductGallery from "../components/products/ProductGallery";
import { PRODUCT_REVIEWS, explicitBuilderFamily, relatedProducts } from "../config/catalog";
import { money, productPrice } from "../utils";

export default function ProductPage({ product, products, onCustomize, onOpenProduct, onBack }) {
  if (!product) {
    return <section className="wrap"><div className="card">Product not found.</div></section>;
  }

  const family=explicitBuilderFamily(product);
  const related=relatedProducts(products,product,3);

  return (
    <>
      <section className="wrap product-detail">
        <button className="text-button" onClick={onBack}>← Back to Shop</button>

        <div className="grid g2 product-detail-grid">
          <ProductGallery product={product}/>

          <div className="product-detail-copy">
            <span className="tag">{product.category}</span>
            <span className="tag builder-type-tag">Builder: {family}</span>
            <h1>{product.name}</h1>
            <div className="product-detail-price">
              Starting at <span className="price">{money(productPrice(product))}</span>
            </div>
            <p className="lead">{product.description}</p>

            <div className="product-feature-list">
              <span>✓ Guided customization</span>
              <span>✓ Live pricing where available</span>
              <span>✓ Design notes & personalization</span>
              <span>✓ Secure Stripe checkout</span>
            </div>

            <button className="btn primary btn-lg" onClick={()=>onCustomize(product.id)}>
              Customize This Product
            </button>

            <div className="product-family-note">
              <b>{family === "apparel" ? "Apparel Builder" :
                  family === "drinkware" ? "Drinkware Builder" :
                  family === "laser" ? "Laser Builder" :
                  "Promotional Product Builder"}</b>
              <span>Only the options relevant to this product will be shown.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="reviews-shell">
        <div className="wrap section-block">
          <div className="eyebrow">Product experience</div>
          <h2>What customers love</h2>
          <div className="grid g3">
            {PRODUCT_REVIEWS.map((review)=>(
              <article className="review-card" key={review.name}>
                <div className="stars">{"★".repeat(review.rating)}</div>
                <p>“{review.text}”</p>
                <b>{review.name}</b>
              </article>
            ))}
          </div>
        </div>
      </section>

      {related.length>0&&(
        <section className="wrap section-block">
          <div className="eyebrow">You may also like</div>
          <h2>Related Products</h2>
          <div className="grid g3">
            {related.map((item)=>(
              <ProductCard
                key={item.id}
                product={item}
                onCustomize={()=>onOpenProduct(item.id)}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
