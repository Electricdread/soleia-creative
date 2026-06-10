## Goal

Swap the Interactive Venue Map's blueprint to the newly uploaded Soleia Las Vegas top-down render, and re-align the clickable zone pins (Right, Main, Left, Arrival, TV) plus location labels (Lily Pad, Pool 2, Pool) to the new layout.

## Steps

1. **Upload new blueprint as light variant**
   - Take uploaded `venue-layout2.jpg`, save to `public/creative-guide/venue-blueprint-light.png` (overwrite existing).

2. **Generate dark variant**
   - Use `imagegen--edit_image` on the new image to produce a dark-mode version (deep charcoal background replacing cream, preserving architectural detail and red accents). Save to `public/creative-guide/venue-blueprint-dark.png`.

3. **Re-tune pin coordinates in `InteractiveVenueMap.tsx`**
   - In the new image the venue is centered with whitespace margins (~10% left, ~5% right). Recompute `x/y` % for each `ZONE_PINS` entry and `LABEL_PINS` entry against the new image:
     - `right` (stage-right curves) — upper interior of the right-side amphitheater
     - `main` (stage wall, 3 IMAG members) — center of the curved stage on the right half
     - `left` (stage-left curves) — lower interior of the right-side amphitheater
     - `arrival` (3 outdoor screens) — pinned at the bottom-center outdoor strip + members on the wraparound red ribbon
     - `tv` — upper cabanas / interior area
     - Labels: `Lily Pad` (upper-left round pool), `Pool` (large central palm pool), `Pool 2` (second pool basin)
   - Keep all other logic, mapping cards, and zone metadata untouched.

## Out of scope

- No changes to zone metadata, mapping-card thumbnails (`/zone-cards/*`), display specs, or any other surface.
- No layout/UI changes to the map controls.
