# Editorial Services Guide — Line Item Explainer Pages

Add a magazine-style narrative section to the PDFs that walks the client through every service category and item in the library. Same layout is reused in two places.

## What gets built

### 1. Data — extend the Line Item Library

Add long-form editorial fields to `line_item_templates` so admins can author narrative copy per item without touching code:

- `long_description text` — full paragraph describing what the service is
- `deliverables text[]` — bulleted list ("What's included")
- `ideal_for text` — one-line "Best for…" tag
- `sort_order integer` — controls order within a category (nulls last, then created_at)

Category-level intros live in a new tiny table:

- `line_item_categories(name text primary key, intro text, sort_order int, updated_at timestamptz)`

RLS: authenticated read/write for `line_item_categories` (mirrors `line_item_templates`), plus `GRANT SELECT` to `anon` so the standalone guide can render publicly if ever needed.

### 2. Admin UI — `LineItemLibrary.tsx`

Extend the existing edit form with the new fields:
- Long description (textarea)
- Deliverables (chip/line-per-row editor)
- "Best for" (single line)
- Sort order (number)

New sibling panel "Category Intros" — lists distinct categories, one textarea each, single save.

### 3. Shared renderer — `src/lib/editorialServicesPages.ts`

One function `renderEditorialPages(doc, templates, categoryIntros)` that draws the pages into an existing jsPDF instance. Reused by both entry points below.

Editorial layout per **category**:
- Full-bleed cream section-opener page: gold eyebrow (`CHAPTER 0X`), oversized DM-serif-style title (`times` in jsPDF), gold rule, italic intro paragraph, generous whitespace
- Followed by item pages: two-column asymmetric editorial grid
  - Left column (40%): item title in serif display, gold hairline, "Best for…" italic tag, price ghosted in muted small caps
  - Right column (60%): long description paragraph + "What's included" bulleted list with gold ✦ markers
- Gold running header ("SOLEIA CREATIVE TEAM — SERVICES") and page number footer
- Auto page-break when an item block doesn't fit; never split a single item across pages

Grouping/order: categories ordered by `line_item_categories.sort_order`, items by `sort_order` then `created_at`.

### 4. Entry point A — Standalone Services Guide

Update `src/lib/lineItemLibraryPdf.ts`:
- Keep the existing cover page
- After cover, call `renderEditorialPages(...)` for the full editorial catalog
- Keep the compact price index as the final section (retitled "Price Index") so clients still have a quick-scan reference

### 5. Entry point B — Inside every proposal PDF

Update `src/lib/proposalPdfGenerator.ts`:
- After the scope table + timeline + terms, before the Reference Images grid, call `renderEditorialPages(doc, allLibraryTemplates, categoryIntros)` on a fresh page
- The proposal generator will fetch `line_item_templates` + `line_item_categories` (full catalog, per the user's decision) alongside its current queries
- Section opener page reads: "About our services" so the client understands this is context, not scope

### 6. QA

Generate a sample PDF with realistic content (Creative Direction, Content Production, Post-Production, On-Site, Add-Ons — 2–4 items each with long descriptions and deliverables), convert every page via `pdftoppm`, and inspect each one for overflow, orphaned bullets, and font issues before shipping.

## Technical notes

- All new DB work goes through the migration tool with GRANTs in the same migration.
- Editorial renderer uses only jsPDF built-in `helvetica` + `times` (matching current PDFs) — no font loading, keeps bundle small.
- ASCII-safe strings (existing `ascii()` helper is reused).
- Deliverables render as wrapped multi-line bullets; each item block is pre-measured so `ensureSpace()` can decide page breaks cleanly.
- No changes to proposal scope/total logic — editorial pages are informational only.
