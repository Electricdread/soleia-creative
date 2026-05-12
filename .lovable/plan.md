# Remove Creative Direction references + hide proposal deadline pre-sign

## Changes

### 1. `src/components/proposal/ProposalTerms.tsx` — Revisions wording
Change line 29 from:
> "Includes one revision round within the approved creative direction and existing elements."

to:
> "Includes one revision round within the agreed scope and existing elements."

### 2. `src/pages/AdminProposals.tsx` — Default timeline (remove Phase 1)
Drop the `Kickoff Conditions` row from the auto-inserted `proposal_timeline` array (lines 156–161). New default starts with `Content Creation` → `Client Review` → `Revision & Final Delivery` (re-index `sort_order` 0/1/2).

### 3. `src/components/proposal/ProposalGallery.tsx` — Caption
Replace the line 161 disclaimer:
> "These mockups are references for creative direction. The final design is rebuilt and realized for production."

with:
> "These mockups are references only. The final design is rebuilt and realized for production."

### 4. `src/lib/proposalPdfGenerator.ts` — PDF gallery header
Replace line 484:
> "Creative direction references — final designs are rebuilt for production"

with:
> "Reference mockups — final designs are rebuilt for production"

### 5. `src/components/proposal/ProposalView.tsx` — Hide validity notice + countdown until signed
Wrap the entire validity notice block (lines ~478–496, the "This proposal is valid for…" card with the `CountdownBadge`) in `{(signed || isProposalClosed(proposal)) && ( … )}` so it only renders after the proposal is signed or otherwise closed. Pre-call view will no longer show any deadline pressure.

## Out of scope
- No DB migration; existing proposals keep their stored timeline rows. Only newly created proposals use the trimmed default.
- `proposals.validity_days` column stays (used in PDF + post-sign references).
- Email template wording unchanged.

## Files touched
- `src/components/proposal/ProposalTerms.tsx`
- `src/pages/AdminProposals.tsx`
- `src/components/proposal/ProposalGallery.tsx`
- `src/lib/proposalPdfGenerator.ts`
- `src/components/proposal/ProposalView.tsx`
