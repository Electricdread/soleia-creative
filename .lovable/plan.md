
# Soleia Las Vegas — Rate Card One-Pager

Build a single-page, editorial-luxury rate card, plus a matching one-page PDF export.

## Deliverables

1. **New route:** `/rate-card` (public, print-friendly)
2. **New PDF generator:** matches the on-screen design, downloadable via a button on the page and from `AdminProposals`

## Files

- `src/pages/RateCard.tsx` — new page component
- `src/lib/rateCardPdf.ts` — new jsPDF generator (single US-Letter page)
- `src/App.tsx` — register `/rate-card` route (public, no auth guard)
- `src/pages/AdminProposals.tsx` — add small "Rate Card PDF" button next to existing Library PDF/Print buttons

## Design

- Ivory background `#f7f2ea`, bronze/gold `#b1893f` + `#9a6f2a`, warm charcoal-brown text `#3a332a`
- Serif (Georgia via existing `font-display` fallback stack — headings + item names)
- Sans-serif (Inter — descriptions, small caps labels)
- Centered container, max-width ~800px, generous whitespace
- Thin gold hairline rules under section labels
- Thin decorative border framing the entire page (double-hairline gold)
- Uppercase, letter-spaced section labels
- No bright colors, no heavy shadows — restrained editorial feel
- Fully responsive; a `print:` stylesheet block keeps it clean when printed

## Content

**Header (centered)**
- Wordmark: `SOLEIA` (serif), small sun glyph (reuse `SoleiaLogo` at ~28px in gold), `LAS VEGAS` in spaced small caps below
- Tagline (uppercase, spaced): `Creative Services & Rate Card`
- Title: `Soleia Creative & Immersive LED` (the `&` italic in gold)
- Subtitle (spaced caps): `Environments · Branded Overlays · Mapping`

**Section 1 — Featured Package** (gold-tinted background `#f3e9d2`, thin gold border, generous padding)
- Item name (serif): `Immersive LED Environments & Branded Overlay Design`
- Description (single paragraph, exact copy from user brief)
- Left column: `Qty: 1 × Unit`
- Right column: small uppercase gold label `STARTING AT` above a large serif `$3,000`

**Callout — Included in your venue contract** (below Section 1)
- White background, thin gold border, 3px gold left-accent border
- Small uppercase gold heading: `Included in your venue contract`
- Line 1: `Up to 10 static logos — LED screens`
- Line 2: `1 static logo — all TVs, Cabanas & Bungalows`

**Section 2 — Additional Services** (short list from library)
- Section label: `Additional Services` (uppercase, spaced, gold hairline under)
- Compact list, one row per item: serif title on left · dot-leader · price on right
- Pulled live from `line_item_templates` (top 6–8 by `sort_order`, excluding the featured package if present); no long descriptions here — keeps the sheet to one page

**Footer**
- Thin gold hairline
- Small centered line: `soleiacreative.app · Las Vegas`
- Small italic disclaimer: `Pricing is a guide; final proposals are tailored to each engagement.`

## PDF Export (`rateCardPdf.ts`)

- US Letter portrait, single page (guarded — content is sized to fit)
- Same color/type system as on-screen (ivory bg fill, gold accents, serif via `times`, sans via `helvetica`)
- Decorative double-hairline border inside 36pt margin
- Same three blocks: featured package box, venue-contract callout, additional-services list
- ASCII-safe (reuse the `ascii()` helper pattern from `lineItemLibraryPdf.ts`)
- Filename: `soleia-rate-card-YYYY-MM-DD.pdf`
- Page button: "Download PDF" (top-right, sticky, print-hidden)
- Admin button: added into the existing button row in `AdminProposals.tsx`

## Out of Scope

- No changes to existing proposal/PDF logic or totals path (`proposalTotals.ts` untouched)
- No new tables, no schema changes
- Not linked from public nav (only shareable by URL + admin button) unless requested
