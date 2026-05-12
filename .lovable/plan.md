# Remove auto-summed total from Proposal PDF

## Problem
The downloadable PDF sums every line item into a `TOTAL` row, even though the client hasn't actually selected anything. The on-screen client view only totals *selected* items (live "Quote Total"), so the PDF is misleading.

## Fix
In `src/lib/proposalPdfGenerator.ts`, remove the dark `TOTAL` bar that renders the auto-summed `grandTotal` after the line-item table. The menu of items + per-line prices stays; the bottom-line sum goes away.

The signed-state total (when `proposal.signed_at && proposal.client_signature` exists) is unaffected — that path doesn't render a total either, just the green "Accepted by …" block.

## Files touched
- `src/lib/proposalPdfGenerator.ts` — delete the ~10 lines that draw the TOTAL row and compute `grandTotal`.

## Out of scope
- No change to `ProposalView.tsx` (on-screen client view).
- No change to data model or admin flow.
