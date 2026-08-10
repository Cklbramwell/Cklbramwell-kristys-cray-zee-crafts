export const EDITOR_PRODUCT_MODES = {
  apparel: {
    label: "Apparel",
    surfaces: ["front", "back", "leftSleeve", "rightSleeve"],
    defaultSurface: "front",
  },
  drinkware: {
    label: "Drinkware",
    surfaces: ["wrap"],
    defaultSurface: "wrap",
  },
  laser: {
    label: "Laser Engraving",
    surfaces: ["engraving"],
    defaultSurface: "engraving",
  },
};

export const EDITOR_FONTS = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
  "Impact",
  "Courier New",
];

export const EDITOR_DEFAULTS = {
  textColor: "#111111",
  fontFamily: "Arial",
  fontSize: 48,
  rotation: 0,
  scale: 1,
};
