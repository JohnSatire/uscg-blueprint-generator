import type {
  DrawingDocument,
  Entity,
  SymbolEntity,
  TitleBlock,
} from "../types";
import { getSymbol } from "../lib/symbols";

/** Minimal ASCII DXF (R12-compatible entities) for open CAD exchange. */
export function exportDxf(doc: DrawingDocument): string {
  const lines: string[] = [];
  const push = (code: number | string, value: string | number) => {
    lines.push(String(code), String(value));
  };

  push(0, "SECTION");
  push(2, "HEADER");
  push(9, "$ACADVER");
  push(1, "AC1009");
  push(9, "$INSUNITS");
  push(70, 1); // inches
  push(0, "ENDSEC");

  push(0, "SECTION");
  push(2, "TABLES");
  push(0, "TABLE");
  push(2, "LAYER");
  push(70, 6);
  for (const [name, color] of [
    ["0", 7],
    ["TITLE", 7],
    ["STRUCTURE", 5],
    ["ELECTRICAL", 2],
    ["PLUMBING", 3],
    ["ANNOTATION", 7],
  ] as const) {
    push(0, "LAYER");
    push(2, name);
    push(70, 0);
    push(62, color);
    push(6, "CONTINUOUS");
  }
  push(0, "ENDTAB");
  push(0, "ENDSEC");

  push(0, "SECTION");
  push(2, "ENTITIES");

  for (const entity of doc.entities) {
    writeEntity(push, entity);
  }

  writeTitleBlock(push, doc);

  push(0, "ENDSEC");
  push(0, "EOF");
  return lines.join("\n");
}

type Push = (code: number | string, value: string | number) => void;

function writeEntity(push: Push, entity: Entity) {
  const layer = entity.layer || "0";
  switch (entity.kind) {
    case "line":
      push(0, "LINE");
      push(8, layer);
      push(10, entity.x1);
      push(20, flipY(entity.y1));
      push(30, 0);
      push(11, entity.x2);
      push(21, flipY(entity.y2));
      push(31, 0);
      break;
    case "rect": {
      const { x, y, width, height } = entity;
      const pts = [
        [x, y],
        [x + width, y],
        [x + width, y + height],
        [x, y + height],
        [x, y],
      ];
      for (let i = 0; i < pts.length - 1; i++) {
        push(0, "LINE");
        push(8, layer);
        push(10, pts[i][0]);
        push(20, flipY(pts[i][1]));
        push(30, 0);
        push(11, pts[i + 1][0]);
        push(21, flipY(pts[i + 1][1]));
        push(31, 0);
      }
      break;
    }
    case "circle":
      push(0, "CIRCLE");
      push(8, layer);
      push(10, entity.cx);
      push(20, flipY(entity.cy));
      push(30, 0);
      push(40, entity.r);
      break;
    case "polyline": {
      const pts = entity.points;
      if (pts.length < 2) return;
      const count = entity.closed ? pts.length : pts.length - 1;
      for (let i = 0; i < count; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        push(0, "LINE");
        push(8, layer);
        push(10, a.x);
        push(20, flipY(a.y));
        push(30, 0);
        push(11, b.x);
        push(21, flipY(b.y));
        push(31, 0);
      }
      break;
    }
    case "text":
      push(0, "TEXT");
      push(8, layer);
      push(10, entity.x);
      push(20, flipY(entity.y));
      push(30, 0);
      push(40, entity.fontSize * 0.75);
      push(1, entity.text);
      push(50, entity.rotation ?? 0);
      break;
    case "symbol":
      writeSymbol(push, entity);
      break;
  }
}

function writeSymbol(push: Push, entity: SymbolEntity) {
  const def = getSymbol(entity.symbolId);
  if (!def) return;
  const layer = entity.layer || "0";
  const s = entity.scale;
  const rad = ((entity.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const tx = (x: number, y: number) => {
    const lx = (x - 20) * s;
    const ly = (y - 20) * s;
    return {
      x: entity.x + lx * cos - ly * sin,
      y: entity.y + lx * sin + ly * cos,
    };
  };

  for (const p of def.paths) {
    if (p.kind === "line" && p.x1 != null && p.y1 != null && p.x2 != null && p.y2 != null) {
      const a = tx(p.x1, p.y1);
      const b = tx(p.x2, p.y2);
      push(0, "LINE");
      push(8, layer);
      push(10, a.x);
      push(20, flipY(a.y));
      push(30, 0);
      push(11, b.x);
      push(21, flipY(b.y));
      push(31, 0);
    } else if (p.kind === "circle" && p.cx != null && p.cy != null && p.r != null) {
      const c = tx(p.cx, p.cy);
      push(0, "CIRCLE");
      push(8, layer);
      push(10, c.x);
      push(20, flipY(c.y));
      push(30, 0);
      push(40, p.r * s);
    } else if (p.kind === "polyline" && p.points) {
      const pts = p.points.map((pt) => tx(pt.x, pt.y));
      const n = p.closed ? pts.length : pts.length - 1;
      for (let i = 0; i < n; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        push(0, "LINE");
        push(8, layer);
        push(10, a.x);
        push(20, flipY(a.y));
        push(30, 0);
        push(11, b.x);
        push(21, flipY(b.y));
        push(31, 0);
      }
    } else if (p.kind === "path" && p.d) {
      // Approximate arc door with polyline samples if present; otherwise skip complex paths.
      const approx = approximatePath(p.d, entity, s, rad);
      for (let i = 0; i < approx.length - 1; i++) {
        push(0, "LINE");
        push(8, layer);
        push(10, approx[i].x);
        push(20, flipY(approx[i].y));
        push(30, 0);
        push(11, approx[i + 1].x);
        push(21, flipY(approx[i + 1].y));
        push(31, 0);
      }
    }
  }

  if (entity.label) {
    push(0, "TEXT");
    push(8, "ANNOTATION");
    push(10, entity.x);
    push(20, flipY(entity.y + 28 * s));
    push(30, 0);
    push(40, 8 * s);
    push(1, entity.label);
  }
}

function approximatePath(
  d: string,
  entity: SymbolEntity,
  s: number,
  rad: number,
): Array<{ x: number; y: number }> {
  // Handle simple quarter-arc form used by door: M0 0 A36 36 0 0 1 36 36
  const arc = /M\s*([\d.-]+)\s+([\d.-]+)\s+A\s*([\d.-]+)\s+([\d.-]+)\s+[\d.-]+\s+[\d.-]+\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)/i.exec(
    d,
  );
  if (!arc) return [];
  const x0 = parseFloat(arc[1]);
  const y0 = parseFloat(arc[2]);
  const r = parseFloat(arc[3]);
  const sweep = parseFloat(arc[5]);
  const x1 = parseFloat(arc[6]);
  const y1 = parseFloat(arc[7]);
  // Assume arc centered at (x0, y1) for door swing from (x0,y0) to (x1,y1)
  const cx = x0;
  const cy = y1;
  const a0 = Math.atan2(y0 - cy, x0 - cx);
  const a1 = Math.atan2(y1 - cy, x1 - cx);
  const steps = 12;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = sweep ? a0 + (a1 - a0) * t : a0 + (a1 - a0) * t;
    const lx = (cx + r * Math.cos(a) - 20) * s;
    const ly = (cy + r * Math.sin(a) - 20) * s;
    out.push({
      x: entity.x + lx * cos - ly * sin,
      y: entity.y + lx * sin + ly * cos,
    });
  }
  return out;
}

function flipY(y: number): number {
  // Keep SVG Y-down in model space so round-trip matches screen; CAD users can flip if needed.
  return -y;
}

function writeTitleBlock(push: Push, doc: DrawingDocument) {
  const tb = doc.titleBlock;
  const x = doc.canvasWidth - 320;
  const y = doc.canvasHeight - 140;
  const w = 300;
  const h = 120;
  const box: Array<[number, number, number, number]> = [
    [x, y, x + w, y],
    [x + w, y, x + w, y + h],
    [x + w, y + h, x, y + h],
    [x, y + h, x, y],
    [x, y + 28, x + w, y + 28],
    [x, y + 56, x + w, y + 56],
    [x, y + 84, x + w, y + 84],
    [x + 150, y + 28, x + 150, y + h],
  ];
  for (const [x1, y1, x2, y2] of box) {
    push(0, "LINE");
    push(8, "TITLE");
    push(10, x1);
    push(20, flipY(y1));
    push(30, 0);
    push(11, x2);
    push(21, flipY(y2));
    push(31, 0);
  }

  const texts: Array<[number, number, number, string]> = [
    [x + 6, y + 18, 11, tb.drawingTitle || "Untitled"],
    [x + 6, y + 46, 8, `Dwg: ${tb.drawingNumber}  Rev: ${tb.revision}`],
    [x + 156, y + 46, 8, `Sheet ${tb.sheet} of ${tb.ofSheets}`],
    [x + 6, y + 74, 8, `Vessel: ${tb.vesselName || "—"} (${tb.vesselId || "—"})`],
    [x + 156, y + 74, 8, `Scale: ${tb.scale}`],
    [x + 6, y + 102, 8, `Alteration: ${tb.alteration || "—"}`],
    [x + 156, y + 102, 8, `Date: ${tb.date}`],
    [x + 6, y + 118, 7, tb.office],
  ];
  for (const [tx, ty, hgt, str] of texts) {
    push(0, "TEXT");
    push(8, "TITLE");
    push(10, tx);
    push(20, flipY(ty));
    push(30, 0);
    push(40, hgt);
    push(1, sanitize(str));
  }

  void (tb as TitleBlock);
}

function sanitize(s: string): string {
  return s.replace(/[\n\r]/g, " ").slice(0, 120);
}
