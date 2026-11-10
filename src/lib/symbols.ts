import type { DrawingType, SymbolDef } from "../types";

export const SYMBOLS: SymbolDef[] = [
  {
    id: "door",
    name: "Door",
    category: "general-arrangement",
    paths: [
      { kind: "line", x1: 0, y1: 0, x2: 0, y2: 36 },
      { kind: "path", d: "M0 0 A36 36 0 0 1 36 36" },
    ],
  },
  {
    id: "stair",
    name: "Stair",
    category: "general-arrangement",
    paths: [
      { kind: "polyline", points: [{ x: 0, y: 0 }, { x: 28, y: 0 }, { x: 28, y: 40 }, { x: 0, y: 40 }], closed: true },
      { kind: "line", x1: 0, y1: 10, x2: 28, y2: 10 },
      { kind: "line", x1: 0, y1: 20, x2: 28, y2: 20 },
      { kind: "line", x1: 0, y1: 30, x2: 28, y2: 30 },
    ],
  },
  {
    id: "bulkhead-opening",
    name: "Opening",
    category: "general-arrangement",
    paths: [
      { kind: "line", x1: 0, y1: 8, x2: 0, y2: 32 },
      { kind: "line", x1: 40, y1: 8, x2: 40, y2: 32 },
      { kind: "line", x1: 0, y1: 20, x2: 40, y2: 20 },
    ],
  },
  {
    id: "frame",
    name: "Frame Mark",
    category: "structural",
    paths: [
      { kind: "line", x1: 20, y1: 0, x2: 20, y2: 40 },
      { kind: "line", x1: 12, y1: 8, x2: 28, y2: 8 },
    ],
  },
  {
    id: "beam",
    name: "Beam Section",
    category: "structural",
    paths: [
      { kind: "polyline", points: [{ x: 4, y: 8 }, { x: 36, y: 8 }, { x: 36, y: 14 }, { x: 24, y: 14 }, { x: 24, y: 26 }, { x: 36, y: 26 }, { x: 36, y: 32 }, { x: 4, y: 32 }, { x: 4, y: 26 }, { x: 16, y: 26 }, { x: 16, y: 14 }, { x: 4, y: 14 }], closed: true },
    ],
  },
  {
    id: "stiffener",
    name: "Stiffener",
    category: "structural",
    paths: [
      { kind: "line", x1: 8, y1: 4, x2: 8, y2: 36 },
      { kind: "line", x1: 8, y1: 4, x2: 28, y2: 4 },
    ],
  },
  {
    id: "panel",
    name: "Panelboard",
    category: "electrical",
    paths: [
      { kind: "polyline", points: [{ x: 4, y: 4 }, { x: 36, y: 4 }, { x: 36, y: 36 }, { x: 4, y: 36 }], closed: true },
      { kind: "line", x1: 10, y1: 12, x2: 30, y2: 12 },
      { kind: "line", x1: 10, y1: 20, x2: 30, y2: 20 },
      { kind: "line", x1: 10, y1: 28, x2: 30, y2: 28 },
    ],
  },
  {
    id: "outlet",
    name: "Receptacle",
    category: "electrical",
    paths: [
      { kind: "circle", cx: 20, cy: 20, r: 12 },
      { kind: "line", x1: 14, y1: 16, x2: 14, y2: 24 },
      { kind: "line", x1: 26, y1: 16, x2: 26, y2: 24 },
    ],
  },
  {
    id: "light",
    name: "Luminaire",
    category: "electrical",
    paths: [
      { kind: "circle", cx: 20, cy: 20, r: 10 },
      { kind: "line", x1: 13, y1: 13, x2: 27, y2: 27 },
      { kind: "line", x1: 27, y1: 13, x2: 13, y2: 27 },
    ],
  },
  {
    id: "switch",
    name: "Switch",
    category: "electrical",
    paths: [
      { kind: "circle", cx: 12, cy: 20, r: 4 },
      { kind: "line", x1: 16, y1: 18, x2: 30, y2: 10 },
      { kind: "circle", cx: 32, cy: 10, r: 3 },
    ],
  },
  {
    id: "valve",
    name: "Valve",
    category: "plumbing",
    paths: [
      { kind: "polyline", points: [{ x: 4, y: 10 }, { x: 20, y: 20 }, { x: 4, y: 30 }], closed: true },
      { kind: "polyline", points: [{ x: 36, y: 10 }, { x: 20, y: 20 }, { x: 36, y: 30 }], closed: true },
      { kind: "line", x1: 20, y1: 20, x2: 20, y2: 6 },
      { kind: "line", x1: 14, y1: 6, x2: 26, y2: 6 },
    ],
  },
  {
    id: "pump",
    name: "Pump",
    category: "plumbing",
    paths: [
      { kind: "circle", cx: 20, cy: 20, r: 14 },
      { kind: "polyline", points: [{ x: 20, y: 8 }, { x: 30, y: 26 }, { x: 10, y: 26 }], closed: true },
    ],
  },
  {
    id: "fixture",
    name: "Fixture",
    category: "plumbing",
    paths: [
      { kind: "polyline", points: [{ x: 6, y: 10 }, { x: 34, y: 10 }, { x: 34, y: 30 }, { x: 6, y: 30 }], closed: true },
      { kind: "circle", cx: 20, cy: 20, r: 5 },
    ],
  },
  {
    id: "north-arrow",
    name: "North Arrow",
    category: "common",
    paths: [
      { kind: "polyline", points: [{ x: 20, y: 2 }, { x: 28, y: 30 }, { x: 20, y: 24 }, { x: 12, y: 30 }], closed: true },
    ],
  },
];

export function symbolsForType(type: DrawingType): SymbolDef[] {
  return SYMBOLS.filter((s) => s.category === type || s.category === "common");
}

export function getSymbol(id: string): SymbolDef | undefined {
  return SYMBOLS.find((s) => s.id === id);
}
