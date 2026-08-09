import { useMemo, useState } from "react";
import { BUILDER_PRICING, DESIGN_TYPES } from "../../config/pricing";
import { PRODUCT_TEMPLATES } from "../../config/catalog";
import { money } from "../../utils";
import {
  BuilderSection,
  Check,
  Field,
  PriceRow,
  TemplateChooser,
} from "./BuilderUI";

const DRINKWARE_TYPES = [
  "20 oz Tumbler",
  "30 oz Tumbler",
  "Coffee Mug",
  "Other Drinkware",
];

const WRAP_STYLES = [
  "Name / Text Only",
  "Logo / Graphic",
  "Front & Back Design",
  "Full Wrap",
  "Other",
];

export default function DrinkwareBuilder({ product, preset, onAdd }) {
  const productName = String(product?.name || "").toLowerCase();

  const defaultType = productName.includes("30")
    ? "30 oz Tumbler"
    : productName.includes("mug")
    ? "Coffee Mug"
    : "20 oz Tumbler";

  const initialTemplate =
    PRODUCT_TEMPLATES.drinkware.find(
      (item) => item.designType === preset?.designType
    ) || null;

  const [template, setTemplate] = useState(initialTemplate);
  const [quantity, setQuantity] = useState(1);
  const [drinkwareType, setDrinkwareType] = useState(defaultType);
  const [wrapStyle, setWrapStyle] = useState("Logo / Graphic");
  const [color, setColor] = useState("");
  const [designType, setDesignType] = useState(preset?.designType || "Custom");
  const [personalization, setPersonalization] = useState("");
  const [artworkMethod, setArtworkMethod] = useState("I will email my artwork");
  const [designNotes, setDesignNotes] = useState("");
  const [rushOrder, setRushOrder] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("Local Pickup");
  const [neededBy, setNeededBy] = useState("");

  const size =
    drinkwareType === "30 oz Tumbler"
      ? "30 oz"
      : drinkwareType === "20 oz Tumbler"
      ? "20 oz"
      : "";

  const fullWrap = wrapStyle === "Full Wrap";

  const pricing = useMemo(() => {
    const qty = Math.max(1, Number(quantity) || 1);

    // Known tumbler prices. Mug/other keeps product's Firestore base price.
    const baseUnitPrice =
      BUILDER_PRICING.drinkware.tumblerBase[size] ??
      Number(product?.salePrice > 0 ? product.salePrice : product?.price || 0);

    let perUnitAddOns = 0;
    let oneTimeAddOns = 0;

    if (personalization.trim()) {
      perUnitAddOns += BUILDER_PRICING.drinkware.personalizationAddOn;
    }

    if (fullWrap && size) {
      perUnitAddOns += BUILDER_PRICING.drinkware.fullWrapAddOn;
    }

    if (rushOrder) {
      oneTimeAddOns += BUILDER_PRICING.drinkware.rushAddOn;
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
  }, [quantity, size, product, personalization, fullWrap, rushOrder]);

  const chooseTemplate = (next) => {
    setTemplate(next);
    setDesignType(next.designType);
  };

  const add = () =>
    onAdd(
      product,
      {
        builderType: "drinkware",
        templateId: template?.id || "",
        templateLabel: template?.label || "",
        drinkwareType,
        size,
        wrapStyle,
        fullWrap: fullWrap ? "Yes" : "No",
        color,
        designType,
        personalization,
        artworkMethod,
        designNotes,
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
      <BuilderSection title="1. Choose a Drinkware Style">
        <TemplateChooser
          templates={PRODUCT_TEMPLATES.drinkware}
          value={template}
          onChange={chooseTemplate}
        />
      </BuilderSection>

      <BuilderSection title="2. Drinkware Details">
        <Field label="Drinkware Type">
          <select
            value={drinkwareType}
            onChange={(e) => setDrinkwareType(e.target.value)}
          >
            {DRINKWARE_TYPES.map((value) => (
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

        <Field label="Wrap / Design Style">
          <select value={wrapStyle} onChange={(e) => setWrapStyle(e.target.value)}>
            {WRAP_STYLES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>

        <Field label="Color / Theme">
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Pink, sports theme, school colors..."
          />
        </Field>
      </BuilderSection>

      <BuilderSection title="3. Personalization & Design">
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

        <Field label="Name Personalization (+$5/item)" full>
          <input
            value={personalization}
            onChange={(e) => setPersonalization(e.target.value)}
            placeholder="Leave blank if not needed"
          />
        </Field>

        <Field label="Design Notes" full>
          <textarea
            value={designNotes}
            onChange={(e) => setDesignNotes(e.target.value)}
            placeholder="Describe colors, wording, images, placement, glitter/look, etc."
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

      <BuilderSection title="4. Order Options">
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
        Add Configured Drinkware to Cart
      </button>
    </>
  );
}
