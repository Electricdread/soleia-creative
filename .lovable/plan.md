## Goal

For Scenario 2 (`pre_packet_no_call`), make the **Mapped to Spec by Client** line item unmistakably the headline item: pinned at the top of the proposal, pre-ticked, and visually distinct from the rest of the menu. While we're in there, tighten the overall proposal page layout so the hierarchy reads cleanly on the client side.

## What's wrong today

- `seedScenarioTwoDefaults` inserts "Mapped to Spec by Client" with `sort_order = existing.length` → it lands at the **bottom** of the list.
- Nothing pre-selects it for the client, so they open the proposal and see an unticked item with the same weight as every other add-on. Easy to miss, easy to forget to check.
- The line-items section is a single flat table — no separation between "the core thing you're paying for" and "optional add-ons".
- The scenario banner + contract inclusions + resources stack as three similar cream-colored cards in a row → muddy hierarchy.

## Changes

### 1. Pin Mapped-to-Spec to the top (data)

In `seedScenarioTwoDefaults` (`AdminProposals.tsx`):

- Before inserting, bump every existing item's `sort_order` by 1 (`update proposal_items set sort_order = sort_order + 1 where proposal_id = ...`).
- Insert the new item with `sort_order = 0`.
- Result: always first in any sorted query, no client-side reshuffle needed.

For proposals that already have it seeded at the bottom, the same handler can be reused via a small "Pin to top" pass (detect existing row, move it to `sort_order = 0`, shift others). Cheap and idempotent.

### 2. Pre-tick + lock visual on the client (ProposalView)

In `ProposalView.tsx`:

- Add a helper `isMappedToSpec(item)` → matches title `/^mapped to spec by client/i`.
- On mount, if `resolveScenario(proposal) === 'pre_packet_no_call'` and an item matches, seed `selectedIds` with its id so the client sees it already ticked.
- Render that single item **above** the regular table as a dedicated **"Included Service"** card:
  - Gold left border, soft cream background (matches contract-inclusions banner style).
  - Heading: `INCLUDED IN THIS PROPOSAL`
  - Title + description from the row.
  - Right side: small "Selected ✓" pill (read-only on client; checkbox stays interactive so they *could* untick, but defaults to ticked).
  - Price shown the same way as table rows.
- The rest of the line items render in the existing table below, under a section label **"Optional Add-On Services"** instead of just sitting raw under the contract-inclusions banner.

For non-Scenario-2 proposals, this card simply isn't rendered and the table behaves exactly as today.

### 3. Layout tightening (scoped, no logic changes)

`ProposalView.tsx` main column reorder + spacing:

```text
Header (logo + PDF) 
   ↓ mb-12
Scenario chip + Event title + client + countdown
   ↓ mb-10
Contract Inclusions  (neutral cream, gold accent)
   ↓ mb-4
Scenario banner       (collapses into a single slim strip — same gold accent)
   ↓ mb-10
[Scenario 2 only] "Included Service" pinned card
   ↓ mb-3
Section label: "Optional Add-On Services"  /  for other scenarios: "Additional Services"
Line items table
   ↓ mb-12
Pre-Call / Pre-Packet resources panel  (moved below items so the menu reads first)
   ↓ Timeline → Terms → Signature
```

Visual nudges (all CSS, no structural rewrites):

- Tighter card paddings (`p-5` → `p-4`) on banners; bigger gap between **sections** (`mb-10`+) so groups breathe.
- Section labels above the table get the same `text-[10px] tracking-[0.25em] uppercase text-[#c49a3c]` treatment as the scenario chip → consistent typographic rhythm.
- Move the resources panel (Pre-Call/Pre-Packet) **below** the line items. Right now it sits above the menu and pushes pricing below the fold; clients should see what they're choosing first, then the supporting links.

### 4. PDF mirror (light touch)

`proposalPdfGenerator.ts`: when the proposal is `pre_packet_no_call` and a "Mapped to Spec by Client" row exists, render it as a small dark band labeled **Included Service** above the Additional Services table — same idea as the on-screen card, just typographic. No new sections, no layout rewrite.

## Out of scope

- No schema changes (sort_order already exists).
- No changes to signing flow, totals math, or scenario detection logic.
- No edits to the Pre-Call scenario's content — purely Scenario 2 + shared layout polish.
- No PDF redesign beyond the small Included Service band.

## Files touched

- `src/pages/AdminProposals.tsx` — bump sort_order on seed; add idempotent "move to top" if row exists.
- `src/components/proposal/ProposalView.tsx` — pre-tick, pinned card, section labels, reorder, spacing.
- `src/lib/proposalPdfGenerator.ts` — Included Service band for Scenario 2.
