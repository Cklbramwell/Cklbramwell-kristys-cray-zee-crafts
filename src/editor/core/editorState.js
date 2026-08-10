import { EDITOR_DEFAULTS } from "./editorConfig";

export function createEmptyDesign({ productId = "", family = "apparel" } = {}) {
  return {
    version: 1,
    productId,
    family,
    activeSurface: family === "drinkware" ? "wrap" : family === "laser" ? "engraving" : "front",
    surfaces: {
      front: [],
      back: [],
      leftSleeve: [],
      rightSleeve: [],
      wrap: [],
      engraving: [],
    },
    updatedAt: new Date().toISOString(),
  };
}

export function addTextElement(design, surface, text = "Your Text") {
  const element = {
    id: crypto.randomUUID(),
    type: "text",
    text,
    x: 0.5,
    y: 0.5,
    width: 0.35,
    height: 0.15,
    fontFamily: EDITOR_DEFAULTS.fontFamily,
    fontSize: EDITOR_DEFAULTS.fontSize,
    color: EDITOR_DEFAULTS.textColor,
    rotation: EDITOR_DEFAULTS.rotation,
    scale: EDITOR_DEFAULTS.scale,
  };

  return addElement(design, surface, element);
}

export function addImageElement(design, surface, image) {
  const element = {
    id: crypto.randomUUID(),
    type: "image",
    src: image.url,
    name: image.name || "Artwork",
    x: 0.5,
    y: 0.5,
    width: 0.4,
    height: 0.4,
    rotation: 0,
    scale: 1,
  };

  return addElement(design, surface, element);
}

export function updateElement(design, surface, elementId, patch) {
  return {
    ...design,
    updatedAt: new Date().toISOString(),
    surfaces: {
      ...design.surfaces,
      [surface]: (design.surfaces[surface] || []).map((element) =>
        element.id === elementId ? { ...element, ...patch } : element
      ),
    },
  };
}

export function removeElement(design, surface, elementId) {
  return {
    ...design,
    updatedAt: new Date().toISOString(),
    surfaces: {
      ...design.surfaces,
      [surface]: (design.surfaces[surface] || []).filter(
        (element) => element.id !== elementId
      ),
    },
  };
}

function addElement(design, surface, element) {
  return {
    ...design,
    updatedAt: new Date().toISOString(),
    surfaces: {
      ...design.surfaces,
      [surface]: [...(design.surfaces[surface] || []), element],
    },
  };
}
