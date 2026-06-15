# Fix: Signed proposal includes unselected line items

## Problem
When a client signs, we only persist the signature + quantity tweaks. We never record *which* items they selected, so:
- The signed view falls back to `grandTotal` (all items) — currently $10,000 instead of the selected subset.
- The downloaded PDF re-fetches every `proposal_items` row and totals them all.
- Admins reviewing the signed proposal can't see what the client actually agreed to.

## Solution
Track the client's selection on each line item and treat unselected items as not part of the accepted scope after signing.

### 1. Database
- Add `client_selected boolean not null default true` to `public.proposal_items`.
- Update `public.sign_proposal_by_token` to accept a new `p_selected_ids uuid[]` argument:
  - For the signed proposal, set `client_selected = true` where `id = ANY(p_selected_ids)`, else `false`.
  - Keep existing quantity-adjustment + signature/status behavior.

### 2. Client signing (`src/components/proposal/ProposalView.tsx`)
- Pass `p_selected_ids: Array.from(selectedIds)` into the `sign_proposal_by_token` RPC call.
- After signing, treat `proposal.signed_at` as authoritative: derive the "selected" set from `items.filter(i => i.client_selected)` instead of the in-memory `selectedIds`.
- Change `displayedTotal` so that **signed** proposals show the sum of `client_selected` items only (admins still see the full grand total for reference, but the client-facing total/section labels reflect the accepted scope).
- In the line-item table, when signed, hide (or visually strike through + mark "Not selected") items where `client_selected = false` for the client view; keep them visible for admins with a muted "Not selected" badge.

### 3. PDF (`src/lib/proposalPdfGenerator.ts`)
- In `generateProposalPdf`, when `proposal.signed_at` is set, filter `items` to those with `client_selected !== false` before computing `proposalTotal`, before rendering the cover-page total, the contract inclusions block, and the additional-services table.
- Unsigned proposals keep current behavior (show full scope).

### 4. Backfill / repair for the affected proposal
The proposal that already shows $10,000 was signed before this column existed, so every row defaults to `client_selected = true`. I'll need to know which items the client actually picked to correct it.

```text
                ┌─────────────────────────┐
   Client signs │ selectedIds: [a, c]     │
                └────────────┬────────────┘
                             ▼
          sign_proposal_by_token(token, sig, qtys, selected_ids)
                             ▼
   proposal_items:  a.client_selected=true
                    b.client_selected=false
                    c.client_selected=true
                             ▼
         ProposalView (signed)  +  PDF generator
         → totals + tables exclude b
```

## Open question before I implement
Which proposal is the $10,000 one (URL or event name), and do you know the IDs/titles of the line items the client actually selected? I'll backfill `client_selected` for that proposal so the displayed/signed total matches what they accepted.
