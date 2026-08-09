import { useMemo, useState } from "react";
import {
  BUILDER_PRICING,
  DESIGN_TYPES,
  LASER_ITEM_TYPES,
  LASER_MATERIALS,
} from "../../config/pricing";
import { PRODUCT_TEMPLATES } from "../../config/catalog";
import { money } from "../../utils";
import {
  BuilderSection,
  Check,
  Field,
  PriceRow,
  TemplateChooser,
} from "./BuilderUI";

const ENGRAVING_SIDES = [
  "One Side",
  "Two Sides",
];

const LAYOUT_STYLES = [
  "Centered",
  "Circular / Badge",
  "Monogram",
  "Portrait",
  "Landscape",
  "Logo + Text",
  "Text Only",
  "Other",
];

const FINISH_OPTIONS = [
  "Natural",
  "Black",
  "White",
  "Gold",
  "Silver",
  "Clear",
  "Other",
];

export default function LaserBuilder({ product, preset, onAdd }) {
  const name = String(product?.name || "").toLowerCase();

  const defaultItem = name.includes("keychain")
    ? "Keychain"
    : name.includes("acrylic")
    ? "Acrylic Sign"
    : "Cutting Board";

  const initialTemplate =
    PRODUCT_TEMPLATES.laser.find(
      (item) => item.designType === preset?.designType
    ) || null;

  const [template, setTemplate] = useState(initialTemplate);
  const [quantity, setQuantity] = useState(1);
  const [laserItemType, setLaserItemType] = useState(defaultItem);
  const [laserMaterial, setLaserMaterial] = useState("Wood");
  const [dimensions, setDimensions] = useState("");
  const [engravingSides, setEngravingSides] = useState("One Side");
  const [layoutStyle, setLayoutStyle] = useState("Centered");
  const [finishColor, setFinishColor] = useState("Natural");
  const [engravingText, setEngravingText] = useState("");
  const [designType, setDesignType] = useState(preset?.designType || "Custom");
  const [artworkMethod, setArtworkMethod] = useState("I will email my artwork");
  const [designNotes, setDesignNotes] = useState("");
  const [designFee, setDesignFee] = useState(false);
  const [rushOrder, setRushOrder] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("Local Pickup");
  const [neededBy, setNeededBy] = useState("");

  const extraEngravingSide = engravingSides === "Two Sides";

  const pricing = useMemo(() => {
    const qty = Math.max(1, Number(quantity) || 1);

    const baseUnitPrice =
      BUILDER_PRICING.laser.itemBase[laserItemType] ??
      Number(product?.salePrice > 0 ? product.salePrice : product?.price || 0);

    let perUnitAddOns = 0;
    let oneTimeAddOns = 0;

    if (extraEngravingSide) {
      perUnitAddOns += BUILDER_PRICING.laser.extraEngravingSideAddOn;
    }

    if (designFee) {
      oneTimeAddOns += BUILDER_PRICING.laser.designFeeAddOn;
    }

    if (rushOrder) {
      oneTimeAddOns += BUILDER_PRICING.laser.rushAddOn;
    }

    const unitPrice = baseUnitPrice + perUnitAddOns;
    const itemsSubtotal = unitPrice * qty;

    return {
      qty,
      baseUnitPrice,
      perUnitAddOns,
      oneTimeAddOns,
      unitPrice,
      itemsSubtotal,
      total: itemsSubtotal + oneTimeAddOns,
    };
  }, [
    quantity,
    laserItemType,
    product,
    extraEngravingSide,
    designFee,
    rushOrder,
  ]);

  const chooseTemplate = (next) => {
    setTemplate(next);
    setDesignType(next.designType);
  };

  const add = () =>
    onAdd(
      product,
      {
        builderType: "laser",
        templateId: template?.id || "",
        templateLabel: template?.label || "",
        laserItemType,
        laserMaterial,
        dimensions,
        engravingSides,
        extraEngravingSide: extraEngravingSide ? "Yes" : "No",
        layoutStyle,
        finishColor,
        engravingText,
        designType,
        artworkMethod,
        designNotes,
        designFee: designFee ? "Yes" : "No",
        rushOrder: rushOrder ? "Yes" : "No",
        deliveryMethod,
        neededBy,
        baseUnitPrice: pricing.baseUnitPrice,
        optionUpchargePerUnit: pricing.perUnitAddOns,
        oneTimeAddOns: pricing.oneTimeAddOns,
        calculatedUnitPrice: pricing.unitPrice,
        calculatedLineTotal: pricing.total,
      },
      pricing.qty
    );

  return (
    <>
      <BuilderSection title="1. Choose an Engraving Style">
        <TemplateChooser
          templates={PRODUCT_TEMPLATES.laser}
          value={template}
          onChange={chooseTemplate}
        />
      </BuilderSection>

      <BuilderSection title="2. Engraving Product Details">
        <Field label="Engraving Item">
          <select
            value={laserItemType}
            onChange={(e) => setLaserItemType(e.target.value)}
          >
            {LASER_ITEM_TYPES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>

        <Field label="Quantity">
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, Number(e.target.value) || 1))
            }
          />
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

        <Field label="Engraving Sides">
          <select
            value={engravingSides}
            onChange={(e) => setEngravingSides(e.target.value)}
          >
            {ENGRAVING_SIDES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>

        <Field
          label="Dimensions / Size"
          hint='Example: 12" x 18", 4" round, etc.'
        >
          <input
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            placeholder={'Example: 12" x 18"'}
          />
        </Field>

        <Field label="Layout / Style">
          <select
            value={layoutStyle}
            onChange={(e) => setLayoutStyle(e.target.value)}
          >
            {LAYOUT_STYLES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>

        <Field label="Finish / Color">
          <select
            value={finishColor}
            onChange={(e) => setFinishColor(e.target.value)}
          >
            {FINISH_OPTIONS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>
      </BuilderSection>

      <BuilderSection title="3. Engraving Text & Artwork">
        <Field label="Design Type">
          <select
            value={designType}
            onChange={(e) => setDesignType(e.target.value)}
          >
            {DESIGN_TYPES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>

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

        <Field label="Engraving Text / Names / Monogram" full>
          <textarea
            value={engravingText}
            onChange={(e) => setEngravingText(e.target.value)}
            placeholder="Enter the exact wording to engrave."
          />
        </Field>

        <Field label="Design Notes / Special Instructions" full>
          <textarea
            value={designNotes}
            onChange={(e) => setDesignNotes(e.target.value)}
            placeholder="Describe the layout, image placement, font style, special details, etc."
          />
        </Field>

        <Field label="Needed By">
          <input
            type="date"
            value={neededBy}
            onChange={(e) => setNeededBy(e.target.value)}
          />
        </Field>
      </BuilderSection>

      <BuilderSection title="4. Engraving Add-ons">
        <div className="notice full">
          Two-sided engraving automatically adds $5 per item.
        </div>

        <Check
          checked={designFee}
          onChange={setDesignFee}
          label="Custom Design Fee (+$25/order)"
        />

        <Check
          checked={rushOrder}
          onChange={setRushOrder}
          label="Rush Order (+$20/order)"
        />

        <Field label="Delivery">
          <select
            value={deliveryMethod}
            onChange={(e) => setDeliveryMethod(e.target.value)}
          >
            <option>Local Pickup</option>
            <option>Shipping</option>
          </select>
        </Field>
      </BuilderSection>

      <BuilderSection title="5. Review Price">
        <div className="price-box full">
          <PriceRow
            label="Base unit price"
            value={money(pricing.baseUnitPrice)}
          />
          {pricing.perUnitAddOns > 0 && (
            <PriceRow
              label="Per-item add-ons"
              value={`+ ${money(pricing.perUnitAddOns)}`}
            />
          )}
          <PriceRow label="Quantity" value={pricing.qty} />
          <PriceRow
            label="Items subtotal"
            value={money(pricing.itemsSubtotal)}
          />
          {pricing.oneTimeAddOns > 0 && (
            <PriceRow
              label="One-time add-ons"
              value={money(pricing.oneTimeAddOns)}
            />
          )}
          <PriceRow
            label="Estimated Product Total"
            value={money(pricing.total)}
            strong
          />
        </div>
      </BuilderSection>

      <button className="btn primary btn-lg builder-submit" onClick={add}>
        Add Configured Engraving to Cart
      </button>
    </>
  );
}
