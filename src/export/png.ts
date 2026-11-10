import type { DrawingDocument } from "../types";

export async function exportPng(
  svgEl: SVGSVGElement,
  doc: DrawingDocument,
): Promise<Blob> {
  const serializer = new XMLSerializer();
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(doc.canvasWidth));
  clone.setAttribute("height", String(doc.canvasHeight));
  clone.setAttribute("viewBox", `0 0 ${doc.canvasWidth} ${doc.canvasHeight}`);

  const source = serializer.serializeToString(clone);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = doc.canvasWidth;
    canvas.height = doc.canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.fillStyle = "#F4F7FA";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))),
        "image/png",
      );
    });
    return png;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to rasterize SVG"));
    img.src = url;
  });
}
