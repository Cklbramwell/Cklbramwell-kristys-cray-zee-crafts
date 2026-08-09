import { useState } from "react";
import { DESIGN_TYPES } from "../../config/pricing";
import { PRODUCT_TEMPLATES } from "../../config/catalog";
import { BuilderSection, Check, Field, TemplateChooser } from "./BuilderUI";

const TYPES=["Business Cards","Flyers","Banners","Yard Signs","Stickers","Magnets","Other"];

export default function MarketingBuilder({ product, preset, onAdd }) {
  const initialTemplate=PRODUCT_TEMPLATES.marketing.find((item)=>item.designType===preset?.designType)||null;
  const [template,setTemplate]=useState(initialTemplate);
  const [productType,setProductType]=useState("Business Cards");
  const [quantity,setQuantity]=useState(1);
  const [size,setSize]=useState("");
  const [designType,setDesignType]=useState(preset?.designType||"Business Logo");
  const [artworkMethod,setArtworkMethod]=useState("I will email my artwork");
  const [designNotes,setDesignNotes]=useState("");
  const [rushOrder,setRushOrder]=useState(false);
  const [deliveryMethod,setDeliveryMethod]=useState("Local Pickup");
  const [neededBy,setNeededBy]=useState("");

  const chooseTemplate=(next)=>{setTemplate(next);setDesignType(next.designType)};

  const add=()=>onAdd(product,{
    builderType:"marketing",
    templateId:template?.id||"",
    templateLabel:template?.label||"",
    marketingProductType:productType,
    size,designType,artworkMethod,designNotes,
    rushOrder:rushOrder?"Yes":"No",
    deliveryMethod,neededBy,
    priceRequiresReview:"Yes",
    baseUnitPrice:0,
    optionUpchargePerUnit:0,
    oneTimeAddOns:0,
    calculatedUnitPrice:0,
    calculatedLineTotal:0,
  },Math.max(1,Number(quantity)||1));

  return <>
    <BuilderSection title="1. Choose a Marketing Project">
      <TemplateChooser templates={PRODUCT_TEMPLATES.marketing} value={template} onChange={chooseTemplate}/>
    </BuilderSection>

    <BuilderSection title="2. Product Details">
      <Field label="Product Type">
        <select value={productType} onChange={(e)=>setProductType(e.target.value)}>
          {TYPES.map((value)=><option key={value}>{value}</option>)}
        </select>
      </Field>
      <Field label="Quantity">
        <input type="number" min="1" value={quantity} onChange={(e)=>setQuantity(e.target.value)}/>
      </Field>
      <Field label="Size / Dimensions">
        <input value={size} onChange={(e)=>setSize(e.target.value)} placeholder="Example: 24 x 36"/>
      </Field>
      <Field label="Design Type">
        <select value={designType} onChange={(e)=>setDesignType(e.target.value)}>
          {DESIGN_TYPES.map((value)=><option key={value}>{value}</option>)}
        </select>
      </Field>
    </BuilderSection>

    <BuilderSection title="3. Artwork & Details">
      <Field label="Artwork">
        <select value={artworkMethod} onChange={(e)=>setArtworkMethod(e.target.value)}>
          <option>I will email my artwork</option>
          <option>Text / wording only</option>
          <option>Please create the design for me</option>
        </select>
      </Field>
      <Field label="Needed By">
        <input type="date" value={neededBy} onChange={(e)=>setNeededBy(e.target.value)}/>
      </Field>
      <Field label="Design Description / Special Instructions" full>
        <textarea value={designNotes} onChange={(e)=>setDesignNotes(e.target.value)}/>
      </Field>
    </BuilderSection>

    <BuilderSection title="4. Order Options">
      <Check checked={rushOrder} onChange={setRushOrder} label="Rush Order Requested"/>
      <Field label="Delivery">
        <select value={deliveryMethod} onChange={(e)=>setDeliveryMethod(e.target.value)}>
          <option>Local Pickup</option><option>Shipping</option>
        </select>
      </Field>
      <div className="notice full">
        Promotional-product pricing will be reviewed before payment until your final price table is added.
      </div>
    </BuilderSection>

    <button className="btn primary btn-lg builder-submit" onClick={add}>Add Marketing Request to Cart</button>
  </>;
}
