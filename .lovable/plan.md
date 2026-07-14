## Elevator Displays Spec Sheet (PDF)

Generate a single, downloadable Soleia-branded PDF explaining the Elevator Displays proposal add-on, using the uploaded elevator photo. Delivered as a `/mnt/documents/` artifact — no changes to the app code.

### Content (from the reference)

- Header band (dark #1a1a1a) with Soleia wide logo left, gold "ELEVATOR DISPLAYS" label right
- Intro line: what this add-on covers
- **Video Assets**: Resolution 600×800 · Frame Rate 30 fps · Format WMV · Duration 30 sec
- **Graphic Assets**: Resolution 600×800 · Format PNG or JPG
- **Total Deliverables: 3 files**
  - (1) 30-sec video or graphic — elevator moving up
  - (1) 30-sec video or graphic — elevator moving down
  - (1) Still graphic — elevator idling
  - Note: *Up/Down content may be the same file if preferred.*
- **Creative Note**: For smooth transitions, use the first frame of the video as the idle graphic.
- Right column: uploaded elevator photo (rounded, subtle shadow)
- Footer: Soleia Creative Team · contact email · gold rule

### Visual style

- Letter portrait, 40pt margins
- Palette matches existing proposal PDF: dark `#1a1a1a`, gold `#c49a3c`, text `#2c3e50`, muted `#7f8c8d`
- Helvetica (jsPDF built-in) — same font stack as `proposalPdfGenerator.ts`
- Gold left-border accent blocks for each section (matches proposal aesthetic)

### Technical approach

1. Copy the uploaded photo to `/tmp/elevator-ref.png` and the Soleia wide logo from `src/assets/soleia-wide-logo.png` for embedding.
2. Write a Node script (`/tmp/build-elevator-pdf.js`) using `jspdf` (already in project deps) that mirrors the proposal PDF style: dark header band, gold badge, section blocks with gold 3pt left rules, right-column image.
3. Run with `node /tmp/build-elevator-pdf.js` → outputs `/mnt/documents/Soleia_Elevator_Displays.pdf`.
4. QA: convert to JPG via `pdftoppm -jpeg -r 150`, inspect each page with `code--view`, fix any overlap/clipping, re-render.
5. Present via `<presentation-artifact>` for download.

### Out of scope

- No changes to `ClientProposal`, `proposalPdfGenerator.ts`, or line item library
- Not attached to any proposal record — this is a standalone download the user can email manually
