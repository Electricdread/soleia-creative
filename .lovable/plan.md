# Remove "Quote Date" from proposal

The proposal isn't a quote, so the "Quote Date" line shouldn't appear.

## Changes

1. **`src/components/proposal/ProposalView.tsx`** — remove the "Quote Date" block (lines 448–451) in the header meta column. Event Date stays.
2. **`src/lib/proposalPdfGenerator.ts`** — remove the `Quote Date: … | Valid for N days` line under the event title (lines 249–250) and the now-unused `quoteDate` const.
3. **`src/components/proposal/ProposalView.tsx`** (line 827) — rename the client-facing label `Quote Total` → `Total` so the wording is consistent with "not a quote". Admin label already says `Total`.

## Out of scope
- No DB schema change — `quote_date` column stays (still used internally for `expiryDate` calc in the on-screen view).
