import { useMemo, useState } from "react";
import {
  BUILDER_PRICING,
  DESIGN_TYPES,
  LASER_ITEM_TYPES,
  LASER_MATERIALS,
  PRINT_LOCATIONS,
  PRINT_METHODS,
  SHIRT_STYLES,
} from "../config/pricing";
import { money, productPrice, splitOptions } from "../utils";

export default function ProductBuilder({ product, onAdd, onBack }) {
  const category = String(product?.category || "").toLowerCase();
  const name = String(product?.name || "").toLowerCase();

  const isLaser =
    category.includes("laser") ||
    category.includes("engraving") ||
    name.includes("laser");

  const isApparel =
    !isLaser &&
    (category.includes("shirt") ||
      category.includes("apparel") ||
      name.includes("shirt") ||
      name.includes("hoodie") ||
      name.includes("sweatshirt"));

  const sizeOptions = splitOptions(product?.sizes, [
    "S",
    "M",
    "L",
    "XL",
    "2XL",
    "3XL",
    "4XL",
    "5XL",
  ]);

  const colorOptions = splitOptions(product?.colors, [
    "Black",
    "White",
    "Red",
    "Royal Blue",
    "Navy",
    "Pink",
    "Purple",
    "Heather Gray",
  ]);

  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState(sizeOptions[0] || "");
  const [color, setColor] = useState(colorOptions[0] || "");
  const [shirtStyle, setShirtStyle] = useState("Unisex (Adult)");
  const [designType, setDesignType] = useState("Custom");
  const [printLocation, setPrintLocation] = useState("Front Only");
  const [printMethod, setPrintMethod] = useState("DTF");
  const [personalization, setPersonalization] = useState("");
  const [designNotes, setDesignNotes] = useState("");
  const [artworkMethod, setArtworkMethod] = useState("I will email my artwork");
  const [proofBeforePrinting, setProofBeforePrinting] = useState(true);
  const [rushOrder, setRushOrder] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("Local Pickup");
  const [neededBy, setNeededBy] = useState("");
  const [occasion, setOccasion] = useState("");
  const [laserItemType, setLaserItemType] = useState("Tumbler");
  const [laserMaterial, setLaserMaterial] = useState("Wood");
  const [dimensions, setDimensions] = useState("");
  const [layoutStyle, setLayoutStyle] = useState("");
  const [finishColor, setFinishColor] = useState("");
  const [engravingText, setEngravingText] = useState("");

  const pricing = useMemo(() => {
    if (!product) return null;

    const baseUnitPrice = productPrice(product);
    const qty = Math.max(1, Number(quantity) || 1);
    let optionUpchargePerUnit = 0;
    let oneTimeAddOns = 0;

    if (isApparel) {
      optionUpchargePerUnit += BUILDER_PRICING.apparel.sizeUpcharge[size] || 0;
      optionUpchargePerUnit +=
        BUILDER_PRICING.apparel.placement[printLocation] || 0;
      optionUpchargePerUnit +=
        BUILDER_PRICING.apparel.printMethod[printMethod] || 0;
      if (rushOrder) oneTimeAddOns += BUILDER_PRICING.apparel.rush;
      if (proofBeforePrinting) oneTimeAddOns += BUILDER_PRICING.apparel.proof;
    } else if (isLaser && rushOrder) {
      oneTimeAddOns += BUILDER_PRICING.laser.rush;
    }

    const calculatedUnitPrice = baseUnitPrice + optionUpchargePerUnit;
    const itemSubtotal = calculatedUnitPrice * qty;
    const calculatedLineTotal = itemSubtotal + oneTimeAddOns;

    return {
      qty,
      baseUnitPrice,
      optionUpchargePerUnit,
      oneTimeAddOns,
      calculatedUnitPrice,
      itemSubtotal,
      calculatedLineTotal,
    };
  }, [
    product,
    quantity,
    isApparel,
    isLaser,
    size,
    printLocation,
    printMethod,
    rushOrder,
    proofBeforePrinting,
  ]);

  if (!product || !pricing) {
    return (
      <section className="wrap">
        <div className="card">
          <h2>Product not found</h2>
          <button className="btn secondary" onClick={onBack}>
            Back to Shop
          </button>
        </div>
      </section>
    );
  }

  const submit = () => {
    onAdd(
      product,
      {
        builderType: isLaser ? "laser" : isApparel ? "apparel" : "general",
        size,
        color,
        shirtStyle: isApparel ? shirtStyle : "",
        designType,
        printLocation: isApparel ? printLocation : "",
        printMethod: isApparel ? printMethod : "",
        personalization,
        designNotes,
        artworkMethod,
        proofBeforePrinting: proofBeforePrinting ? "Yes" : "No",
        rushOrder: rushOrder ? "Yes" : "No",
        deliveryMethod,
        neededBy,
        occasion,
        laserItemType: isLaser ? laserItemType : "",
        laserMaterial: isLaser ? laserMaterial : "",
        dimensions: isLaser ? dimensions : "",
        layoutStyle: isLaser ? layoutStyle : "",
        finishColor: isLaser ? finishColor : "",
        engravingText: isLaser ? engravingText : "",
        baseUnitPrice: pricing.baseUnitPrice,
        optionUpchargePerUnit: pricing.optionUpchargePerUnit,
        oneTimeAddOns: pricing.oneTimeAddOns,
        calculatedUnitPrice: pricing.calculatedUnitPrice,
        calculatedLineTotal: pricing.calculatedLineTotal,
      },
      pricing.qty
    );
  };

  return (
    <section className="wrap">
      <div className="eyebrow">Guided Product Builder</div>
      <div className="grid g2 builder-layout">
        <div className="card product builder-product">
          <div className="product-art">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} />
            ) : (
              <span>{product.emoji || "🎨"}</span>
            )}
          </div>
          <div className="product-body">
            <span className="tag">{product.category || "Custom Product"}</span>
            <h2>{product.name}</h2>
            <p className="muted">{product.description}</p>
            <div className="price">{money(pricing.baseUnitPrice)} base price</div>
            <p className="muted">Your price updates while you customize.</p>
          </div>
        </div>

        <div className="card">
          <BuilderSection title="1. Product Details">
            <Field label="Quantity">
              <input
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              />
            </Field>

            {isApparel && (
              <>
                <Field label="Shirt Style">
                  <select value={shirtStyle} onChange={(e) => setShirtStyle(e.target.value)}>
                    {SHIRT_STYLES.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Size">
                  <select value={size} onChange={(e) => setSize(e.target.value)}>
                    {sizeOptions.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Shirt Color">
                  <select value={color} onChange={(e) => setColor(e.target.value)}>
                    {colorOptions.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}

            {isLaser && (
              <>
                <Field label="Laser Item">
                  <select
                    value={laserItemType}
                    onChange={(e) => setLaserItemType(e.target.value)}
                  >
                    {LASER_ITEM_TYPES.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Material">
                  <select
                    value={laserMaterial}
                    onChange={(e) => setLaserMaterial(e.target.value)}
                  >
                    {LASER_MATERIALS.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Dimensions / Size">
                  <input
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder={'Example: 12" x 18"'}
                  />
                </Field>

                <Field label="Finish / Color">
                  <input
                    value={finishColor}
                    onChange={(e) => setFinishColor(e.target.value)}
                    placeholder="Natural, black, gold..."
                  />
                </Field>

                <Field label="Layout / Style" full>
                  <input
                    value={layoutStyle}
                    onChange={(e) => setLayoutStyle(e.target.value)}
                    placeholder="Round badge, centered text..."
                  />
                </Field>
              </>
            )}

            <Field label="Needed By">
              <input
                type="date"
                value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)}
              />
            </Field>

            <Field label="Event / Occasion">
              <input
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="Birthday, reunion, school event..."
              />
            </Field>
          </BuilderSection>

          <BuilderSection title="2. Design Details">
            <Field label="Design Type">
              <select value={designType} onChange={(e) => setDesignType(e.target.value)}>
                {DESIGN_TYPES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </Field>

            {isApparel && (
              <>
                <Field label="Design Placement">
                  <select
                    value={printLocation}
                    onChange={(e) => setPrintLocation(e.target.value)}
                  >
                    {PRINT_LOCATIONS.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Print Method">
                  <select value={printMethod} onChange={(e) => setPrintMethod(e.target.value)}>
                    {PRINT_METHODS.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}

            <Field label="Artwork">
              <select
                value={artworkMethod}
                onChange={(e) => setArtworkMethod(e.target.value)}
              >
                <option>I will email my artwork</option>
                <option>Text / wording only</option>
                <option>Please create the design for me</option>
              </select>
            </Field>

            <Field
              label={isLaser ? "Engraving Text / Names / Monogram" : "Personalization / Wording"}
              full
            >
              <textarea
                value={isLaser ? engravingText : personalization}
                onChange={(e) =>
                  isLaser
                    ? setEngravingText(e.target.value)
                    : setPersonalization(e.target.value)
                }
                placeholder={isLaser ? "Exact wording for engraving" : "Names, numbers, phrase..."}
              />
            </Field>

            <Field label="Design Description / Special Instructions" full>
              <textarea
                value={designNotes}
                onChange={(e) => setDesignNotes(e.target.value)}
                placeholder="Describe the look, theme, colors, placement, and anything else we should know."
              />
            </Field>
          </BuilderSection>

          <BuilderSection title="3. Order Options">
            <Field label="Delivery">
              <select
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
              >
                <option>Local Pickup</option>
                <option>Shipping</option>
              </select>
            </Field>

            <CheckField
              checked={rushOrder}
              onChange={setRushOrder}
              label="Rush Order"
            />

            {!isLaser && (
              <CheckField
                checked={proofBeforePrinting}
                onChange={setProofBeforePrinting}
                label="Proof Before Printing"
              />
            )}
          </BuilderSection>

          <BuilderSection title="4. Review Price">
            <div className="price-box full">
              <PriceRow label="Base unit price" value={money(pricing.baseUnitPrice)} />
              {pricing.optionUpchargePerUnit > 0 && (
                <PriceRow
                  label="Selected option upgrades"
                  value={`+ ${money(pricing.optionUpchargePerUnit)} / item`}
                />
              )}
              <PriceRow label="Quantity" value={pricing.qty} />
              <PriceRow label="Items subtotal" value={money(pricing.itemSubtotal)} />
              {pricing.oneTimeAddOns > 0 && (
                <PriceRow
                  label="One-time options"
                  value={money(pricing.oneTimeAddOns)}
                />
              )}
              <div className="row space total-row">
                <strong>Estimated Product Total</strong>
                <span className="price">{money(pricing.calculatedLineTotal)}</span>
              </div>
              <p className="muted">
                Shipping and applicable tax are handled separately at checkout or final review.
              </p>
            </div>
          </BuilderSection>

          <div className="row">
            <button className="btn primary" onClick={submit}>
              Add Configured Product to Cart
            </button>
            <button className="btn secondary" onClick={onBack}>
              Back to Shop
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function BuilderSection({ title, children }) {
  return (
    <section className="builder-section">
      <h2>{title}</h2>
      <div className="form">{children}</div>
    </section>
  );
}

function Field({ label, full = false, children }) {
  return (
    <label className={`field ${full ? "full" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function CheckField({ checked, onChange, label }) {
  return (
    <label className="check-field">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function PriceRow({ label, value }) {
  return (
    <div className="row space price-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
