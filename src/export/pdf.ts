import { jsPDF } from "jspdf";
import type { DrawingDocument } from "../types";
import { exportPng } from "./png";

export async function exportPdf(
  svgEl: SVGSVGElement,
  doc: DrawingDocument,
): Promise<Blob> {
  const png = await exportPng(svgEl, doc);
  const dataUrl = await blobToDataUrl(png);
  const pdf = new jsPDF({
    orientation: doc.canvasWidth >= doc.canvasHeight ? "landscape" : "portrait",
    unit: "pt",
    format: "letter",
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2 - 36;
  const scale = Math.min(maxW / doc.canvasWidth, maxH / doc.canvasHeight);
  const w = doc.canvasWidth * scale;
  const h = doc.canvasHeight * scale;
  const x = (pageW - w) / 2;
  const y = margin + 20;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("USCG Ship Alteration — Reference Drawing", margin, 18);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(
    `${doc.titleBlock.drawingNumber}  |  ${doc.titleBlock.drawingTitle}  |  Rev ${doc.titleBlock.revision}`,
    margin,
    30,
  );
  pdf.addImage(dataUrl, "PNG", x, y, w, h);
  return pdf.output("blob");
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
