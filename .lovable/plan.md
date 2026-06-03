## Goal

Overhaul the client proposal so it cleanly reflects the real sales workflow: what the venue contract already covers, which scenario the client is in, and what Soleia is adding on top. Also fill the missing Scenario 2 email and refresh the proposal page + PDF look.

## Current state (verified)

- `proposals.is_pre_call_packet` exists (boolean toggle).
- `generate-session-email` already branches on that boolean, but the "off" path is a stripped Scenario 1 — not a real Scenario 2 email.
- Proposal page (`ProposalView.tsx`) and PDF (`proposalPdfGenerator.ts`) have no "what's in your venue contract" header.
- No Scenario 2 line-item preset.

## Workflow recap

- **Scenario 1 — Pre-Call Packet:** sales hands off → I send Pre-Call Packet → creative call → proposal signed. (Already exists.)
- **Scenario 2 — Pre-Packet, No Creative Call:** sales hands off → I send Pre-Packet (NEW email) → client supplies their own already-mapped content → I load/QC it and add any extras (dynamic elevator, etc.).
- **Venue contract baseline (always true):** up to 10 static logos on LED screens + 1 static logo across all TVs, Cabanas, and Bungalows.

## Plan

### 1. Scenario field (DB)

Add `proposal_scenario` text column on `proposals` with values:

- `pre_call_packet` — Scenario 1 (default for existing rows where `is_pre_call_packet = true`)
- `pre_packet_no_call` — Scenario 2 (default for existing rows where `is_pre_call_packet = false`)
- `direct_quote` — plain quote, no packet

`is_pre_call_packet` stays as-is for back-compat; all new code reads `proposal_scenario`.

### 2. Contract Inclusions Header

New shared component `ProposalContractInclusions.tsx` — always rendered above the line items on every proposal:

> **Included in your venue contract**
> • Up to 10 static logos — LED screens
> • 1 static logo — all TVs, Cabanas & Bungalows
> *Standard inclusions — no charge*

Gold left-border accent, dark headline, matches the Creative Director Notes / Asset Due Date pattern. Copy lives in one file, easy to edit.

Mirrored in `proposalPdfGenerator.ts` as a dark band with gold accent placed above the scope table. The scope-table header changes to "Additional Services" so the distinction is obvious.

### 3. Scenario picker in admin

In `AdminProposals.tsx`:

- Replace the current pre-call switch with a 3-option scenario selector (chips or dropdown) on both the new-proposal form and the existing list row.
- Selecting `pre_packet_no_call` exposes a "Load Scenario 2 defaults" button that inserts the line item **Mapped to Spec by Client** (pulled from `line_item_templates` if it exists, otherwise created inline) — admin can then edit/add freely.
- Mail subject + plain-text body switch on scenario.

### 4. Scenario 2 email

New branch in `supabase/functions/generate-session-email/index.ts` for `pre_packet_no_call`:

- Subject: `Pre-Packet: {event} — {client}`
- Headline: "Your Pre-Packet"
- Body emphasizes: review the menu, send us your already-mapped content (links to existing Content Delivery Guide for DXV3 spec), we handle loading/QC and any add-on services you approve.
- CTA: "Open Proposal & Menu" only — no creative-call CTA, no calendar link.
- Replaces the "Schedule Our Creative Call" block with a "Send Us Your Content" block.

Mirror in `AdminProposals.tsx` `buildPlainTextEmail` / `openInMailApp`.

### 5. Proposal page UI refresh (scoped, low-risk)

`ProposalView.tsx`:

- Header gets a small gold uppercase **scenario chip** (Pre-Call Packet / Pre-Packet / Quote) next to the event name.
- New section order: Header → Scenario Chip → **Contract Inclusions banner** → Cover Gallery → Scope (line items, now titled "Additional Services") → Timeline → Terms → Signature.
- Tighten spacing, replace flat white cards with gold-accented dividers consistent with the rest of the app.
- Pre-Call Resources block only renders when scenario = `pre_call_packet`. For `pre_packet_no_call` it's replaced with a "Send Us Your Content" panel linking to the Content Delivery Guide.
- All existing logic (selection, qty, signing, drive folder creation) stays intact.

### 6. PDF refresh

`proposalPdfGenerator.ts`:

- Cover subtitle reads the scenario label.
- Contract Inclusions band on the scope page above the line-item table.
- Scope-table header becomes "Additional Services".

### 7. Memory

Save: scenario model, contract-inclusions wording, Scenario 2 default line items.

## Files

- `supabase/migrations/...` — add `proposal_scenario` text column + backfill from `is_pre_call_packet`
- `src/components/proposal/ProposalContractInclusions.tsx` (new)
- `src/components/proposal/ProposalView.tsx` — scenario chip, inclusions banner, scenario-aware resources panel, section order
- `src/lib/proposalPdfGenerator.ts` — inclusions band + scenario subtitle + "Additional Services" header
- `supabase/functions/generate-session-email/index.ts` — new `pre_packet_no_call` template
- `src/pages/AdminProposals.tsx` — scenario selector replaces toggle, "Load Scenario 2 defaults" button, updated mail subject/body
- `src/components/admin/ProposalEmailCard.tsx` — scenario-aware copy
- `mem://features/client-proposal/proposal-scenarios` (new memory)

## Out of scope

- No changes to signing, drive-folder creation, line-item library schema, or pricing logic.
- No editable-per-proposal inclusions (hard-coded copy by design).
