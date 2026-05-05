## Goal
Add a "Download PDF" (and "Print") action to the Item Library in the Proposals section so the full list of line item templates can be saved or printed.

## Where
`src/pages/AdminProposals.tsx` — the "Item Library" tab (around line 252-257), next to the existing "Line Item Templates" header.

## UI
Add two small buttons in the header row of the Item Library card:
- **Print** (Printer icon) — opens the browser print dialog with a clean printable view.
- **Download PDF** (Download icon) — generates and downloads a PDF.

Layout: header becomes a flex row with title on the left, buttons on the right.

## PDF content
Grouped by category (matching the library's existing sort), each row showing:
- Title
- Category badge
- Description (if any)
- Price (right-aligned, USD)

Plus a header with "Line Item Library" title, generated date, and a totals footer (item count).

## Technical approach
- Use `jspdf` (already a project dep — used in `src/lib/pdfGenerator.ts` and `proposalPdfGenerator.ts`).
- Create a new helper `src/lib/lineItemLibraryPdf.ts` exporting `generateLineItemLibraryPdf(templates)` that returns/triggers a download. Style consistent with existing dark/luxury PDF aesthetic (gold #c49a3c accent header, Inter-like default font, ASCII-safe text).
- Fetch `line_item_templates` from Supabase in AdminProposals on demand when the user clicks the button (or reuse a fetched copy if we lift the LineItemLibrary state — simpler: re-query in the handler).
- Print: open a new window with a minimal HTML table styled for print, then `window.print()`.

## Files to modify / add
- `src/pages/AdminProposals.tsx` — add buttons + handlers in the library tab header.
- `src/lib/lineItemLibraryPdf.ts` — new PDF generator helper.

No DB changes, no edge functions, no new dependencies.