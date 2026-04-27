I’ll fix the Sandler Partners proposal page so signed/accepted proposals never show the red “Event overdue” badge.

Implementation plan:

1. Update the proposal “closed” detection
   - Make the signed/closed state use both the live `signed` state and the proposal database fields.
   - Treat a proposal as closed when:
     - `signed_at` exists, or
     - local `signed` state is true after signing, or
     - `status` is `signed`, `accepted`, `closed`, `won`, or `invoiced`.

2. Remove the overdue badge for closed proposals
   - In `ProposalView.tsx`, replace the current header badge logic so closed proposals show only the green “Signed / Ready for invoice” state.
   - The red `CountdownBadge` for `Event overdue` will not render for Sandler Partners or any other signed proposal.

3. Hide quote expiry warning for closed proposals
   - Ensure the orange “Quote expires” badge is also hidden once the proposal is signed/accepted/closed.

4. Verify related dashboard logic remains consistent
   - Confirm the existing shared helper continues excluding closed proposals from admin deadline counts and upcoming-deadline lists.

Technical details:

- Main file to change: `src/components/proposal/ProposalView.tsx`
- Existing helper: `src/lib/proposalStatus.ts`
- No database schema change is needed.
- No client-facing image/upload changes are needed; the uploaded screenshot is used as reference only.