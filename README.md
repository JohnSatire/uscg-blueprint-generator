# USCG Ship Alteration Blueprint Generator

Web app for creating **United States Coast Guard** ship-alteration reference drawings. Edit geometry, place type-specific symbols, fill a plan-submittal title block, then export editable **DXF** / **JSON** or review **PDF** / **PNG**.

## Drawing types

- General Arrangement
- Structural
- Electrical
- Plumbing

## Run locally

```bash
cd uscg-blueprint-generator
npm install
npm run dev
```

Open the URL Vite prints (usually `http://127.0.0.1:5173`).

```bash
npm run build
npm run preview
```

## Export formats

| Format | Purpose |
|--------|---------|
| **DXF** | Primary editable CAD exchange (open format). Import into AutoCAD / LibreCAD / etc. DWG is available by saving-as from CAD after DXF import. |
| **JSON** (`.uscg.json`) | Full editable drawing for re-open / collaboration round-trip in this app |
| **PDF / PNG** | Review and plan-submittal attachment |

Share a live link with **Share link** (drawing state in the URL hash) or pass the JSON file to collaborators.

## Stack

React + TypeScript + Vite, SVG editor, custom ASCII DXF writer, jsPDF for PDF.
