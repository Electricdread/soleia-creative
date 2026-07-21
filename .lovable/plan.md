
## Goal

Update the **9.23.26 Whatnot** proposal so its line items match the current `/rate-card` exactly (titles, descriptions, prices).

## Current diffs (Whatnot vs Rate Card)

| Line item | Whatnot now | Rate card | Change |
|---|---|---|---|
| Immersive LED Environments & Branded Overlay Design | **$4,000** | $3,000 (starting at) | Lower price to $3,000 |
| Individual dedicated Cabana / Bungalow Logo | $300 | "Individual Cabana / Bungalow Logo" $300 | Rename |
| Elevator Static Logo (content to spec provided by client) | $350 | "Elevator Static Logo" $350 | Rename (shorter title, desc moves to description field) |
| Outside Arch Specific Video (content to spec provided by client.) | $500 | "Outside Arch Specific Video" $500 | Rename |
| 3D Web Previz - Up to 4 mapped files | $350 | "3D Previz" $350 | Rename |
| All other add-ons + video mapping fees | match | match | No change |

Also refresh each item's `description` field to match the rate card copy (e.g. "Individual logo in a dedicated cabana or bungalow, up to 24.", the full 3D Previz walkthrough paragraph, revision-fee notes on mapping tiers, etc.).

## Plan

1. Run a single SQL update against `proposal_items` scoped to proposal id `0cc84505-acd7-4f5f-837d-713bee290365` to:
   - Set package price to `3000`.
   - Rename the 4 items above to their rate-card titles.
   - Overwrite each item's `description` with the rate-card copy.
2. Leave quantities (`1 × Unit`), sort_order, and `client_selected` untouched — only titles/prices/descriptions change.
3. Do **not** touch `line_item_templates` or any other proposal.

## Verification

- Re-select the Whatnot proposal_items and confirm titles/prices match the rate card table in `src/pages/RateCard.tsx`.
- You open the Whatnot proposal in preview to visually confirm before publishing.

## Not in scope

- No code changes.
- No changes to other proposals.
- Not resetting the signature or status (proposal stays `sent`).
