import ProductCard from "../components/ProductCard";
import CategoryCard from "../components/CategoryCard";
import { CATEGORIES, INSPIRATIONS, TESTIMONIALS } from "../config/storefront";

export default function Home({
  products,
  navigate,
  onCustomize,
  onCategory,
  onInspiration,
}) {
  const featured = products.filter((product) => product.featured).slice(0, 4);

  return (
    <>
      <section className="hero-shell">
        <div className="wrap hero v7-hero">
          <div className="hero-copy">
            <div className="eyebrow">Custom creations made for you</div>
            <h1>
              Your idea.
              <br />
              <span className="gradient">Our Cray-Zee creativity.</span>
            </h1>
            <p className="lead">
              Custom apparel, drinkware, laser engraving, business branding,
              gifts and event creations — all designed around your vision.
            </p>
            <div className="row hero-actions">
              <button className="btn primary btn-lg" onClick={() => navigate("shop")}>
                Start Designing
              </button>
              <button className="btn secondary btn-lg" onClick={() => navigate("inspiration")}>
                Browse Inspiration
              </button>
            </div>
            <div className="hero-trust">
              <span>✓ Guided customization</span>
              <span>✓ Live pricing</span>
              <span>✓ Secure checkout</span>
            </div>
          </div>

          <div className="hero-brand-card">
            <img src="/assets/kristys-logo.png" alt="Kristy's Cray-Zee Crafts" />
            <div className="hero-brand-copy">
              <b>Made with creativity.</b>
              <span>Crafted with care.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap section-block">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Shop by category</div>
            <h2>What are we creating today?</h2>
          </div>
          <button className="text-button" onClick={() => navigate("shop")}>
            View all products →
          </button>
        </div>

        <div className="category-grid">
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onOpen={onCategory}
            />
          ))}
        </div>
      </section>

      <section className="wrap section-block">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Featured products</div>
            <h2>Customer favorites</h2>
          </div>
          <button className="text-button" onClick={() => navigate("shop")}>
            Shop everything →
          </button>
        </div>

        <div className="grid g4">
          {featured.length ? (
            featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onCustomize={onCustomize}
              />
            ))
          ) : (
            <div className="card muted">Add featured products in Admin to show them here.</div>
          )}
        </div>
      </section>

      <section className="inspiration-strip">
        <div className="wrap section-block">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Design Inspiration</div>
              <h2>Not sure where to start?</h2>
              <p className="muted">
                Start with an occasion, theme or idea — then customize it your way.
              </p>
            </div>
            <button className="btn secondary" onClick={() => navigate("inspiration")}>
              See All Inspiration
            </button>
          </div>

          <div className="mini-inspiration-grid">
            {INSPIRATIONS.slice(0, 4).map((item) => (
              <button
                key={item.id}
                className="mini-inspiration"
                onClick={() => onInspiration(item)}
              >
                <span>{item.emoji}</span>
                <b>{item.title}</b>
                <small>Customize →</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap section-block">
        <div className="eyebrow">Why customers choose us</div>
        <h2>Custom ordering without the guesswork.</h2>
        <div className="benefit-grid">
          <div className="benefit-card">
            <span>🎨</span>
            <h3>Built Around Your Vision</h3>
            <p>Choose your product, wording, colors, placement and special details.</p>
          </div>
          <div className="benefit-card">
            <span>💲</span>
            <h3>Clear Pricing</h3>
            <p>See your estimated product price update as you customize.</p>
          </div>
          <div className="benefit-card">
            <span>📦</span>
            <h3>Order Tracking</h3>
            <p>Signed-in customers can review order status and shipping details.</p>
          </div>
          <div className="benefit-card">
            <span>✨</span>
            <h3>Made to Stand Out</h3>
            <p>From one custom gift to a full event order, every project gets attention.</p>
          </div>
        </div>
      </section>

      <section className="reviews-shell">
        <div className="wrap section-block">
          <div className="eyebrow">Customer experience</div>
          <h2>Created for real-life moments.</h2>
          <div className="grid g3">
            {TESTIMONIALS.map((review) => (
              <article className="review-card" key={review.name}>
                <div className="stars">★★★★★</div>
                <p>“{review.text}”</p>
                <b>{review.name}</b>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap section-block">
        <div className="cta-panel">
          <div>
            <div className="eyebrow">Have something unique in mind?</div>
            <h2>Start a custom project.</h2>
            <p>
              Tell us what you’re creating and we’ll help turn the idea into something
              Cray-Zee special.
            </p>
          </div>
          <button className="btn primary btn-lg" onClick={() => navigate("custom")}>
            Start Your Custom Order
          </button>
        </div>
      </section>

      <section className="wrap contact-strip">
        <div>
          <b>Kristy's Cray-Zee Crafts</b>
          <span>Custom Apparel • Laser Engraving • Gifts • Branding</span>
        </div>
        <div>
          <b>Call</b>
          <span>832-901-3433</span>
        </div>
        <div>
          <b>Email</b>
          <span>Design@Endlessbv.com</span>
        </div>
      </section>
    </>
  );
}
