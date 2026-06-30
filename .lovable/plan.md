## Fix: proposal item edits revert after saving

### Root cause
In `src/components/proposal/ProposalView.tsx`, `editItems` is initialized from the `items` prop only once at mount (`useState(items.map(...))`). When the parent reloads after a save (`onRefresh`) and passes fresh `items` down, `editItems` is never re-seeded. The "Edit Items" buttons (lines 648, 659) flip `editingItems` to true without rebuilding `editItems`, so the form shows the stale in-memory snapshot from first mount — which looks like the edits "restored to default."

### Fix
In `src/components/proposal/ProposalView.tsx`:

1. Add a `useEffect` that re-seeds `editItems` from `items` whenever `items` changes **and** `editingItems` is false. This keeps the edit buffer in sync with the latest server data between edit sessions.
2. Update both "Edit Items" buttons (lines 648 & 659) to re-seed `editItems` from current `items` at the moment edit mode is entered, as a belt-and-suspenders guarantee.
3. After `saveItems` succeeds, keep `setEditingItems(false)` + `onRefresh()`; the new effect will repopulate the buffer from the refreshed items.

No schema, RLS, or save-logic changes — the writes themselves are correct (verified RLS policy `Admins can manage proposal items` allows full CRUD for admins).

### Files touched
- `src/components/proposal/ProposalView.tsx` (state sync only)
