## Goal

Add a single new pixelmap card titled **"DLV Marquee/Ticker LED Display"** to the Creative Guide → Display Specs view. The card displays a Soleia-styled pixelmap diagram (dark background, gold accents, JetBrains Mono labels) based on the attached reference, with downloadable PNG. No other surfaces (Delivery Guide, Tutorial, Printable PDF) are touched in this pass.

## Specs (from reference)

- **Total LED Video Display:** W 3792 × H 192 px
- **West Side (Las Vegas Blvd):** W 1608 × H 192 px
- **South Side (Flamingo Rd):** W 2184 × H 192 px
- Pixel aspect: 19.75:1 (ultra-wide ribbon)

## Implementation

### 1. Generate Soleia-styled pixelmap PNG
Create `public/creative-guide/dlv-marquee-pixelmap.png` using `imagegen` — dark charcoal background, gold (#c49a3c) outlined rectangles, JetBrains Mono dimension labels matching the reference layout (one full ribbon split into West/South segments with bracketed measurements underneath).

### 2. Add DisplayType entry in `src/lib/creativeGuide.ts`
New entry appended to `DISPLAY_TYPES`:
- `id: 'dlv-marquee'`
- `category: 'led'`
- `name: 'DLV Marquee / Ticker LED Display'`
- `description: 'Exterior wraparound LED ribbon facing Las Vegas Blvd and Flamingo Rd.'`
- `videoSpecs`: 3792×192, DXV3 MOV, 30/60fps, 10–30s
- `graphicSpecs`: 3792×192 PNG (with separate West 1608×192 / South 2184×192 deliverables noted)
- `dimensions`: `[{label:'Full', 3792, 192}, {label:'West (LV Blvd)', 1608, 192}, {label:'South (Flamingo)', 2184, 192}]`
- `deliverables`: Full ribbon + West and South segments
- `creativeNotes`: Ultra-wide aspect — design horizontally with safe edges; avoid centered text-only compositions; West and South segments can run synced or independent

### 3. Add dedicated pixelmap download in `DisplaySpecsView.tsx`
Since the existing LED card hard-codes a single pixelmap, add a small branch: when `display.id === 'dlv-marquee'`, render its own "Download Pixelmap" button pointing to `/creative-guide/dlv-marquee-pixelmap.png` (no AE template button, no main LED carousel — use a simple `<img>` of the new pixelmap as the card visual).

## Out of scope

- No changes to Delivery Guide, Tutorial, or Printable Creative Guide PDF
- No AE template for this display
- No DB / edge function changes