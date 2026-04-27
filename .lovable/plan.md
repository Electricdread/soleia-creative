## Issue

The Sandler Partners proposal is showing as "12 days overdue" on the admin dashboard even though it's already signed.

DB confirms the row: `status: 'sent'`, but `signed_at: 2026-04-25 06:13:50` is populated — so it IS signed, the status column just wasn't bumped to `'signed'`. The deadline UI currently filters only by `is_active = true` and event_date, with no awareness of completion state.

## Root Cause

Three surfaces compute deadlines without checking whether work is actually done:

1. **`src/components/admin/UpcomingDeadlines.tsx`** — pulls all active proposals/sessions/links with a past or near event_date.
2. **`src/hooks/useDeadlineCount.tsx`** — same logic, drives the `(N)` browser tab title prefix.
3. **`src/components/proposal/ProposalView.tsx`** — renders the red "Event: 12d overdue" badge on the proposal page itself, regardless of `signed_at` / `status`.

A proposal is effectively "done" when `signed_at IS NOT NULL` OR `status IN ('signed','accepted','closed','won','invoiced')`. Today neither check exists.

## Plan

### 1. `UpcomingDeadlines.tsx`
- Select `signed_at` and `status` from `proposals`; filter out rows where `signed_at` is set or status is one of `signed | accepted | closed | won | invoiced`.
- For `creative_sessions`, exclude rows where `is_active = false` (already done) — no extra completion column exists, so active+future is the right scope.
- For `client_links`, same: rely on `is_active`. (No "completed" flag exists; if the user wants one later we can add it.)
- Keep current sort and 30-day horizon.

### 2. `useDeadlineCount.tsx`
- Mirror the same proposals filter so the browser tab `(N)` count drops Sandler Partners and any other signed proposals.

### 3. `ProposalView.tsx`
- Hide the red "Event: Xd overdue" header badge when `proposal.signed_at` is set or status is in the completed set. Replace it with a subtle green "Signed" pill (or just hide it) so the page no longer screams overdue on a closed deal.
- Also hide the "Quote expires" badge in the validity banner when signed — quote validity is moot once countersigned.

### 4. Shared helper
- Add a small `isProposalClosed(p)` helper in `src/lib/utils.ts` (or a new `src/lib/proposalStatus.ts`) so all three call sites use the same definition. Closed = `!!signed_at || ['signed','accepted','closed','won','invoiced'].includes(status)`.

### Files to modify
- `src/lib/proposalStatus.ts` (new, ~10 lines)
- `src/components/admin/UpcomingDeadlines.tsx`
- `src/hooks/useDeadlineCount.tsx`
- `src/components/proposal/ProposalView.tsx`

### Out of scope (flag for later)
- Bumping `status` to `'signed'` automatically when `signed_at` is written — currently the signing flow only sets `signed_at`, leaving `status='sent'`. Worth fixing in a follow-up so other UIs (status badges, filters) align.
- Adding a "completed" flag to `creative_sessions` / `client_links` if you want to mark those as done independently of the event date.