Scope
Update the public Creative Guide page to remove the numbered stats bar shown in the screenshot and the entire "03 — Soleia 360° Tour" section. Also clean up the related 360° tour references so the page no longer has dead links.

Changes

1. Remove the numbered stats section
   File: `src/components/CreativeGuideView.tsx`
   - Delete the `LAYOUT_STATS` array.
   - Delete the grid that renders the four stat cells (15 Cabanas / 9 Bungalows / 2 Mezzanine Levels / 30+ Display Zones) inside the "Venue Layout" section.
   - Keep the `InteractiveVenueMap` and the three world cards (Nightclub / Beachclub / Cabanas & Bungalows).

2. Remove the dedicated 360° tour section
   File: `src/components/CreativeGuideView.tsx`
   - Delete the entire `<section id="tour">` block containing the "03 — Soleia 360° Tour" headline, iframe, and descriptive text.
   - Delete the hero CTA button that links to `#tour`.
   - Delete the footer links labeled "360° Tour" and "Virtual Tour".
   - Delete the `TOUR_360_URL` constant.
   - Remove the now-unused `Compass` and `Maximize2` imports from this file.

3. Remove 360° tour links from the interactive venue map
   File: `src/components/creative-guide/InteractiveVenueMap.tsx`
   - Delete the `Open 360° tour` map control button.
   - Delete the `Step into the 360° tour` deep-link button list and its `TOUR_LINKS` data.
   - Delete the `TOUR_360_URL` constant and the unused `View` import.
   - Keep the pan, zoom, reset, and fullscreen controls and the venue image itself.

4. Verification
   - Search the project for `360virtualtour`, `#tour`, and `Soleia 360° Tour` to confirm no remaining references.
   - Run a build/type-check to ensure no import/constant errors are introduced.

Out of scope
- The printable Creative Guide (`PrintableCreativeGuide.tsx`) does not contain these sections, so it will not be modified.
- No renumbering of the remaining eyebrow labels (e.g., 01, 02, 04, 05) unless you want me to adjust those as well.