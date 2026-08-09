import { useMemo, useState } from "react";
import {
  BUILDER_PRICING,
  DESIGN_TYPES,
  PRINT_LOCATIONS,
  PRINT_METHODS,
  SHIRT_SIZES,
  apparelKind,
} from "../../config/pricing";
import { PRODUCT_TEMPLATES } from "../../config/catalog";
import { money, splitOptions } from "../../utils";
import {
  BuilderSection,
  Check,
  Field,
  PriceRow,
  TemplateChooser,
} from "./BuilderUI";

export default function ApparelBuilder({ product, preset, onAdd }) {
  const kind = apparelKind(product);
  const sizeOptions = splitOptions(product?.sizes, SHIRT_SIZES);
  const colorOptions = splitOptions(product?.colors, [
    "Black","White","Red","Royal Blue","Navy","Pink","Purple","Heather Gray"
  ]);

  const initialTemplate =
    PRODUCT_TEMPLATES.apparel.find((item) => item.designType === preset?.designType) ||
    null;

  const [template, setTemplate] = useState(initialTemplate);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState(sizeOptions[0] || "M");
  const [color, setColor] = useState(colorOptions[0] || "Black");
  const [printLocation, setPrintLocation] = useState("Front Only");
  const [printMethod, setPrintMethod] = useState("DTF");
  const [sleevePrint, setSleevePrint] = useState(false);
  const [personalization, setPersonalization] = useState("");
  const [designType, setDesignType] = useState(preset?.designType || "Custom");
  const [designNotes, setDesignNotes] = useState("");
  const [artworkMethod, setArtworkMethod] = useState("I will email my artwork");
  const [proofBeforePrinting, setProofBeforePrinting] = useState(true);
  const [rushOrder, setRushOrder] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("Local Pickup");
  const [neededBy, setNeededBy] = useState("");
  const [occasion, setOccasion] = useState("");

  const pricing = useMemo(() => {
    const qty = Math.max(1, Number(quantity) || 1);
    const table = BUILDER_PRICING.apparel[kind];
    const baseUnitPrice = table?.baseBySize?.[size] ?? 0;
    let perUnitAddOns = 0;
    let oneTimeAddOns = 0;

    if (printLocation === "Front & Back") {
      perUnitAddOns += table?.backPrintAddOn || 0;
    }
    if (sleevePrint) {
      perUnitAddOns += BUILDER_PRICING.apparel.sleevePrintAddOn;
    }
    if (personalization.trim()) {
      perUnitAddOns += BUILDER_PRICING.apparel.personalizationAddOn;
    }
    if (rushOrder) {
      oneTimeAddOns += BUILDER_PRICING.apparel.rushAddOn;
    }

    const unitPrice = baseUnitPrice + perUnitAddOns;
    const itemsSubtotal = unitPrice * qty;
    const total = itemsSubtotal + oneTimeAddOns;

    return { qty, baseUnitPrice, perUnitAddOns, oneTimeAddOns, unitPrice, itemsSubtotal, total };
  }, [quantity, kind, size, printLocation, sleevePrint, personalization, rushOrder]);

  const chooseTemplate = (next) => {
    setTemplate(next);
    setDesignType(next.designType);
  };

  const add = () =>
    onAdd(
      product,
      {
        builderType: "apparel",
        apparelKind: kind,
        templateId: template?.id || "",
        templateLabel: template?.label || "",
        size,
        color,
        printLocation,
        printMethod,
        sleevePrint: sleevePrint ? "Yes" : "No",
        personalization,
        designType,
        designNotes,
        artworkMethod,
        proofBeforePrinting: proofBeforePrinting ? "Yes" : "No",
        rushOrder: rushOrder ? "Yes" : "No",
        deliveryMethod,
        neededBy,
        occasion,
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
      <BuilderSection
        title="1. Choose Your Style"
        subtitle="Start with a popular purpose or skip straight to your own custom idea."
      >
        <TemplateChooser
          templates={PRODUCT_TEMPLATES.apparel}
          value={template}
          onChange={chooseTemplate}
        />
      </BuilderSection>

      <BuilderSection title="2. Apparel Details">
        <Field label="Quantity">
          <input type="number" min="1" max="99" value={quantity}
            onChange={(e)=>setQuantity(Math.max(1,Number(e.target.value)||1))}/>
        </Field>
        <Field label="Size">
          <select value={size} onChange={(e)=>setSize(e.target.value)}>
            {sizeOptions.map((value)=><option key={value}>{value}</option>)}
          </select>
        </Field>
        <Field label="Color">
          <select value={color} onChange={(e)=>setColor(e.target.value)}>
            {colorOptions.map((value)=><option key={value}>{value}</option>)}
          </select>
        </Field>
        <Field label="Print Location">
          <select value={printLocation} onChange={(e)=>setPrintLocation(e.target.value)}>
            {PRINT_LOCATIONS.map((value)=><option key={value}>{value}</option>)}
          </select>
        </Field>
        <Field label="Print Method">
          <select value={printMethod} onChange={(e)=>setPrintMethod(e.target.value)}>
            {PRINT_METHODS.map((value)=><option key={value}>{value}</option>)}
          </select>
        </Field>
        <Check
          checked={sleevePrint}
          onChange={setSleevePrint}
          label="Sleeve Print (+$10/item)"
        />
      </BuilderSection>

      <BuilderSection title="3. Design & Personalization">
        <Field label="Design Type">
          <select value={designType} onChange={(e)=>setDesignType(e.target.value)}>
            {DESIGN_TYPES.map((value)=><option key={value}>{value}</option>)}
          </select>
        </Field>
        <Field label="Artwork">
          <select value={artworkMethod} onChange={(e)=>setArtworkMethod(e.target.value)}>
            <option>I will email my artwork</option>
            <option>Text / wording only</option>
            <option>Please create the design for me</option>
          </select>
        </Field>
        <Field label="Personalized Name / Number (+$5/item)" full>
          <input
            value={personalization}
            onChange={(e)=>setPersonalization(e.target.value)}
            placeholder="Leave blank if not needed"
          />
        </Field>
        <Field label="Design Description / Special Instructions" full>
          <textarea
            value={designNotes}
            onChange={(e)=>setDesignNotes(e.target.value)}
            placeholder="Describe your design, colors, wording, placement or special requests."
          />
        </Field>
        <Field label="Needed By">
          <input type="date" value={neededBy} onChange={(e)=>setNeededBy(e.target.value)}/>
        </Field>
        <Field label="Event / Occasion">
          <input value={occasion} onChange={(e)=>setOccasion(e.target.value)}
            placeholder="Birthday, reunion, school event..."/>
        </Field>
      </BuilderSection>

      <BuilderSection title="4. Order Options">
        <Check
          checked={proofBeforePrinting}
          onChange={setProofBeforePrinting}
          label="Proof Before Printing"
        />
        <Check
          checked={rushOrder}
          onChange={setRushOrder}
          label="Rush Order (+$20/order)"
        />
        <Field label="Delivery">
          <select value={deliveryMethod} onChange={(e)=>setDeliveryMethod(e.target.value)}>
            <option>Local Pickup</option>
            <option>Shipping</option>
          </select>
        </Field>
      </BuilderSection>

      <BuilderSection title="5. Review Price">
        <div className="price-box full">
          <PriceRow label="Base unit price" value={money(pricing.baseUnitPrice)} />
          {pricing.perUnitAddOns > 0 && (
            <PriceRow label="Per-item add-ons" value={`+ ${money(pricing.perUnitAddOns)}`} />
          )}
          <PriceRow label="Quantity" value={pricing.qty} />
          <PriceRow label="Items subtotal" value={money(pricing.itemsSubtotal)} />
          {pricing.oneTimeAddOns > 0 && (
            <PriceRow label="One-time add-ons" value={money(pricing.oneTimeAddOns)} />
          )}
          <PriceRow label="Estimated Product Total" value={money(pricing.total)} strong />
        </div>
      </BuilderSection>

      <button className="btn primary btn-lg builder-submit" onClick={add}>
        Add Configured Apparel to Cart
      </button>
    </>
  );
}
