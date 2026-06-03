## Goal

Rewrite line item descriptions across the library and the Scenario 2 seeded item so they are short, direct, and skimmable — no marketing tone, no parenthetical asides mid-sentence.

## Scope

Two places hold these strings:

1. `line_item_templates` table (9 rows) — used by the admin picker and seeded into proposals.
2. `seedScenarioTwoDefaults` in `src/pages/AdminProposals.tsx` (the pinned "Mapped to Spec by Client" item).

No UI/layout changes. No schema changes. Existing already-inserted `proposal_items` are left alone (clients see what was sent); only templates and future seeds change.

## Proposed rewrites

| Title | New description |
|---|---|
| Immersive LED Environments & Branded Overlay Design | 1–3 transparent logo animations and 1–3 background animations, designed to your mood board and brand. Includes 1 revision. |
| Additional Transparent Logo Animation | One extra transparent logo animation. |
| Elevator Dynamic Animation | Three deliverables: static idle image, ride-up animation, ride-down animation. |
| Individual dedicated Cabana / Bungalow Logo | One logo placed in a dedicated cabana or bungalow (up to 24). |
| Elevator Static Logo (content to spec provided by client) | Static elevator logo. Client provides content to spec. |
| Mapped by Soleia Creative Team | Soleia maps your animations to venue spec. Max 50 GB. Post-delivery revisions, re-exports, or new files are billed separately. |
| Mapped to spec by Client | Client maps content to spec and delivers final files. No edits by Soleia. Max 50 GB. Post-delivery revisions are billed separately. |
| Outside Arch Specific Video (content to spec provided by client.) | Outside arch video. Client provides content to spec. |
| Performing Artist - Mapped by Soleia Creative Team | Performing artist content mapped to venue spec by Soleia. |

And in `seedScenarioTwoDefaults` (currently: *"Client-provided content is already mapped to venue spec. Soleia handles loading, QC, and playback on our servers and screens."*):

> **New:** Your content is already mapped to spec. Soleia loads, QCs, and plays it back on our servers and screens.

## Implementation

- One Supabase migration: `UPDATE line_item_templates SET description = ... WHERE title = ...` for each of the 9 rows (matched by exact title so re-runs are safe).
- One edit in `src/pages/AdminProposals.tsx` line 276 to update the seeded description string.

## Out of scope

- Titles stay as-is (changing them would break the Scenario 2 pin-to-top matcher and any references in the PDF generator).
- No edits to existing `proposal_items` rows already attached to live proposals.
- No visual/layout changes.
