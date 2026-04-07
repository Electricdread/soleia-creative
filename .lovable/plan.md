

## Plan: Add Decline Button to Creative Session Items

### What We're Building
A "Decline" button next to the existing "Approve" button on each mood board item. Uses the existing `mood_board_reactions` table with a new `reaction_type` of `'decline'` — no database changes needed.

### Behavior
- Clicking "Decline" inserts a reaction with `reaction_type: 'decline'` (togglable, same as approve)
- Approving removes any existing decline, and vice versa — they are mutually exclusive
- Declined items show a red-tinted border (`border-destructive/50`) instead of the green/primary border for approved
- Decline count shown next to the button (e.g. "2 declined")

### Changes to `src/components/creative/MoodBoardItem.tsx`

1. **Add `XCircle` to lucide imports** for the decline icon
2. **Add decline state logic** — derive `hasDeclined` and `declineCount` from reactions with `reaction_type === 'decline'`
3. **Add `toggleDecline` function** — mirrors `toggleLike` but uses `'decline'` reaction type; also removes any existing `'love'` reaction by the same user (mutual exclusivity)
4. **Update `toggleLike`** — also remove any existing `'decline'` reaction when approving
5. **Update card border class** — add declined state: `hasDeclined ? 'border-destructive/50 bg-destructive/5' : ...`
6. **Add Decline button** in the action row next to Approve, styled with `text-destructive` when active

