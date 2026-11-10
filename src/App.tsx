import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveAs } from "file-saver";
import type { DrawingDocument, DrawingType, Entity, TitleBlock, Tool } from "./types";
import { DRAWING_TYPE_LABELS } from "./types";
import { createTemplate } from "./templates";
import { symbolsForType } from "./lib/symbols";
import { SymbolGlyph } from "./components/SymbolGlyph";
import { DrawingCanvas } from "./components/DrawingCanvas";
import { exportDxf } from "./export/dxf";
import { exportPdf } from "./export/pdf";
import { exportPng } from "./export/png";
import {
  buildShareUrl,
  decodeShareHash,
  parseDocument,
  serializeDocument,
} from "./lib/share";
import "./App.css";

const TOOLS: Array<{ id: Tool; label: string }> = [
  { id: "select", label: "Select" },
  { id: "pan", label: "Pan" },
  { id: "line", label: "Line" },
  { id: "rect", label: "Rect" },
  { id: "circle", label: "Circle" },
  { id: "polyline", label: "Poly" },
  { id: "text", label: "Text" },
  { id: "symbol", label: "Symbol" },
];

export default function App() {
  const [doc, setDoc] = useState<DrawingDocument>(() => createTemplate("general-arrangement"));
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSymbolId, setActiveSymbolId] = useState<string | null>(null);
  const [status, setStatus] = useState("Ready — USCG ship alteration reference drawings");
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (raw.startsWith("d=")) {
      const decoded = decodeShareHash(raw.slice(2));
      if (decoded) {
        setDoc(decoded);
        setStatus("Loaded shared drawing from link");
      }
    }
  }, []);

  const symbols = useMemo(() => symbolsForType(doc.drawingType), [doc.drawingType]);

  const updateDoc = useCallback((patch: Partial<DrawingDocument>) => {
    setDoc((d) => ({
      ...d,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const setEntities = useCallback(
    (entities: Entity[]) => updateDoc({ entities }),
    [updateDoc],
  );

  const setTitleBlock = useCallback(
    (titleBlock: TitleBlock) => updateDoc({ titleBlock }),
    [updateDoc],
  );

  const switchType = (type: DrawingType) => {
    if (
      !window.confirm(
        `Load the ${DRAWING_TYPE_LABELS[type]} template? Unsaved edits on this sheet will be replaced.`,
      )
    ) {
      return;
    }
    setDoc(createTemplate(type));
    setSelectedId(null);
    setActiveSymbolId(null);
    setTool("select");
    setStatus(`Loaded ${DRAWING_TYPE_LABELS[type]} template`);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setEntities(doc.entities.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  };

  const clearSheet = () => {
    if (!window.confirm("Clear all geometry on this sheet?")) return;
    setEntities([]);
    setSelectedId(null);
  };

  const downloadJson = () => {
    const blob = new Blob([serializeDocument(doc)], { type: "application/json" });
    saveAs(blob, `${doc.titleBlock.drawingNumber || "drawing"}.uscg.json`);
    setStatus("Saved editable JSON drawing");
  };

  const downloadDxf = () => {
    const dxf = exportDxf(doc);
    const blob = new Blob([dxf], { type: "application/dxf" });
    saveAs(blob, `${doc.titleBlock.drawingNumber || "drawing"}.dxf`);
    setStatus("Exported DXF (editable open CAD format)");
  };

  const downloadPng = async () => {
    if (!svgRef.current) return;
    const blob = await exportPng(svgRef.current, doc);
    saveAs(blob, `${doc.titleBlock.drawingNumber || "drawing"}.png`);
    setStatus("Exported PNG for review");
  };

  const downloadPdf = async () => {
    if (!svgRef.current) return;
    const blob = await exportPdf(svgRef.current, doc);
    saveAs(blob, `${doc.titleBlock.drawingNumber || "drawing"}.pdf`);
    setStatus("Exported PDF for review");
  };

  const copyShareLink = async () => {
    try {
      const url = buildShareUrl(doc);
      await navigator.clipboard.writeText(url);
      window.location.hash = `d=${url.split("#d=")[1] || ""}`;
      setShareMsg("Share link copied — others can open and alter this drawing");
      setStatus("Share link copied to clipboard");
    } catch {
      setShareMsg("Could not copy link; try exporting JSON instead");
    }
  };

  const onImportFile = async (file: File) => {
    const text = await file.text();
    try {
      const parsed = parseDocument(text);
      setDoc(parsed);
      setSelectedId(null);
      setStatus(`Imported ${parsed.titleBlock.drawingNumber}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Import failed");
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const t = e.target as HTMLElement;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
        deleteSelected();
      }
      if (e.key === "Escape") {
        setTool("select");
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const tb = doc.titleBlock;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden />
          <div>
            <p className="brand">USCG Blueprint</p>
            <p className="brand-sub">Ship Alteration Reference Drawings</p>
          </div>
        </div>
        <nav className="type-nav" aria-label="Drawing type">
          {(Object.keys(DRAWING_TYPE_LABELS) as DrawingType[]).map((type) => (
            <button
              key={type}
              type="button"
              className={doc.drawingType === type ? "active" : ""}
              onClick={() => switchType(type)}
            >
              {DRAWING_TYPE_LABELS[type]}
            </button>
          ))}
        </nav>
        <div className="export-group">
          <a
            className="msd-link"
            href={`${import.meta.env.BASE_URL}msd-line-diagrams.html`}
            target="_blank"
            rel="noreferrer"
          >
            MSD line diagrams
          </a>
          <button type="button" className="primary" onClick={downloadDxf}>
            Export DXF
          </button>
          <button type="button" onClick={downloadPdf}>
            PDF
          </button>
          <button type="button" onClick={downloadPng}>
            PNG
          </button>
          <button type="button" onClick={downloadJson}>
            JSON
          </button>
          <button type="button" onClick={copyShareLink}>
            Share link
          </button>
          <button type="button" onClick={() => fileRef.current?.click()}>
            Open
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json,.uscg.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImportFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <section>
            <h2>Tools</h2>
            <div className="tool-grid">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={tool === t.id ? "active" : ""}
                  onClick={() => {
                    setTool(t.id);
                    if (t.id !== "symbol") setActiveSymbolId(null);
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="side-actions">
              <button type="button" onClick={deleteSelected} disabled={!selectedId}>
                Delete selected
              </button>
              <button type="button" onClick={clearSheet}>
                Clear sheet
              </button>
            </div>
            <p className="hint">
              Double-click finishes a polyline. Drag with Select. Delete removes selection.
            </p>
          </section>

          <section>
            <h2>Symbols — {DRAWING_TYPE_LABELS[doc.drawingType]}</h2>
            <div className="symbol-grid">
              {symbols.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={activeSymbolId === s.id && tool === "symbol" ? "active" : ""}
                  title={s.name}
                  onClick={() => {
                    setActiveSymbolId(s.id);
                    setTool("symbol");
                  }}
                >
                  <SymbolGlyph def={s} stroke="#0B1F3A" size={36} />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2>Title block</h2>
            <div className="field-grid">
              {(
                [
                  ["drawingTitle", "Drawing title"],
                  ["drawingNumber", "Drawing number"],
                  ["vesselName", "Vessel name"],
                  ["vesselId", "Vessel ID / official number"],
                  ["alteration", "Alteration / job"],
                  ["revision", "Revision"],
                  ["drawnBy", "Drawn by"],
                  ["checkedBy", "Checked by"],
                  ["date", "Date"],
                  ["scale", "Scale"],
                  ["sheet", "Sheet"],
                  ["ofSheets", "Of sheets"],
                ] as Array<[keyof TitleBlock, string]>
              ).map(([key, label]) => (
                <label key={key}>
                  <span>{label}</span>
                  <input
                    value={tb[key]}
                    onChange={(e) =>
                      setTitleBlock({ ...tb, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <label className="full">
                <span>Office / submittal context</span>
                <input
                  value={tb.office}
                  onChange={(e) => setTitleBlock({ ...tb, office: e.target.value })}
                />
              </label>
              <label className="full">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={tb.notes}
                  onChange={(e) => setTitleBlock({ ...tb, notes: e.target.value })}
                />
              </label>
            </div>
          </section>
        </aside>

        <main className="stage">
          <DrawingCanvas
            doc={doc}
            tool={tool}
            selectedId={selectedId}
            activeSymbolId={activeSymbolId}
            onSelect={setSelectedId}
            onChangeEntities={setEntities}
            svgRef={svgRef}
          />
        </main>
      </div>

      <footer className="statusbar">
        <span>{status}</span>
        {shareMsg && <span className="share-msg">{shareMsg}</span>}
        <span className="muted">
          Editable exports: DXF + JSON · Review: PDF/PNG · DWG via CAD import of DXF
        </span>
      </footer>
    </div>
  );
}
