import { useCallback, useMemo, useRef, useState } from "react";
import type {
  DrawingDocument,
  Entity,
  Point,
  SymbolEntity,
  Tool,
} from "../types";
import { getSymbol } from "../lib/symbols";
import { SymbolGlyph } from "./SymbolGlyph";
import { uid } from "../lib/ids";

interface Props {
  doc: DrawingDocument;
  tool: Tool;
  selectedId: string | null;
  activeSymbolId: string | null;
  onSelect: (id: string | null) => void;
  onChangeEntities: (entities: Entity[]) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

const LAYER_STROKE: Record<string, string> = {
  STRUCTURE: "#0B1F3A",
  ELECTRICAL: "#8A6D00",
  PLUMBING: "#0B6E4F",
  ANNOTATION: "#0B1F3A",
  TITLE: "#0B1F3A",
  "0": "#0B1F3A",
};

export function DrawingCanvas({
  doc,
  tool,
  selectedId,
  activeSymbolId,
  onSelect,
  onChangeEntities,
  svgRef,
}: Props) {
  const [draftStart, setDraftStart] = useState<Point | null>(null);
  const [draftCurrent, setDraftCurrent] = useState<Point | null>(null);
  const [polyPoints, setPolyPoints] = useState<Point[]>([]);
  const [pan, setPan] = useState({ x: 40, y: 20 });
  const [zoom, setZoom] = useState(1);
  const panning = useRef(false);
  const panOrigin = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const drag = useRef<{ id: string; ox: number; oy: number } | null>(null);

  const defaultLayer = useMemo(() => {
    switch (doc.drawingType) {
      case "electrical":
        return "ELECTRICAL";
      case "plumbing":
        return "PLUMBING";
      case "structural":
        return "STRUCTURE";
      default:
        return "STRUCTURE";
    }
  }, [doc.drawingType]);

  const toWorld = useCallback(
    (evt: React.PointerEvent | React.MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const pt = svg.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const local = pt.matrixTransform(ctm.inverse());
      return {
        x: (local.x - pan.x) / zoom,
        y: (local.y - pan.y) / zoom,
      };
    },
    [pan.x, pan.y, zoom, svgRef],
  );

  const finishShape = useCallback(
    (end: Point) => {
      if (!draftStart) return;
      const stroke = LAYER_STROKE[defaultLayer] || "#0B1F3A";
      let next: Entity | null = null;
      if (tool === "line") {
        next = {
          id: uid(),
          kind: "line",
          layer: defaultLayer,
          stroke,
          strokeWidth: 1.5,
          x1: draftStart.x,
          y1: draftStart.y,
          x2: end.x,
          y2: end.y,
        };
      } else if (tool === "rect") {
        next = {
          id: uid(),
          kind: "rect",
          layer: defaultLayer,
          stroke,
          strokeWidth: 1.5,
          x: Math.min(draftStart.x, end.x),
          y: Math.min(draftStart.y, end.y),
          width: Math.abs(end.x - draftStart.x),
          height: Math.abs(end.y - draftStart.y),
        };
      } else if (tool === "circle") {
        const r = Math.hypot(end.x - draftStart.x, end.y - draftStart.y);
        next = {
          id: uid(),
          kind: "circle",
          layer: defaultLayer,
          stroke,
          strokeWidth: 1.5,
          cx: draftStart.x,
          cy: draftStart.y,
          r,
        };
      }
      if (next) onChangeEntities([...doc.entities, next]);
      setDraftStart(null);
      setDraftCurrent(null);
    },
    [draftStart, tool, defaultLayer, doc.entities, onChangeEntities],
  );

  const onPointerDown = (evt: React.PointerEvent) => {
    const world = toWorld(evt);
    if (tool === "pan" || evt.button === 1) {
      panning.current = true;
      panOrigin.current = {
        x: evt.clientX,
        y: evt.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      return;
    }

    if (tool === "select") {
      // selection handled on entity handlers
      if ((evt.target as Element).getAttribute("data-canvas") === "bg") {
        onSelect(null);
      }
      return;
    }

    if (tool === "symbol" && activeSymbolId) {
      const stroke = LAYER_STROKE[defaultLayer] || "#0B1F3A";
      const entity: SymbolEntity = {
        id: uid(),
        kind: "symbol",
        layer: defaultLayer,
        stroke,
        strokeWidth: 1.5,
        symbolId: activeSymbolId,
        x: world.x,
        y: world.y,
        scale: 1,
        rotation: 0,
      };
      onChangeEntities([...doc.entities, entity]);
      onSelect(entity.id);
      return;
    }

    if (tool === "text") {
      const text = window.prompt("Annotation text:", "NOTE");
      if (!text) return;
      onChangeEntities([
        ...doc.entities,
        {
          id: uid(),
          kind: "text",
          layer: "ANNOTATION",
          stroke: "#0B1F3A",
          strokeWidth: 1,
          x: world.x,
          y: world.y,
          text,
          fontSize: 14,
        },
      ]);
      return;
    }

    if (tool === "polyline") {
      setPolyPoints((pts) => [...pts, world]);
      setDraftCurrent(world);
      return;
    }

    if (tool === "line" || tool === "rect" || tool === "circle") {
      setDraftStart(world);
      setDraftCurrent(world);
    }
  };

  const onPointerMove = (evt: React.PointerEvent) => {
    if (panning.current) {
      const dx = evt.clientX - panOrigin.current.x;
      const dy = evt.clientY - panOrigin.current.y;
      setPan({
        x: panOrigin.current.panX + dx,
        y: panOrigin.current.panY + dy,
      });
      return;
    }
    if (drag.current && tool === "select") {
      const world = toWorld(evt);
      const { id, ox, oy } = drag.current;
      const dx = world.x - ox;
      const dy = world.y - oy;
      drag.current = { ...drag.current, ox: world.x, oy: world.y };
      onChangeEntities(
        doc.entities.map((e) => (e.id !== id ? e : moveEntity(e, dx, dy))),
      );
      return;
    }
    if (draftStart || polyPoints.length) {
      setDraftCurrent(toWorld(evt));
    }
  };

  const onPointerUp = (evt: React.PointerEvent) => {
    if (panning.current) {
      panning.current = false;
      return;
    }
    if (drag.current) {
      drag.current = null;
      return;
    }
    if (draftStart && (tool === "line" || tool === "rect" || tool === "circle")) {
      finishShape(toWorld(evt));
    }
  };

  const onDoubleClick = () => {
    if (tool === "polyline" && polyPoints.length >= 2) {
      const stroke = LAYER_STROKE[defaultLayer] || "#0B1F3A";
      onChangeEntities([
        ...doc.entities,
        {
          id: uid(),
          kind: "polyline",
          layer: defaultLayer,
          stroke,
          strokeWidth: 1.5,
          points: polyPoints,
          closed: false,
        },
      ]);
      setPolyPoints([]);
      setDraftCurrent(null);
    }
  };

  const onWheel = (evt: React.WheelEvent) => {
    evt.preventDefault();
    const factor = evt.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(4, Math.max(0.35, z * factor)));
  };

  const titleBlockSvg = renderTitleBlock(doc);

  return (
    <div className="canvas-wrap">
      <svg
        ref={svgRef}
        className="drawing-svg"
        width="100%"
        height="100%"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
        onWheel={onWheel}
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#D5DEE8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect
          data-canvas="bg"
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="#E8EEF4"
        />
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          <rect
            data-canvas="bg"
            x={0}
            y={0}
            width={doc.canvasWidth}
            height={doc.canvasHeight}
            fill="#F4F7FA"
            stroke="#9AA8B8"
            strokeWidth={1}
          />
          <rect
            data-canvas="bg"
            x={0}
            y={0}
            width={doc.canvasWidth}
            height={doc.canvasHeight}
            fill="url(#grid)"
          />

          {doc.entities.map((entity) => (
            <EntityView
              key={entity.id}
              entity={entity}
              selected={entity.id === selectedId}
              onPointerDown={(e) => {
                if (tool !== "select") return;
                e.stopPropagation();
                onSelect(entity.id);
                const world = toWorld(e);
                drag.current = {
                  id: entity.id,
                  ox: world.x,
                  oy: world.y,
                };
              }}
            />
          ))}

          {titleBlockSvg}

          {draftStart && draftCurrent && tool === "line" && (
            <line
              x1={draftStart.x}
              y1={draftStart.y}
              x2={draftCurrent.x}
              y2={draftCurrent.y}
              stroke="#C8102E"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}
          {draftStart && draftCurrent && tool === "rect" && (
            <rect
              x={Math.min(draftStart.x, draftCurrent.x)}
              y={Math.min(draftStart.y, draftCurrent.y)}
              width={Math.abs(draftCurrent.x - draftStart.x)}
              height={Math.abs(draftCurrent.y - draftStart.y)}
              fill="none"
              stroke="#C8102E"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}
          {draftStart && draftCurrent && tool === "circle" && (
            <circle
              cx={draftStart.x}
              cy={draftStart.y}
              r={Math.hypot(draftCurrent.x - draftStart.x, draftCurrent.y - draftStart.y)}
              fill="none"
              stroke="#C8102E"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}
          {polyPoints.length > 0 && (
            <polyline
              points={[...polyPoints, draftCurrent].filter(Boolean).map((p) => `${p!.x},${p!.y}`).join(" ")}
              fill="none"
              stroke="#C8102E"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}
        </g>
      </svg>
      <div className="canvas-hud">
        Zoom {(zoom * 100).toFixed(0)}% · Sheet {doc.canvasWidth}×{doc.canvasHeight}
      </div>
    </div>
  );
}

function EntityView({
  entity,
  selected,
  onPointerDown,
}: {
  entity: Entity;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const common = {
    onPointerDown,
    style: { cursor: "pointer" } as const,
  };
  const highlight = selected ? { stroke: "#C8102E", strokeWidth: entity.strokeWidth + 1 } : {};

  switch (entity.kind) {
    case "line":
      return (
        <line
          {...common}
          x1={entity.x1}
          y1={entity.y1}
          x2={entity.x2}
          y2={entity.y2}
          stroke={highlight.stroke || entity.stroke}
          strokeWidth={highlight.strokeWidth || entity.strokeWidth}
        />
      );
    case "rect":
      return (
        <rect
          {...common}
          x={entity.x}
          y={entity.y}
          width={entity.width}
          height={entity.height}
          fill="none"
          stroke={highlight.stroke || entity.stroke}
          strokeWidth={highlight.strokeWidth || entity.strokeWidth}
        />
      );
    case "circle":
      return (
        <circle
          {...common}
          cx={entity.cx}
          cy={entity.cy}
          r={entity.r}
          fill="none"
          stroke={highlight.stroke || entity.stroke}
          strokeWidth={highlight.strokeWidth || entity.strokeWidth}
        />
      );
    case "polyline": {
      const pts = entity.points.map((p) => `${p.x},${p.y}`).join(" ");
      return entity.closed ? (
        <polygon
          {...common}
          points={pts}
          fill="none"
          stroke={highlight.stroke || entity.stroke}
          strokeWidth={highlight.strokeWidth || entity.strokeWidth}
        />
      ) : (
        <polyline
          {...common}
          points={pts}
          fill="none"
          stroke={highlight.stroke || entity.stroke}
          strokeWidth={highlight.strokeWidth || entity.strokeWidth}
        />
      );
    }
    case "text":
      return (
        <text
          {...common}
          x={entity.x}
          y={entity.y}
          fill={highlight.stroke || entity.stroke}
          fontSize={entity.fontSize}
          fontFamily="IBM Plex Sans, sans-serif"
        >
          {entity.text}
        </text>
      );
    case "symbol": {
      const def = getSymbol(entity.symbolId);
      if (!def) return null;
      return (
        <g
          {...common}
          transform={`translate(${entity.x} ${entity.y}) rotate(${entity.rotation}) scale(${entity.scale}) translate(-20 -20)`}
        >
          <SymbolGlyph def={def} stroke={highlight.stroke || entity.stroke} />
          {entity.label && (
            <text x={20} y={48} textAnchor="middle" fontSize={9} fill={entity.stroke}>
              {entity.label}
            </text>
          )}
          {selected && (
            <rect x={0} y={0} width={40} height={40} fill="none" stroke="#C8102E" strokeDasharray="3 2" />
          )}
        </g>
      );
    }
  }
}

function moveEntity(e: Entity, dx: number, dy: number): Entity {
  switch (e.kind) {
    case "line":
      return { ...e, x1: e.x1 + dx, y1: e.y1 + dy, x2: e.x2 + dx, y2: e.y2 + dy };
    case "rect":
      return { ...e, x: e.x + dx, y: e.y + dy };
    case "circle":
      return { ...e, cx: e.cx + dx, cy: e.cy + dy };
    case "polyline":
      return { ...e, points: e.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    case "text":
    case "symbol":
      return { ...e, x: e.x + dx, y: e.y + dy };
  }
}

function renderTitleBlock(doc: DrawingDocument) {
  const x = doc.canvasWidth - 320;
  const y = doc.canvasHeight - 140;
  const w = 300;
  const h = 120;
  const tb = doc.titleBlock;
  return (
    <g className="title-block">
      <rect x={x} y={y} width={w} height={h} fill="#fff" stroke="#0B1F3A" strokeWidth={1.5} />
      <line x1={x} y1={y + 28} x2={x + w} y2={y + 28} stroke="#0B1F3A" />
      <line x1={x} y1={y + 56} x2={x + w} y2={y + 56} stroke="#0B1F3A" />
      <line x1={x} y1={y + 84} x2={x + w} y2={y + 84} stroke="#0B1F3A" />
      <line x1={x + 150} y1={y + 28} x2={x + 150} y2={y + h} stroke="#0B1F3A" />
      <text x={x + 6} y={y + 18} fontSize={11} fontWeight={600} fill="#0B1F3A">
        {tb.drawingTitle || "Untitled"}
      </text>
      <text x={x + 6} y={y + 46} fontSize={9} fill="#0B1F3A">
        Dwg: {tb.drawingNumber} · Rev {tb.revision}
      </text>
      <text x={x + 156} y={y + 46} fontSize={9} fill="#0B1F3A">
        Sheet {tb.sheet} of {tb.ofSheets}
      </text>
      <text x={x + 6} y={y + 74} fontSize={9} fill="#0B1F3A">
        Vessel: {tb.vesselName || "—"} ({tb.vesselId || "—"})
      </text>
      <text x={x + 156} y={y + 74} fontSize={9} fill="#0B1F3A">
        Scale: {tb.scale}
      </text>
      <text x={x + 6} y={y + 102} fontSize={9} fill="#0B1F3A">
        Alteration: {tb.alteration || "—"}
      </text>
      <text x={x + 156} y={y + 102} fontSize={9} fill="#0B1F3A">
        Date: {tb.date}
      </text>
      <text x={x + 6} y={y + 116} fontSize={7} fill="#5A6B7D">
        {tb.office}
      </text>
    </g>
  );
}
