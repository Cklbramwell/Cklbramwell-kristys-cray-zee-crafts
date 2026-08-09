export const BUILDER_PRICING = {
  apparel: {
    shortSleeveBaseBySize: {
      "S": 2000,
      "M": 2000,
      "L": 2000,
      "XL": 2000,
      "2XL": 2500,
      "3XL": 2500,
      "4XL": 2700,
      "5XL": 3000,
    },
    styleBase: {
      "Unisex (Adult)": null,
      "Women's Fitted": null,
      "Youth": null,
      "Long Sleeve": 2500,
      "Hoodie": 3500,
      "Other": null,
    },
    placementBase: {
      "Front Only": null,
      "Back Only": null,
      "Front & Back": 4500,
      "Left Chest": null,
      "Sleeve": null,
    },
    sleevePrintAddOn: 1000,
    personalizationAddOn: 500,
    rushAddOn: 2000,
    proofAddOn: 0,
  },

  tumbler: {
    sizeBase: {
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
};

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

export const SHIRT_STYLES = [
  "Unisex (Adult)",
  "Women's Fitted",
  "Youth",
  "Long Sleeve",
  "Hoodie",
  "Other",
];

export const PRINT_LOCATIONS = [
  "Front Only",
  "Back Only",
  "Front & Back",
  "Left Chest",
  "Sleeve",
];

export const PRINT_METHODS = ["DTF", "Screen Print", "Vinyl"];

export const TUMBLER_SIZES = ["20 oz", "30 oz"];

export const LASER_ITEM_TYPES = [
  "Cutting Board",
  "Keychain",
  "Acrylic Sign",
  "Other",
];

export const LASER_MATERIALS = [
  "Wood",
  "Acrylic",
  "Slate",
  "Leather",
  "Stainless Steel",
  "Other",
];
