import { INSPIRATIONS } from "../config/storefront";

export default function Inspiration({ onCustomize }) {
  return (
    <section className="wrap">
      <div className="eyebrow">Design Inspiration</div>
      <h1 className="page-title">Start with an idea you love.</h1>
      <p className="lead section-lead">
        Browse popular occasions and styles. Pick one and we’ll open the right
        product builder so you can make it your own.
      </p>

      <div className="inspiration-grid">
        {INSPIRATIONS.map((item) => (
          <article className="inspiration-card" key={item.id}>
            <div className="inspiration-art">{item.emoji}</div>
            <div className="inspiration-body">
              <span className="tag">Inspiration</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <button
                className="btn primary"
                onClick={() => onCustomize(item)}
              >
                Customize This Design
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
