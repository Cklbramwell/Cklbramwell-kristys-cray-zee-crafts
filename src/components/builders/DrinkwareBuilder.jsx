import { useMemo, useState } from "react";
import { BUILDER_PRICING, DESIGN_TYPES, TUMBLER_SIZES } from "../../config/pricing";
import { PRODUCT_TEMPLATES } from "../../config/catalog";
import { money } from "../../utils";
import { BuilderSection, Check, Field, PriceRow, TemplateChooser } from "./BuilderUI";

export default function DrinkwareBuilder({ product, preset, onAdd }) {
  const initialSize = String(product?.name || "").includes("30") ? "30 oz" : "20 oz";
  const initialTemplate =
    PRODUCT_TEMPLATES.drinkware.find((item)=>item.designType===preset?.designType) || null;

  const [template,setTemplate]=useState(initialTemplate);
  const [quantity,setQuantity]=useState(1);
  const [size,setSize]=useState(initialSize);
  const [color,setColor]=useState("");
  const [designType,setDesignType]=useState(preset?.designType||"Custom");
  const [personalization,setPersonalization]=useState("");
  const [fullWrap,setFullWrap]=useState(false);
  const [artworkMethod,setArtworkMethod]=useState("I will email my artwork");
  const [designNotes,setDesignNotes]=useState("");
  const [rushOrder,setRushOrder]=useState(false);
  const [deliveryMethod,setDeliveryMethod]=useState("Local Pickup");
  const [neededBy,setNeededBy]=useState("");

  const pricing=useMemo(()=>{
    const qty=Math.max(1,Number(quantity)||1);
    const baseUnitPrice=BUILDER_PRICING.drinkware.tumblerBase[size]||0;
    let perUnitAddOns=0;
    let oneTimeAddOns=0;
    if(personalization.trim())perUnitAddOns+=BUILDER_PRICING.drinkware.personalizationAddOn;
    if(fullWrap)perUnitAddOns+=BUILDER_PRICING.drinkware.fullWrapAddOn;
    if(rushOrder)oneTimeAddOns+=BUILDER_PRICING.drinkware.rushAddOn;
    const unitPrice=baseUnitPrice+perUnitAddOns;
    const itemsSubtotal=unitPrice*qty;
    return {qty,baseUnitPrice,perUnitAddOns,oneTimeAddOns,unitPrice,itemsSubtotal,total:itemsSubtotal+oneTimeAddOns};
  },[quantity,size,personalization,fullWrap,rushOrder]);

  const chooseTemplate=(next)=>{setTemplate(next);setDesignType(next.designType)};

  const add=()=>onAdd(product,{
    builderType:"drinkware",
    templateId:template?.id||"",
    templateLabel:template?.label||"",
    size,color,designType,personalization,
    fullWrap:fullWrap?"Yes":"No",
    artworkMethod,designNotes,
    rushOrder:rushOrder?"Yes":"No",
    deliveryMethod,neededBy,
    baseUnitPrice:pricing.baseUnitPrice,
    optionUpchargePerUnit:pricing.perUnitAddOns,
    oneTimeAddOns:pricing.oneTimeAddOns,
    calculatedUnitPrice:pricing.unitPrice,
    calculatedLineTotal:pricing.total,
  },pricing.qty);

  return <>
    <BuilderSection title="1. Choose a Drinkware Style">
      <TemplateChooser templates={PRODUCT_TEMPLATES.drinkware} value={template} onChange={chooseTemplate}/>
    </BuilderSection>

    <BuilderSection title="2. Drinkware Details">
      <Field label="Quantity">
        <input type="number" min="1" value={quantity} onChange={(e)=>setQuantity(Math.max(1,Number(e.target.value)||1))}/>
      </Field>
      <Field label="Tumbler Size">
        <select value={size} onChange={(e)=>setSize(e.target.value)}>
          {TUMBLER_SIZES.map((value)=><option key={value}>{value}</option>)}
        </select>
      </Field>
      <Field label="Color / Theme">
        <input value={color} onChange={(e)=>setColor(e.target.value)} placeholder="Pink, sports theme, school colors..."/>
      </Field>
      <Check checked={fullWrap} onChange={setFullWrap} label="Full Wrap (+$2/item)"/>
    </BuilderSection>

    <BuilderSection title="3. Design Details">
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
      <Field label="Name Personalization (+$5/item)" full>
        <input value={personalization} onChange={(e)=>setPersonalization(e.target.value)} placeholder="Leave blank if not needed"/>
      </Field>
      <Field label="Design Notes" full>
        <textarea value={designNotes} onChange={(e)=>setDesignNotes(e.target.value)}/>
      </Field>
      <Field label="Needed By">
        <input type="date" value={neededBy} onChange={(e)=>setNeededBy(e.target.value)}/>
      </Field>
    </BuilderSection>

    <BuilderSection title="4. Order Options">
      <Check checked={rushOrder} onChange={setRushOrder} label="Rush Order (+$20/order)"/>
      <Field label="Delivery">
        <select value={deliveryMethod} onChange={(e)=>setDeliveryMethod(e.target.value)}>
          <option>Local Pickup</option><option>Shipping</option>
        </select>
      </Field>
    </BuilderSection>

    <BuilderSection title="5. Review Price">
      <div className="price-box full">
        <PriceRow label="Base unit price" value={money(pricing.baseUnitPrice)}/>
        {pricing.perUnitAddOns>0&&<PriceRow label="Per-item add-ons" value={`+ ${money(pricing.perUnitAddOns)}`}/>}
        <PriceRow label="Quantity" value={pricing.qty}/>
        <PriceRow label="Items subtotal" value={money(pricing.itemsSubtotal)}/>
        {pricing.oneTimeAddOns>0&&<PriceRow label="One-time add-ons" value={money(pricing.oneTimeAddOns)}/>}
        <PriceRow label="Estimated Product Total" value={money(pricing.total)} strong/>
      </div>
    </BuilderSection>

    <button className="btn primary btn-lg builder-submit" onClick={add}>Add Configured Drinkware to Cart</button>
  </>;
}
