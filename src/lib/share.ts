import type { DrawingDocument } from "../types";

export function serializeDocument(doc: DrawingDocument): string {
  return JSON.stringify(doc);
}

export function parseDocument(raw: string): DrawingDocument {
  const data = JSON.parse(raw) as DrawingDocument;
  if (!data || data.version !== 1 || !Array.isArray(data.entities)) {
    throw new Error("Unrecognized drawing file");
  }
  return data;
}

/** Encode drawing into URL hash for shareable links (same origin). */
export function encodeShareHash(doc: DrawingDocument): string {
  const json = serializeDocument(doc);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShareHash(hash: string): DrawingDocument | null {
  try {
    const b64 = hash.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const bin = atob(b64 + pad);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return parseDocument(json);
  } catch {
    return null;
  }
}

export function buildShareUrl(doc: DrawingDocument): string {
  const hash = encodeShareHash(doc);
  const url = new URL(window.location.href);
  url.hash = `d=${hash}`;
  return url.toString();
}
