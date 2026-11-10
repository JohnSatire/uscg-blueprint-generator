export type DrawingType =
  | "general-arrangement"
  | "structural"
  | "electrical"
  | "plumbing";

export type Tool =
  | "select"
  | "pan"
  | "line"
  | "rect"
  | "circle"
  | "polyline"
  | "text"
  | "symbol";

export type EntityKind =
  | "line"
  | "rect"
  | "circle"
  | "polyline"
  | "text"
  | "symbol";

export interface Point {
  x: number;
  y: number;
}

export interface BaseEntity {
  id: string;
  kind: EntityKind;
  layer: string;
  stroke: string;
  fill?: string;
  strokeWidth: number;
  locked?: boolean;
}

export interface LineEntity extends BaseEntity {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RectEntity extends BaseEntity {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleEntity extends BaseEntity {
  kind: "circle";
  cx: number;
  cy: number;
  r: number;
}

export interface PolylineEntity extends BaseEntity {
  kind: "polyline";
  points: Point[];
  closed?: boolean;
}

export interface TextEntity extends BaseEntity {
  kind: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  rotation?: number;
}

export interface SymbolEntity extends BaseEntity {
  kind: "symbol";
  symbolId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  label?: string;
}

export type Entity =
  | LineEntity
  | RectEntity
  | CircleEntity
  | PolylineEntity
  | TextEntity
  | SymbolEntity;

export interface TitleBlock {
  drawingTitle: string;
  drawingNumber: string;
  vesselName: string;
  vesselId: string;
  alteration: string;
  revision: string;
  drawnBy: string;
  checkedBy: string;
  date: string;
  scale: string;
  sheet: string;
  ofSheets: string;
  office: string;
  notes: string;
}

export interface DrawingDocument {
  version: 1;
  drawingType: DrawingType;
  titleBlock: TitleBlock;
  entities: Entity[];
  canvasWidth: number;
  canvasHeight: number;
  createdAt: string;
  updatedAt: string;
}

export interface SymbolDef {
  id: string;
  name: string;
  category: DrawingType | "common";
  /** Local geometry in symbol units (approx 40x40). */
  paths: Array<{
    d?: string;
    points?: Point[];
    closed?: boolean;
    cx?: number;
    cy?: number;
    r?: number;
    kind: "path" | "polyline" | "circle" | "line";
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    strokeWidth?: number;
  }>;
}

export const DRAWING_TYPE_LABELS: Record<DrawingType, string> = {
  "general-arrangement": "General Arrangement",
  structural: "Structural",
  electrical: "Electrical",
  plumbing: "Plumbing",
};

export const DEFAULT_TITLE_BLOCK: TitleBlock = {
  drawingTitle: "Ship Alteration Reference Drawing",
  drawingNumber: "SA-XXXX-001",
  vesselName: "",
  vesselId: "",
  alteration: "",
  revision: "A",
  drawnBy: "",
  checkedBy: "",
  date: new Date().toISOString().slice(0, 10),
  scale: '1/4" = 1\'-0"',
  sheet: "1",
  ofSheets: "1",
  office: "United States Coast Guard — Plan Submittal Reference",
  notes:
    "Reference drawing for vessel alteration review. Verify against vessel as-built conditions before construction.",
};
