import { money, productPrice } from "../utils";

export default function CartView({
  cart,
  products,
  subtotal,
  checkoutLoading,
  onQuantityChange,
  onRemove,
  onCheckout,
}) {
  return (
    <section className="wrap">
      <div className="eyebrow">Shopping cart</div>
      <h2>Your Cart</h2>

      <div className="card">
        {cart.length ? (
          cart.map((line, index) => {
            const product = products.find((item) => item.id === line.id);
            if (!product) return null;

            const lineTotal =
              line.options?.calculatedLineTotal != null
                ? Number(line.options.calculatedLineTotal)
                : productPrice(product) * line.qty;

            return (
              <div className="item cart-line" key={line.lineKey || `${line.id}-${index}`}>
                <div className="row space">
                  <div>
                    <h3>{product.name}</h3>
                    <div className="price">{money(lineTotal)}</div>
                  </div>

                  <div className="row">
                    <button
                      className="btn secondary"
                      onClick={() => onQuantityChange(index, Math.max(1, line.qty - 1))}
                    >
                      −
                    </button>
                    <strong>{line.qty}</strong>
                    <button
                      className="btn secondary"
                      onClick={() => onQuantityChange(index, line.qty + 1)}
                    >
                      +
                    </button>
                    <button className="btn danger" onClick={() => onRemove(index)}>
                      Remove
                    </button>
                  </div>
                </div>

                {line.options && <ConfigurationSummary options={line.options} />}
              </div>
            );
          })
        ) : (
          <p className="muted">Your cart is empty.</p>
        )}

        <div className="cart-total">
          <span>Estimated product total</span>
          <strong className="price">{money(subtotal)}</strong>
        </div>

        {cart.length > 0 && (
          <>
            <button
              className="btn primary checkout-button"
              disabled={checkoutLoading}
              onClick={onCheckout}
            >
              {checkoutLoading ? "Opening secure checkout..." : "Secure Checkout"}
            </button>
            <p className="muted">Payments are processed securely by Stripe.</p>
          </>
        )}
      </div>
    </section>
  );
}

export function ConfigurationSummary({ options }) {
  const rows = [
    ["Template", options.templateLabel],
    ["Drinkware Type", options.drinkwareType],
    ["Wrap / Design Style", options.wrapStyle],
    ["Engraving Sides", options.engravingSides],
    ["Product Type", options.marketingProductType],
    ["Size", options.size],
    ["Color", options.color],
    ["Design Type", options.designType],
    ["Placement", options.printLocation],
    ["Print Method", options.printMethod],
    ["Sleeve Print", options.sleevePrint],
    ["Personalization", options.personalization],
    ["Design Notes", options.designNotes],
    ["Artwork", options.artworkMethod],
    ["Rush Order", options.rushOrder],
    ["Proof Before Printing", options.proofBeforePrinting],
    ["Delivery", options.deliveryMethod],
    ["Needed By", options.neededBy],
    ["Occasion", options.occasion],
    ["Full Wrap", options.fullWrap],
    ["Laser Item", options.laserItemType],
    ["Material", options.laserMaterial],
    ["Dimensions", options.dimensions],
    ["Layout / Style", options.layoutStyle],
    ["Finish / Color", options.finishColor],
    ["Engraving Text", options.engravingText],
    ["Extra Engraving Side", options.extraEngravingSide],
    ["Custom Design Fee", options.designFee],
  ].filter(([, value]) => value && value !== "No");

  if (!rows.length) return null;

  return (
    <div className="configuration-summary">
      {rows.map(([label, value]) => (
        <div key={label}>
          <b>{label}:</b> {value}
        </div>
      ))}
    </div>
  );
}
