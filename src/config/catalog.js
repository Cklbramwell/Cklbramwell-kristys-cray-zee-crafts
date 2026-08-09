export const PRODUCT_FAMILIES = {
  apparel: {
    label: "Apparel",
    keywords: ["shirt","t-shirt","hoodie","sweatshirt","long sleeve","youth","ladies","safety","apparel"],
  },
  drinkware: {
    label: "Drinkware",
    keywords: ["tumbler","mug","cup","drinkware"],
  },
  laser: {
    label: "Laser Engraving",
    keywords: ["laser","engraving","cutting board","keychain","acrylic","slate","wood","leather"],
  },
  marketing: {
    label: "Promotional Products",
    keywords: ["business card","flyer","banner","yard sign","sticker","magnet","marketing","promotional"],
  },
};

export const PRODUCT_TEMPLATES = {
  apparel: [
    {id:"business",label:"Business Shirts",emoji:"💼",designType:"Business Logo"},
    {id:"birthday",label:"Birthday Shirts",emoji:"🎂",designType:"Birthday"},
    {id:"graduation",label:"Graduation Shirts",emoji:"🎓",designType:"Graduation"},
    {id:"church",label:"Church Shirts",emoji:"⛪",designType:"Church"},
    {id:"sports",label:"Sports Team Shirts",emoji:"🏈",designType:"Sports"},
    {id:"reunion",label:"Family Reunion Shirts",emoji:"👨‍👩‍👧‍👦",designType:"Family Reunion"},
    {id:"wedding",label:"Wedding Party Shirts",emoji:"💍",designType:"Wedding"},
    {id:"school",label:"School Shirts",emoji:"🏫",designType:"School"},
  ],
  drinkware: [
    {id:"name",label:"Name Tumbler",emoji:"✨",designType:"Custom"},
    {id:"birthday",label:"Birthday Tumbler",emoji:"🎂",designType:"Birthday"},
    {id:"graduation",label:"Graduation Tumbler",emoji:"🎓",designType:"Graduation"},
    {id:"business",label:"Business Logo Tumbler",emoji:"💼",designType:"Business Logo"},
    {id:"memorial",label:"Memorial Tumbler",emoji:"🕊️",designType:"Memorial"},
  ],
  laser: [
    {id:"monogram",label:"Monogram / Name",emoji:"🔠",designType:"Custom"},
    {id:"wedding",label:"Wedding Gift",emoji:"💍",designType:"Wedding"},
    {id:"memorial",label:"Memorial Keepsake",emoji:"🕊️",designType:"Memorial"},
    {id:"business",label:"Business Branding",emoji:"💼",designType:"Business Logo"},
    {id:"home",label:"Home Decor",emoji:"🏡",designType:"Custom"},
  ],
  marketing: [
    {id:"business",label:"Business Branding",emoji:"💼",designType:"Business Logo"},
    {id:"event",label:"Event Promotion",emoji:"📣",designType:"Custom"},
    {id:"school",label:"School / Team",emoji:"🏫",designType:"School"},
    {id:"church",label:"Church / Ministry",emoji:"⛪",designType:"Church"},
  ],
};

export const PRODUCT_REVIEWS = [
  {name:"Custom Order Customer",rating:5,text:"The customization steps made it easy to explain exactly what I wanted."},
  {name:"Event Organizer",rating:5,text:"I could see my options and price before checkout, which made ordering much easier."},
  {name:"Small Business Customer",rating:5,text:"Great for keeping apparel, branding details, and order notes together."},
];

export function detectProductFamily(product) {
  const haystack = [
    product?.id,
    product?.name,
    product?.category,
    product?.description,
    product?.emoji,
  ].join(" ").toLowerCase();

  // Strong explicit matches first.
  if (
    haystack.includes("tumbler") ||
    haystack.includes("drinkware") ||
    haystack.includes("coffee mug") ||
    haystack.includes("mug") ||
    haystack.includes("cup") ||
    haystack.includes("🥤") ||
    haystack.includes("☕")
  ) {
    return "drinkware";
  }

  if (
    haystack.includes("laser") ||
    haystack.includes("engraving") ||
    haystack.includes("engraved") ||
    haystack.includes("cutting board") ||
    haystack.includes("keychain") ||
    haystack.includes("acrylic sign") ||
    haystack.includes("slate") ||
    haystack.includes("wood sign") ||
    haystack.includes("leather") ||
    haystack.includes("🔥")
  ) {
    return "laser";
  }

  if (
    haystack.includes("business card") ||
    haystack.includes("flyer") ||
    haystack.includes("banner") ||
    haystack.includes("yard sign") ||
    haystack.includes("sticker") ||
    haystack.includes("magnet") ||
    haystack.includes("marketing") ||
    haystack.includes("promotional")
  ) {
    return "marketing";
  }

  if (
    haystack.includes("shirt") ||
    haystack.includes("t-shirt") ||
    haystack.includes("hoodie") ||
    haystack.includes("sweatshirt") ||
    haystack.includes("long sleeve") ||
    haystack.includes("youth") ||
    haystack.includes("ladies") ||
    haystack.includes("safety") ||
    haystack.includes("apparel") ||
    haystack.includes("👕")
  ) {
    return "apparel";
  }

  // Fall back to configured keyword groups.
  for (const [family, config] of Object.entries(PRODUCT_FAMILIES)) {
    if (config.keywords.some((keyword) => haystack.includes(keyword))) {
      return family;
    }
  }

  return "apparel";
}

export function relatedProducts(products, currentProduct, limit = 3) {
  const family = detectProductFamily(currentProduct);
  return products
    .filter((product) => product.id !== currentProduct.id)
    .filter((product) => detectProductFamily(product) === family)
    .slice(0, limit);
}


export function explicitBuilderFamily(product) {
  const explicit = String(product?.builderFamily || "").trim().toLowerCase();
  if (["apparel","drinkware","laser","marketing"].includes(explicit)) {
    return explicit;
  }

  const id = String(product?.id || "").toLowerCase();
  const name = String(product?.name || "").toLowerCase();
  const category = String(product?.category || "").toLowerCase();

  // Explicit known product patterns.
  if (
    id.includes("tumbler") ||
    name.includes("tumbler") ||
    name.includes("20 oz") ||
    name.includes("30 oz") ||
    category.includes("tumbler") ||
    category.includes("drinkware")
  ) return "drinkware";

  if (
    id.includes("laser") ||
    id.includes("engraving") ||
    name.includes("engraving") ||
    name.includes("engraved") ||
    name.includes("cutting board") ||
    name.includes("keychain") ||
    name.includes("acrylic") ||
    category.includes("laser") ||
    category.includes("engraving")
  ) return "laser";

  return detectProductFamily(product);
}
