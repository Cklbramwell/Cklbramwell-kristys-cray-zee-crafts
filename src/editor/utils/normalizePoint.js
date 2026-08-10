export function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

export function normalizePoint(x, y, rect) {
  if (!rect?.width || !rect?.height) return { x: 0.5, y: 0.5 };

  return {
    x: clamp01((x - rect.left) / rect.width),
    y: clamp01((y - rect.top) / rect.height),
  };
}
