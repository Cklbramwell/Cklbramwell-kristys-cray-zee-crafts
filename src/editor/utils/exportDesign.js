import { getExportSpec } from "../core/exportConfig";

export async function exportSurfacePng({
  design,
  surface,
  orderNumber = "order",
}) {
  const spec = getExportSpec(surface);
  const elements = design?.surfaces?.[surface] || [];

  if (!elements.length) {
    throw new Error("This design surface is empty.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = spec.width;
  canvas.height = spec.height;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  for (const element of elements) {
    await drawElement(ctx, element, spec);
  }

  const blob = await canvasToBlob(canvas);
  const filename = safeFilename(
    `${orderNumber}-${surface}-${spec.width}x${spec.height}.png`
  );

  downloadBlob(blob, filename);

  return {
    filename,
    width: spec.width,
    height: spec.height,
    dpi: spec.dpi,
    surface,
    elementCount: elements.length,
  };
}

export function exportDesignManifest({
  design,
  orderNumber = "order",
}) {
  const data = JSON.stringify(
    {
      orderNumber,
      exportedAt: new Date().toISOString(),
      design,
    },
    null,
    2
  );

  const blob = new Blob([data], { type: "application/json" });
  const filename = safeFilename(`${orderNumber}-design-manifest.json`);
  downloadBlob(blob, filename);

  return filename;
}

async function drawElement(ctx, element, spec) {
  const x = (Number(element.x) || 0.5) * spec.width;
  const y = (Number(element.y) || 0.5) * spec.height;
  const width = Math.max(1, (Number(element.width) || 0.3) * spec.width);
  const height = Math.max(1, (Number(element.height) || 0.2) * spec.height);
  const rotation = ((Number(element.rotation) || 0) * Math.PI) / 180;
  const scale = Number(element.scale) || 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);

  if (element.type === "text") {
    const fontSize =
      (Number(element.fontSize) || 48) *
      Math.max(spec.width / 900, 1);

    const fontFamily = element.fontFamily || "Arial";
    ctx.fillStyle = element.color || "#111111";
    ctx.font = `${fontSize}px ${quoteFont(fontFamily)}`;

    const lines = String(element.text || "Text").split(/\r?\n/);
    const lineHeight = fontSize * 1.15;
    const totalHeight = lineHeight * lines.length;

    lines.forEach((line, index) => {
      ctx.fillText(
        line,
        0,
        -totalHeight / 2 + lineHeight / 2 + index * lineHeight,
        width
      );
    });
  }

  if (element.type === "image" && element.src) {
    const image = await loadImage(element.src);
    const fit = contain(image.width, image.height, width, height);

    ctx.drawImage(
      image,
      -fit.width / 2,
      -fit.height / 2,
      fit.width,
      fit.height
    );
  }

  ctx.restore();
}

async function loadImage(url) {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) {
    throw new Error("Unable to load one of the artwork files for export.");
  }

  const blob = await response.blob();

  if ("createImageBitmap" in window) {
    return await createImageBitmap(blob);
  }

  return await new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to decode artwork image."));
    };
    image.src = objectUrl;
  });
}

function contain(sourceWidth, sourceHeight, maxWidth, maxHeight) {
  const ratio = Math.min(
    maxWidth / sourceWidth,
    maxHeight / sourceHeight
  );

  return {
    width: sourceWidth * ratio,
    height: sourceHeight * ratio,
  };
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Unable to generate PNG export."));
      },
      "image/png",
      1
    );
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-");
}

function quoteFont(font) {
  return /\s/.test(font) ? `"${font}"` : font;
}
