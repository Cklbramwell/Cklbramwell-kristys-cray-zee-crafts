export const BUILDER_PRICING = {
  apparel: {
    tshirt: {
      baseBySize: {
        "S": 2000,
        "M": 2000,
        "L": 2000,
        "XL": 2000,
        "2XL": 2500,
        "3XL": 2500,
        "4XL": 2700,
        "5XL": 3000,
      },
      backPrintAddOn: 1000,
    },

    hoodie: {
      baseBySize: {
        "S": 3500,
        "M": 3500,
        "L": 3500,
        "XL": 3500,
        "2XL": 5000,
        "3XL": 5000,
        "4XL": 5000,
        "5XL": 5000,
      },
      backPrintAddOn: 1000,
    },

    longSleeve: {
      baseBySize: {
        "S": 2500,
        "M": 2500,
        "L": 2500,
        "XL": 2500,
        "2XL": 3000,
        "3XL": 3000,
        "4XL": 3200,
        "5XL": 3500,
      },
      backPrintAddOn: 1000,
    },

    sleevePrintAddOn: 1000,
    personalizationAddOn: 500,
    rushAddOn: 2000,
    proofAddOn: 0,
  },

  drinkware: {
    tumblerBase: {
      "20 oz": 3000,
      "30 oz": 4000,
    },
    personalizationAddOn: 500,
    fullWrapAddOn: 200,
    rushAddOn: 2000,
  },

  laser: {
    itemBase: {
      "Cutting Board": 4000,
      "Keychain": 1000,
      "Acrylic Sign": 2000,
    },
    extraEngravingSideAddOn: 500,
    rushAddOn: 2000,
    designFeeAddOn: 2500,
  },

  marketing: {
    rushAddOn: 2000,
  },
};

export const SHIRT_SIZES = ["S","M","L","XL","2XL","3XL","4XL","5XL"];
export const PRINT_LOCATIONS = ["Front Only","Front & Back"];
export const PRINT_METHODS = ["DTF","Screen Print","Vinyl"];
export const TUMBLER_SIZES = ["20 oz","30 oz"];
export const LASER_ITEM_TYPES = ["Cutting Board","Keychain","Acrylic Sign","Other"];
export const LASER_MATERIALS = ["Wood","Acrylic","Slate","Leather","Stainless Steel","Other"];

export const DESIGN_TYPES = [
  "Business Logo",
  "Family Reunion",
  "Birthday",
  "Memorial",
  "Graduation",
  "Sports",
  "School",
  "Church",
  "Wedding",
  "Baby Shower",
  "Custom",
];

export function apparelKind(product) {
  const text = [product?.name, product?.category].join(" ").toLowerCase();
  if (text.includes("hoodie")) return "hoodie";
  if (text.includes("long sleeve")) return "longSleeve";
  return "tshirt";
}
