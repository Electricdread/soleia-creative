All ticker/marquee code and copy is already gone from the source files (verified via `rg` — zero remaining matches in `src/` and `public/`). What's left is dead imports and a few layouts that still budget grid space for a 4th item that no longer exists.

## Changes

**1. `src/components/creative-guide/PrintableCreativeGuide.tsx`**
- Drop unused `Palette` from the lucide-react import.
- Section 3 "Screen Specifications by Zone" already uses `grid-cols-3` (Indoor / Outdoor / Sunray) — no layout change needed. Confirmed Section 2 (Display Specifications) iterates `DISPLAY_TYPES` which no longer contains ticker, so the PDF output already matches the on-site removal.

**2. `src/pages/DeliveryGuide.tsx`**
- The 3-item `displaySpecs` array currently renders in `grid sm:grid-cols-2`, leaving one orphan card on the second row. Switch to `grid sm:grid-cols-2 lg:grid-cols-3` so TV / LED / Elevator each get an equal column on wider screens and the reclaimed marquee space is filled cleanly.

**3. `src/pages/Tutorial.tsx`**
- Drop unused `Smartphone` from the lucide-react import.
- The Display Types grid (currently 3 cards in `lg:grid-cols-3`) and the LED Zones / Outdoor Zones lists no longer reference a ticker entry — already balanced, no further layout change needed.

**4. `src/components/creative-guide/DisplaySpecsView.tsx`**
- All current imports (`AnimatePresence`, `Clock`, `FileVideo`, `X`) are still in use after the ticker removal — no edits required.

## Out of scope
- Unused public assets under `/public/creative-guide/` (`ticker-specs.jpg`, `ticker-display.jpg`, `TICKER-MARQUEE.zip`, `marquee-ticker-media/`) remain on disk. Say the word and I'll delete them too.
- No DB or edge-function changes.
