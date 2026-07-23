Bring back the two elements removed earlier from the Creative Guide (`src/components/CreativeGuideView.tsx`):

1. **Venue Layout stats strip** — the 4-cell counter that lives just under the InteractiveVenueMap in the "02 — Venue Layout" section:
   - 15 Cabanas · 9 Bungalows · 2 Mezzanine Levels · 30+ Display Zones
   - Restore the `LAYOUT_STATS` constant and its `Reveal` grid block.

2. **03 — Soleia 360° Tour section** — an embedded iframe of the Invision Studio virtual tour, placed between the Venue Layout and "What's Included" sections:
   - Restore `TOUR_360_URL = 'https://360virtualtour.invisionstudio.com/tours/sVpoz23SHC-'`.
   - Re-add the `<section id="tour">` with SectionHead ("03 — Soleia 360° Tour" / "Step inside."), the framed iframe, the Compass caption, and the "Open fullscreen" outline button.
   - Renumber the following sections' eyebrows so numbering stays sequential: "04 — What's Included", "05 — Creative Content Design".

3. **Nav + imports**:
   - Add `{ href: '#tour', label: '360° Tour' }` to `NAV_LINKS` (between Layout and Video Mapping).
   - Re-import `Compass` and `Maximize2` from `lucide-react`.

No other sections or behavior change. Content, styling, and copy match the pre-removal version verbatim.