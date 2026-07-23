## Goal

Restyle the client-facing proposal page (`/proposal/:token`) to match the ivory + gold editorial rate card, and rework the services table so descriptions read cleanly instead of stacking as a narrow, cramped column.

Only the proposal's presentation changes. Signing logic, quantity math, admin editing, PDF export, DB, and routing all stay the same.

## What changes

### 1. Palette + typography (proposal page only)

Wrap the proposal in a scoped ivory theme (`#f7f2ea` background, ink text, gold accents) so it visually reads as the same document family as the rate card. Nothing changes for admin views, other routes, or global theme tokens.

- Ivory sheet inside a thin gold border (matches rate-card sheet).
- Section eyebrows: uppercase 10px, `0.35em` tracking, gold-deep color, hairline gold rule to the right.
- Headings: `font-display` (same as rate card).
- Body: ink/soft-ink instead of muted-foreground.
- Venue-contract callout restyled as the rate-card gold-tint card with gold left rule.

### 2. Services layout — no more skinny description column

Replace the current 6-column table (Category / Line Item / Qty / Unit / Rate / Total) with a rate-card-style row list grouped by category. This is what fixes the "description doesn't read well" complaint — descriptions get the full row width instead of being squeezed under a narrow Line Item cell.

Each service row (desktop):

```text
[✓]  Title                                         Qty −1+     $Rate     $Total
     Full-width description reads across the row, not a
     narrow column. Soft-ink, 12px, comfortable leading.
```

- Category becomes a rate-card section header (`SectionLabel`) above its group, not a repeated column.
- Title on its own line, full-width description below it (same pattern as `ServiceRow` in RateCard.tsx), so long copy like the 3D Previz paragraph flows naturally.
- Qty stepper, rate, and total sit on the right in a fixed strip; the description never gets squeezed by them.
- Selection checkbox stays on the left; row click still toggles selection.
- Mobile: stacks (title + description, then a right-aligned qty/price row) — same responsive pattern as the rate card.

Signed / admin views hide the checkbox and qty stepper exactly like today.

### 3. Totals + supporting sections restyled to match

- "Proposal Total" band → ivory card with gold left rule and gold-deep eyebrow (matches rate-card featured package styling).
- Timeline / Terms / Approved-clips / Gallery section headers reuse the same eyebrow + hairline treatment.
- Signature panel keeps its green "accepted" tone but sits inside the ivory sheet.

### 4. Out of scope

- No PDF changes.
- No admin-edit UI restyle (admin edit mode keeps current shadcn inputs).
- No changes to `src/pages/RateCard.tsx`, DB, RPCs, or line-item content.

## Files touched

- `src/components/proposal/ProposalView.tsx` — scoped ivory theme wrapper, new service-row layout, restyled eyebrows/callouts/total band.
- Possibly a small new `src/components/proposal/ProposalServiceRow.tsx` to keep `ProposalView.tsx` from bloating.
- `src/components/proposal/ProposalTimeline.tsx`, `ProposalTerms.tsx`, `ProposalApprovedClips.tsx` — light restyle so their section headers/borders match the eyebrow pattern.

## How to verify

- Load an existing proposal (`/proposal/<token>`) as client: ivory sheet, gold accents, descriptions read full-width, qty stepper still works, sign flow still works.
- Load same proposal as admin (`?edit=true`): edit buttons still appear, edit mode still functions.
- Signed proposal: no checkboxes/stepper, totals match, "Signed" state visible.
- PDF download unchanged.
