import type { SymbolDef } from "../types";

export function SymbolGlyph({
  def,
  stroke = "currentColor",
  size = 40,
}: {
  def: SymbolDef;
  stroke?: string;
  size?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      {def.paths.map((p, i) => {
        if (p.kind === "line" && p.x1 != null) {
          return (
            <line
              key={i}
              x1={p.x1}
              y1={p.y1}
              x2={p.x2}
              y2={p.y2}
              stroke={stroke}
              strokeWidth={p.strokeWidth ?? 1.5}
              fill="none"
            />
          );
        }
        if (p.kind === "circle" && p.cx != null && p.cy != null && p.r != null) {
          return (
            <circle
              key={i}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              stroke={stroke}
              strokeWidth={p.strokeWidth ?? 1.5}
              fill="none"
            />
          );
        }
        if (p.kind === "polyline" && p.points) {
          const pts = p.points.map((pt) => `${pt.x},${pt.y}`).join(" ");
          return p.closed ? (
            <polygon
              key={i}
              points={pts}
              stroke={stroke}
              strokeWidth={p.strokeWidth ?? 1.5}
              fill="none"
            />
          ) : (
            <polyline
              key={i}
              points={pts}
              stroke={stroke}
              strokeWidth={p.strokeWidth ?? 1.5}
              fill="none"
            />
          );
        }
        if (p.kind === "path" && p.d) {
          return (
            <path
              key={i}
              d={p.d}
              stroke={stroke}
              strokeWidth={p.strokeWidth ?? 1.5}
              fill="none"
            />
          );
        }
        return null;
      })}
    </svg>
  );
}
