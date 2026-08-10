export const EXPORT_SPECS = {
  front: {
    label: "Apparel Front",
    width: 4500,
    height: 5400,
    dpi: 300,
    background: "transparent",
  },
  back: {
    label: "Apparel Back",
    width: 4500,
    height: 5400,
    dpi: 300,
    background: "transparent",
  },
  leftSleeve: {
    label: "Left Sleeve",
    width: 1800,
    height: 4500,
    dpi: 300,
    background: "transparent",
  },
  rightSleeve: {
    label: "Right Sleeve",
    width: 1800,
    height: 4500,
    dpi: 300,
    background: "transparent",
  },
  wrap: {
    label: "Tumbler Full Wrap",
    width: 6000,
    height: 2000,
    dpi: 300,
    background: "transparent",
  },
  engraving: {
    label: "Laser Engraving",
    width: 4800,
    height: 3000,
    dpi: 300,
    background: "transparent",
  },
};

export function getExportSpec(surface) {
  return EXPORT_SPECS[surface] || EXPORT_SPECS.front;
}
