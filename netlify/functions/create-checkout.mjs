import {
  firestoreGet,
  getBearerToken,
  verifyFirebaseIdToken,
} from "./_shared.mjs";


const STARTER_PRICING = {
  apparel: {
    sizeUpcharge: {"S":0,"M":0,"L":0,"XL":0,"2XL":2500,"3XL":2500,"4XL":2700,"5XL":3000},
    styleUpcharge: {"Unisex (Adult)":0,"Women's Fitted":0,"Youth":0,"Long Sleeve":2500,"Hoodie":3500,"Other":0},
    placement: {"Front Only":0,"Back Only":0,"Front & Back":4500,"Left Chest":0,"Sleeve":1000},
    printMethod: {"DTF":0,"Screen Print":0,"Vinyl":0},
    personalization: 500,
    rush: 2000
  },
  tumbler: {
    sizePrice: {"20 oz":3000,"30 oz":4000},
    personalization: 500,
    fullWrap: 200,
    rush: 2000
  },
  laser: {
    itemPrice: {"Cutting Board":4000,"Keychain":1000,"Acrylic Sign":2000},
    extraEngravingSide: 500,
    rush: 2000,
    designFee: 2500
  }
};

function calculateConfiguredPricing(basePrice, qty, options) {
  if (!options) {
    return { unitAmount: basePrice, oneTimeAddOn: 0, lineTotal: basePrice * qty };
  }

  let resolvedBase = basePrice;
  let perUnit = 0;
  let oneTime = 0;

  if (options.builderType === "apparel") {
    perUnit += STARTER_PRICING.apparel.sizeUpcharge[options.size] || 0;
    perUnit += STARTER_PRICING.apparel.styleUpcharge[options.shirtStyle] || 0;
    perUnit += STARTER_PRICING.apparel.placement[options.printLocation] || 0;
    perUnit += STARTER_PRICING.apparel.printMethod[options.printMethod] || 0;
    if (String(options.personalization || "").trim()) {
      perUnit += STARTER_PRICING.apparel.personalization;
    }
    if (options.rushOrder === "Yes") oneTime += STARTER_PRICING.apparel.rush;
  } else if (options.builderType === "tumbler") {
    resolvedBase = STARTER_PRICING.tumbler.sizePrice[options.size] || basePrice;
    if (String(options.personalization || "").trim()) {
      perUnit += STARTER_PRICING.tumbler.personalization;
    }
    if (options.fullWrap === "Yes") perUnit += STARTER_PRICING.tumbler.fullWrap;
    if (options.rushOrder === "Yes") oneTime += STARTER_PRICING.tumbler.rush;
  } else if (options.builderType === "laser") {
    resolvedBase = STARTER_PRICING.laser.itemPrice[options.laserItemType] || basePrice;
    if (options.extraEngravingSide === "Yes") {
      perUnit += STARTER_PRICING.laser.extraEngravingSide;
    }
    if (options.rushOrder === "Yes") oneTime += STARTER_PRICING.laser.rush;
    if (options.designFee === "Yes") oneTime += STARTER_PRICING.laser.designFee;
  }

  const unitAmount = resolvedBase + perUnit;
  return {
    unitAmount,
    oneTimeAddOn: oneTime,
    lineTotal: (unitAmount * qty) + oneTime
  };
}

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

    if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY is not configured.");
    if (!projectId) throw new Error("VITE_FIREBASE_PROJECT_ID is not configured.");

    const token = getBearerToken(request);
    if (!token) {
      return Response.json({ error: "Please sign in before checkout." }, { status: 401 });
    }

    const customer = await verifyFirebaseIdToken(token, projectId);

    let payload;
    try {
      payload = await request.json();
    } catch {
      return Response.json({ error: "Invalid checkout request." }, { status: 400 });
    }

    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!items.length || items.length > 50) {
      return Response.json({ error: "Your cart is empty or too large." }, { status: 400 });
    }

    const normalized = items.map((item) => ({
      id: String(item?.id || "").trim(),
      qty: Number(item?.qty),
      lineKey: String(item?.lineKey || "").slice(0,120),
      options: item?.options && typeof item.options === "object" ? {
        builderType: String(item.options.builderType || "").slice(0,80),
        size: String(item.options.size || "").slice(0,120),
        color: String(item.options.color || "").slice(0,120),
        shirtStyle: String(item.options.shirtStyle || "").slice(0,160),
        designType: String(item.options.designType || "").slice(0,160),
        printLocation: String(item.options.printLocation || "").slice(0,160),
        printMethod: String(item.options.printMethod || "").slice(0,120),
        personalization: String(item.options.personalization || "").slice(0,400),
        designNotes: String(item.options.designNotes || "").slice(0,400),
        artworkMethod: String(item.options.artworkMethod || "").slice(0,200),
        proofBeforePrinting: String(item.options.proofBeforePrinting || "").slice(0,20),
        rushOrder: String(item.options.rushOrder || "").slice(0,20),
        deliveryMethod: String(item.options.deliveryMethod || "").slice(0,80),
        neededBy: String(item.options.neededBy || "").slice(0,40),
        occasion: String(item.options.occasion || "").slice(0,200),
        laserItemType: String(item.options.laserItemType || "").slice(0,160),
        laserMaterial: String(item.options.laserMaterial || "").slice(0,160),
        dimensions: String(item.options.dimensions || "").slice(0,160),
        layoutStyle: String(item.options.layoutStyle || "").slice(0,300),
        finishColor: String(item.options.finishColor || "").slice(0,160),
        engravingText: String(item.options.engravingText || "").slice(0,400),
        fullWrap: String(item.options.fullWrap || "").slice(0,20),
        extraEngravingSide: String(item.options.extraEngravingSide || "").slice(0,20),
        designFee: String(item.options.designFee || "").slice(0,20),
        baseUnitPrice: Number(item.options.baseUnitPrice || 0),
        optionUpchargePerUnit: Number(item.options.optionUpchargePerUnit || 0),
        oneTimeAddOns: Number(item.options.oneTimeAddOns || 0),
        calculatedUnitPrice: Number(item.options.calculatedUnitPrice || 0),
        calculatedLineTotal: Number(item.options.calculatedLineTotal || 0),
      } : null,
    }));

    for (const item of normalized) {
      if (!item.id || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) {
        return Response.json({ error: "One or more cart items are invalid." }, { status: 400 });
      }
    }

    const products = [];
    for (const item of normalized) {
      const p = await firestoreGet(projectId, `products/${encodeURIComponent(item.id)}`);
      if (!p) {
        return Response.json({ error: "A product in your cart no longer exists." }, { status: 400 });
      }
      if (p.active === false) {
        return Response.json({ error: `${p.name || "A product"} is not currently available.` }, { status: 400 });
      }

      const regular = Number(p.price || 0);
      const sale = Number(p.salePrice || 0);
      const amount = sale > 0 && sale < regular ? sale : regular;

      if (!Number.isInteger(amount) || amount < 50) {
        return Response.json({ error: `${p.name || "A product"} has an invalid price.` }, { status: 400 });
      }

      const configured = calculateConfiguredPricing(amount, item.qty, item.options);
      products.push({
        ...p,
        id:item.id,
        qty:item.qty,
        lineKey:item.lineKey,
        options:item.options,
        checkoutAmount:configured.unitAmount,
        oneTimeAddOn:configured.oneTimeAddOn
      });
    }

    const originHeader = request.headers.get("origin");
    const origin =
      originHeader && /^https?:\/\//i.test(originHeader)
        ? originHeader
        : new URL(request.url).origin;

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("client_reference_id", customer.sub);
    form.set("metadata[firebaseUid]", customer.sub);
    if (customer.email) form.set("customer_email", customer.email);

    // Collect phone and US shipping address for fulfillment.
    form.set("phone_number_collection[enabled]", "true");
    form.set("shipping_address_collection[allowed_countries][0]", "US");

    form.set("success_url", `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${origin}/?checkout=cancel`);

    products.forEach((p, index) => {
      form.set(`line_items[${index}][quantity]`, String(p.qty));
      form.set(`line_items[${index}][price_data][currency]`, "usd");
      form.set(`line_items[${index}][price_data][unit_amount]`, String(p.checkoutAmount));
      form.set(`line_items[${index}][price_data][product_data][name]`, p.name || "Custom Product");
      form.set(`line_items[${index}][price_data][product_data][metadata][firestoreProductId]`, p.id);
      if (p.lineKey) form.set(`line_items[${index}][price_data][product_data][metadata][lineKey]`, p.lineKey);
      if (p.options?.size) form.set(`line_items[${index}][price_data][product_data][metadata][size]`, p.options.size);
      if (p.options?.color) form.set(`line_items[${index}][price_data][product_data][metadata][color]`, p.options.color);
      if (p.options?.personalization) form.set(`line_items[${index}][price_data][product_data][metadata][personalization]`, p.options.personalization);
      if (p.options?.designNotes) form.set(`line_items[${index}][price_data][product_data][metadata][designNotes]`, p.options.designNotes);
      if (p.options?.shirtStyle) form.set(`line_items[${index}][price_data][product_data][metadata][shirtStyle]`, p.options.shirtStyle);
      if (p.options?.designType) form.set(`line_items[${index}][price_data][product_data][metadata][designType]`, p.options.designType);
      if (p.options?.printLocation) form.set(`line_items[${index}][price_data][product_data][metadata][printLocation]`, p.options.printLocation);
      if (p.options?.printMethod) form.set(`line_items[${index}][price_data][product_data][metadata][printMethod]`, p.options.printMethod);
      if (p.options?.artworkMethod) form.set(`line_items[${index}][price_data][product_data][metadata][artworkMethod]`, p.options.artworkMethod);
      if (p.options?.proofBeforePrinting) form.set(`line_items[${index}][price_data][product_data][metadata][proofBeforePrinting]`, p.options.proofBeforePrinting);
      if (p.options?.rushOrder) form.set(`line_items[${index}][price_data][product_data][metadata][rushOrder]`, p.options.rushOrder);
      if (p.options?.deliveryMethod) form.set(`line_items[${index}][price_data][product_data][metadata][deliveryMethod]`, p.options.deliveryMethod);
      if (p.options?.neededBy) form.set(`line_items[${index}][price_data][product_data][metadata][neededBy]`, p.options.neededBy);
      if (p.options?.occasion) form.set(`line_items[${index}][price_data][product_data][metadata][occasion]`, p.options.occasion);
      if (p.options?.laserItemType) form.set(`line_items[${index}][price_data][product_data][metadata][laserItemType]`, p.options.laserItemType);
      if (p.options?.laserMaterial) form.set(`line_items[${index}][price_data][product_data][metadata][laserMaterial]`, p.options.laserMaterial);
      if (p.options?.dimensions) form.set(`line_items[${index}][price_data][product_data][metadata][dimensions]`, p.options.dimensions);
      if (p.options?.layoutStyle) form.set(`line_items[${index}][price_data][product_data][metadata][layoutStyle]`, p.options.layoutStyle);
      if (p.options?.finishColor) form.set(`line_items[${index}][price_data][product_data][metadata][finishColor]`, p.options.finishColor);
      if (p.options?.engravingText) form.set(`line_items[${index}][price_data][product_data][metadata][engravingText]`, p.options.engravingText);
      if (p.options?.fullWrap) form.set(`line_items[${index}][price_data][product_data][metadata][fullWrap]`, p.options.fullWrap);
      if (p.options?.extraEngravingSide) form.set(`line_items[${index}][price_data][product_data][metadata][extraEngravingSide]`, p.options.extraEngravingSide);
      if (p.options?.designFee) form.set(`line_items[${index}][price_data][product_data][metadata][designFee]`, p.options.designFee);
      form.set(`line_items[${index}][price_data][product_data][metadata][baseUnitPrice]`, String(Number(p.checkoutAmount||0)-Number((STARTER_PRICING.apparel.sizeUpcharge[p.options?.size]||0)+(STARTER_PRICING.apparel.placement[p.options?.printLocation]||0)+(STARTER_PRICING.apparel.printMethod[p.options?.printMethod]||0))));
      form.set(`line_items[${index}][price_data][product_data][metadata][calculatedUnitPrice]`, String(p.checkoutAmount));
      form.set(`line_items[${index}][price_data][product_data][metadata][oneTimeAddOn]`, String(p.oneTimeAddOn||0));
    });

    let extraIndex = products.length;
    products.forEach((p) => {
      if (p.oneTimeAddOn > 0) {
        form.set(`line_items[${extraIndex}][quantity]`, "1");
        form.set(`line_items[${extraIndex}][price_data][currency]`, "usd");
        form.set(`line_items[${extraIndex}][price_data][unit_amount]`, String(p.oneTimeAddOn));
        form.set(`line_items[${extraIndex}][price_data][product_data][name]`, `${p.name || "Custom Product"} - Rush / Order Add-on`);
        form.set(`line_items[${extraIndex}][price_data][product_data][metadata][parentFirestoreProductId]`, p.id);
        form.set(`line_items[${extraIndex}][price_data][product_data][metadata][isOrderAddOn]`, "true");
        extraIndex += 1;
      }
    });


    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    const stripeData = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error("Stripe create session error:", stripeData);
      return Response.json(
        { error: stripeData?.error?.message || "Stripe could not start checkout." },
        { status: 502 }
      );
    }

    return Response.json({ url: stripeData.url });
  } catch (error) {
    console.error("create-checkout error:", error);
    return Response.json(
      { error: error?.message || "Unable to start checkout." },
      { status: 500 }
    );
  }
};
