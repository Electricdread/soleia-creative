## Goal

Rebuild `/rate-card` (screen + PDF) so it matches the uploaded `Soleia_Creative_Services.pdf` exactly — same layout, sections, copy, ornaments, and typography.

## Gaps vs. reference

The current page is missing or mis-styled:
- SOLEIA sun wordmark (uses text "SOLEIA" instead of the sun-icon logo).
- Featured package section label ("SOLEIA CREATIVE PACKAGE").
- Add-ons are rendered as a single dotted-leader list. Reference splits them into two grouped sections with per-row description + `1 × Unit` + price:
  - **ADDITIONAL OPTIONS**: Additional Transparent Logo Animation ($750), Elevator Dynamic Animation ($750), Elevator Static Logo ($350), Individual Cabana / Bungalow Logo ($300), 3D Previz ($350).
  - **VIDEO MAPPING & LOAD FEES**: Mapped by Soleia Creative Team ($1,500), Mapped to Spec by Client ($1,000), Outside Arch Specific Video ($500), Performing Artist — Mapped by Soleia Creative Team ($950).
- **THE PROCESS** block: three gold-bordered cards — 14 Days / Content Creation · 3 Days / Client Review · 1 Round / Revision & Final Delivery.
- **TERMS & CONDITIONS** bullet list (6 items from the reference).
- Footer wordmark "SOLEIA LAS VEGAS" (small caps, letter-spaced).

## Changes

**1. `src/pages/RateCard.tsx` — full rebuild**
- Replace text SOLEIA header with `soleia-icon.png` (existing brand asset) inline with the "SOLEIA / LAS VEGAS" wordmark, then the "CREATIVE SERVICES & RATE CARD" eyebrow.
- Keep the double gold border frame and ivory background.
- Section 1 (SOLEIA CREATIVE PACKAGE): unchanged copy, add left-aligned `SOLEIA CREATIVE PACKAGE` eyebrow above the card; keep `1 × Unit` and `STARTING AT $3,000`.
- Venue contract callout: keep as-is.
- Replace dynamic RPC-fed list with two hardcoded, categorized tables (ADDITIONAL OPTIONS, VIDEO MAPPING & LOAD FEES) using the exact titles, descriptions, and prices from the reference. Drop the `get_rate_card_addons` fetch — this rate card becomes a curated document, not a mirror of the item library.
- Add THE PROCESS 3-card row and TERMS & CONDITIONS list with the exact wording from the reference.
- Footer becomes "SOLEIA LAS VEGAS" centered wordmark.

**2. `src/lib/rateCardPdf.ts` — full rebuild**
- Regenerate the PDF to match the new layout 1:1 (letter, ivory, double gold border, sun-icon header, grouped sections with descriptions + qty + price columns, process cards, terms list, footer).
- No add-ons parameter — content is static and matches the on-screen page.
- Update `downloadRateCardPdf()` signature accordingly and update the single caller (`AdminProposals.tsx` Rate Card button).

**3. QA**
- Render the page in-browser and via Playwright screenshot at letter proportions; compare against `Soleia_Creative_Services.pdf` page 1.
- Generate the PDF, run `pdftoppm -jpeg -r 120`, view, and iterate until it visually matches the reference.

## Out of scope
- No DB, RLS, or RPC changes. `get_rate_card_addons` stays available for other callers.
- No selectable/submit flow on the rate card (deferred per prior discussion).
