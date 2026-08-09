export const BUILDER_PRICING = {
  apparel: {
    baseReference: 2000,
    sizeUpcharge: {
      "S": 0,
      "M": 0,
      "L": 0,
      "XL": 0,
      "2XL": 2500,
      "3XL": 2500,
      "4XL": 2700,
      "5XL": 3000,
    },
    styleUpcharge: {
      "Unisex (Adult)": 0,
      "Women's Fitted": 0,
      "Youth": 0,
      "Long Sleeve": 2500,
      "Hoodie": 3500,
      "Other": 0,
    },
    placement: {
      "Front Only": 0,
      "Back Only": 0,
      "Front & Back": 4500,
      "Left Chest": 0,
      "Sleeve": 1000,
    },
    printMethod: {
      "DTF": 0,
      "Screen Print": 0,
      "Vinyl": 0,
    },
    personalization: 500,
    rush: 2000,
    proof: 0,
  },

  tumbler: {
    sizePrice: {
      "20 oz": 3000,
      "30 oz": 4000,
    },
    personalization: 500,
    fullWrap: 200,
    rush: 2000,
  },

  laser: {
    itemPrice: {
      "Cutting Board": 4000,
      "Keychain": 1000,
      "Acrylic Sign": 2000,
    },
    extraEngravingSide: 500,
    rush: 2000,
    designFee: 2500,
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
