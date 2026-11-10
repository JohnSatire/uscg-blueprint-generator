import type { DrawingDocument, DrawingType, Entity } from "../types";
import { DEFAULT_TITLE_BLOCK } from "../types";
import { uid } from "../lib/ids";

const W = 1100;
const H = 750;

function base(type: DrawingType, title: string): DrawingDocument {
  const now = new Date().toISOString();
  return {
    version: 1,
    drawingType: type,
    titleBlock: {
      ...DEFAULT_TITLE_BLOCK,
      drawingTitle: title,
      drawingNumber: drawingNumberFor(type),
    },
    entities: [],
    canvasWidth: W,
    canvasHeight: H,
    createdAt: now,
    updatedAt: now,
  };
}

function drawingNumberFor(type: DrawingType): string {
  switch (type) {
    case "general-arrangement":
      return "SA-GA-001";
    case "structural":
      return "SA-ST-001";
    case "electrical":
      return "SA-EL-001";
    case "plumbing":
      return "SA-PL-001";
  }
}

function hullOutline(): Entity[] {
  // Simplified vessel plan outline (bow to the right).
  const hull: Entity = {
    id: uid(),
    kind: "polyline",
    layer: "STRUCTURE",
    stroke: "#0B1F3A",
    strokeWidth: 2,
    closed: true,
    points: [
      { x: 80, y: 220 },
      { x: 120, y: 160 },
      { x: 700, y: 140 },
      { x: 860, y: 200 },
      { x: 920, y: 280 },
      { x: 920, y: 380 },
      { x: 860, y: 460 },
      { x: 700, y: 520 },
      { x: 120, y: 500 },
      { x: 80, y: 440 },
    ],
  };
  const cl: Entity = {
    id: uid(),
    kind: "line",
    layer: "STRUCTURE",
    stroke: "#5A6B7D",
    strokeWidth: 1,
    x1: 100,
    y1: 330,
    x2: 900,
    y2: 330,
  };
  return [hull, cl];
}

function compartmentLines(): Entity[] {
  return [
    {
      id: uid(),
      kind: "line",
      layer: "STRUCTURE",
      stroke: "#0B1F3A",
      strokeWidth: 1.5,
      x1: 260,
      y1: 155,
      x2: 260,
      y2: 505,
    },
    {
      id: uid(),
      kind: "line",
      layer: "STRUCTURE",
      stroke: "#0B1F3A",
      strokeWidth: 1.5,
      x1: 460,
      y1: 145,
      x2: 460,
      y2: 515,
    },
    {
      id: uid(),
      kind: "line",
      layer: "STRUCTURE",
      stroke: "#0B1F3A",
      strokeWidth: 1.5,
      x1: 680,
      y1: 142,
      x2: 680,
      y2: 518,
    },
  ];
}

function labels(items: Array<[number, number, string]>): Entity[] {
  return items.map(([x, y, text]) => ({
    id: uid(),
    kind: "text" as const,
    layer: "ANNOTATION",
    stroke: "#0B1F3A",
    strokeWidth: 1,
    x,
    y,
    text,
    fontSize: 14,
  }));
}

export function createTemplate(type: DrawingType): DrawingDocument {
  switch (type) {
    case "general-arrangement":
      return generalArrangement();
    case "structural":
      return structural();
    case "electrical":
      return electrical();
    case "plumbing":
      return plumbing();
  }
}

function generalArrangement(): DrawingDocument {
  const doc = base("general-arrangement", "General Arrangement — Main Deck");
  doc.entities = [
    ...hullOutline(),
    ...compartmentLines(),
    ...labels([
      [140, 320, "AFT"],
      [340, 250, "CREW"],
      [540, 250, "GALLEY"],
      [760, 300, "PILOTHOUSE"],
      [340, 420, "ENGINE"],
      [540, 420, "STORES"],
    ]),
    {
      id: uid(),
      kind: "symbol",
      layer: "ANNOTATION",
      stroke: "#0B1F3A",
      strokeWidth: 1.5,
      symbolId: "door",
      x: 260,
      y: 280,
      scale: 0.9,
      rotation: 0,
      label: "WTD",
    },
    {
      id: uid(),
      kind: "symbol",
      layer: "ANNOTATION",
      stroke: "#0B1F3A",
      strokeWidth: 1.5,
      symbolId: "stair",
      x: 500,
      y: 340,
      scale: 0.85,
      rotation: 0,
    },
    {
      id: uid(),
      kind: "symbol",
      layer: "ANNOTATION",
      stroke: "#0B1F3A",
      strokeWidth: 1.5,
      symbolId: "north-arrow",
      x: 80,
      y: 80,
      scale: 1,
      rotation: 0,
      label: "FWD →",
    },
  ];
  return doc;
}

function structural(): DrawingDocument {
  const doc = base("structural", "Structural — Deck Framing Plan");
  doc.entities = [
    ...hullOutline(),
    // longitudinals
    ...[200, 260, 320, 400, 460].map(
      (y): Entity => ({
        id: uid(),
        kind: "line",
        layer: "STRUCTURE",
        stroke: "#1F4E79",
        strokeWidth: 1.25,
        x1: 130,
        y1: y,
        x2: 880,
        y2: y,
      }),
    ),
    // frames
    ...[180, 280, 380, 480, 580, 680, 780].map(
      (x): Entity => ({
        id: uid(),
        kind: "line",
        layer: "STRUCTURE",
        stroke: "#1F4E79",
        strokeWidth: 1,
        x1: x,
        y1: 155,
        x2: x,
        y2: 505,
      }),
    ),
    {
      id: uid(),
      kind: "symbol",
      layer: "STRUCTURE",
      stroke: "#0B1F3A",
      strokeWidth: 1.5,
      symbolId: "beam",
      x: 400,
      y: 200,
      scale: 1,
      rotation: 0,
      label: "W8x18",
    },
    {
      id: uid(),
      kind: "symbol",
      layer: "STRUCTURE",
      stroke: "#0B1F3A",
      strokeWidth: 1.5,
      symbolId: "stiffener",
      x: 520,
      y: 360,
      scale: 1,
      rotation: 0,
    },
    ...labels([
      [190, 145, "FR 10"],
      [290, 145, "FR 20"],
      [390, 145, "FR 30"],
      [490, 145, "FR 40"],
      [140, 540, "Longitudinals & transverse frames — alteration zone hatched in field"],
    ]),
  ];
  return doc;
}

function electrical(): DrawingDocument {
  const doc = base("electrical", "Electrical — Lighting & Power Plan");
  doc.entities = [
    ...hullOutline(),
    ...compartmentLines(),
    {
      id: uid(),
      kind: "symbol",
      layer: "ELECTRICAL",
      stroke: "#8A6D00",
      strokeWidth: 1.5,
      symbolId: "panel",
      x: 200,
      y: 300,
      scale: 1.1,
      rotation: 0,
      label: "MSP-1",
    },
    ...[
      [320, 220],
      [420, 220],
      [560, 220],
      [720, 260],
      [320, 440],
      [520, 440],
      [700, 420],
    ].map(
      ([x, y]): Entity => ({
        id: uid(),
        kind: "symbol",
        layer: "ELECTRICAL",
        stroke: "#8A6D00",
        strokeWidth: 1.5,
        symbolId: "light",
        x,
        y,
        scale: 0.8,
        rotation: 0,
      }),
    ),
    ...[
      [360, 300],
      [540, 300],
      [760, 340],
    ].map(
      ([x, y]): Entity => ({
        id: uid(),
        kind: "symbol",
        layer: "ELECTRICAL",
        stroke: "#8A6D00",
        strokeWidth: 1.5,
        symbolId: "outlet",
        x,
        y,
        scale: 0.75,
        rotation: 0,
      }),
    ),
    {
      id: uid(),
      kind: "symbol",
      layer: "ELECTRICAL",
      stroke: "#8A6D00",
      strokeWidth: 1.5,
      symbolId: "switch",
      x: 300,
      y: 260,
      scale: 0.9,
      rotation: 0,
      label: "S",
    },
    // feeder run
    {
      id: uid(),
      kind: "polyline",
      layer: "ELECTRICAL",
      stroke: "#B8860B",
      strokeWidth: 2,
      points: [
        { x: 220, y: 300 },
        { x: 300, y: 300 },
        { x: 300, y: 220 },
        { x: 720, y: 220 },
        { x: 720, y: 260 },
      ],
    },
    ...labels([
      [180, 360, "MAIN SWITCHBOARD"],
      [300, 200, "120V LIGHTING CIRCUIT L1"],
    ]),
  ];
  return doc;
}

function plumbing(): DrawingDocument {
  const doc = base("plumbing", "Plumbing — Piping Schematic Plan");
  doc.entities = [
    ...hullOutline(),
    ...compartmentLines(),
    {
      id: uid(),
      kind: "polyline",
      layer: "PLUMBING",
      stroke: "#0B6E4F",
      strokeWidth: 2.5,
      points: [
        { x: 180, y: 400 },
        { x: 180, y: 480 },
        { x: 600, y: 480 },
        { x: 600, y: 300 },
        { x: 780, y: 300 },
      ],
    },
    {
      id: uid(),
      kind: "polyline",
      layer: "PLUMBING",
      stroke: "#1D4E89",
      strokeWidth: 2,
      points: [
        { x: 200, y: 260 },
        { x: 500, y: 260 },
        { x: 500, y: 360 },
        { x: 760, y: 360 },
      ],
    },
    {
      id: uid(),
      kind: "symbol",
      layer: "PLUMBING",
      stroke: "#0B6E4F",
      strokeWidth: 1.5,
      symbolId: "pump",
      x: 180,
      y: 400,
      scale: 1,
      rotation: 0,
      label: "FW PUMP",
    },
    {
      id: uid(),
      kind: "symbol",
      layer: "PLUMBING",
      stroke: "#0B6E4F",
      strokeWidth: 1.5,
      symbolId: "valve",
      x: 360,
      y: 480,
      scale: 0.9,
      rotation: 0,
      label: "GV-1",
    },
    {
      id: uid(),
      kind: "symbol",
      layer: "PLUMBING",
      stroke: "#1D4E89",
      strokeWidth: 1.5,
      symbolId: "valve",
      x: 500,
      y: 300,
      scale: 0.9,
      rotation: 90,
      label: "BV-2",
    },
    {
      id: uid(),
      kind: "symbol",
      layer: "PLUMBING",
      stroke: "#0B6E4F",
      strokeWidth: 1.5,
      symbolId: "fixture",
      x: 780,
      y: 300,
      scale: 1,
      rotation: 0,
      label: "SINK",
    },
    ...labels([
      [220, 500, "POTABLE WATER (GREEN)"],
      [220, 240, "SANITARY / DRAIN (BLUE)"],
    ]),
  ];
  return doc;
}
