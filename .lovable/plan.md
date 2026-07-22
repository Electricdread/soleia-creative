## Goal

Refine the `/rate-card` copy and line items per client feedback.

## Changes to `src/pages/RateCard.tsx`

**1. Package section**
- Change price display from `$3,000` to `$3,000*` (asterisk denoting "starting at").
- Update the "Includes" line — remove cabana & bungalow TVs (they're quoted separately based on asset delivery). New text:
  > **Includes:** 1–3 looks across all venue LED screens and elevator displays. Cabana & bungalow TVs quoted separately based on asset delivery.

**2. `ADDITIONAL_OPTIONS` array**
- Rename `"Additional Transparent Logo Animation"` → `"Transparent Logo Animation"`.
- Insert a new item **above** the transparent logo line:
  - Title: `Static Logo`
  - Description: `Individual static brand logo, content to spec provided by client.`
  - Price: `$200`
- In `Elevator Dynamic Animation` description, remove the word "deliverables": change `"(3 deliverables): static image..."` → `"(3): static image..."` (keeps the count without the word).
- Insert a new item **below** `Elevator Dynamic Animation`:
  - Title: `Elevator Created by Client`
  - Description: `Client-created elevator animation delivered to spec (static + up + down). Soleia handles load and playback setup only.`
  - Price: `$500`

**3. `VIDEO_MAPPING` array**
- Update `Mapped by Soleia Creative Team` description to reference both logo and client animations. New:
  > `Mapping of client logo and brand animations, max 50 GB. Revisions to content after delivery (new files, edits, or re-export) will incur additional fees.`

## Out of scope

- No changes to Whatnot proposal or other DB records (rate card page only, per this request).
- No layout, CSS, or print-tuning changes — only copy/items.

## Verification

- Preview `/rate-card` on desktop + mobile — confirm all copy changes and new rows render, and the sheet still fits one page in print preview.
