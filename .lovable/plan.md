

## Site-wide delete confirmation

### Problem
The line item trash icon in the proposal editor sits right next to "Save"/"Add"/"From Library" buttons — one mistap deletes a line item with no confirmation. Several other destructive buttons across the app also delete instantly (or use the ugly native `window.confirm`). Need a consistent guard.

### Approach
Reuse the existing `DeleteConfirmDialog` component (already wraps `AlertDialog`) for every destructive action. It already works (used in `LineItemLibrary`, `AdminProposals` proposal-card delete, `ClientLinkManager`, `CreativeSessionCard`).

Wrap each unconfirmed `Trash2` button with `<DeleteConfirmDialog trigger={...} title=... description=... onConfirm={...} />` so a 2-tap confirm modal always appears.

### Buttons to wrap

**Priority (the user's complaint):**
1. `src/pages/AdminProposals.tsx` line ~382 — **line item trash in proposal editor** (sits next to qty/price inputs and save buttons)
2. `src/components/proposal/ProposalView.tsx` line 507 — line item trash in inline editor
3. `src/components/proposal/ProposalGallery.tsx` line ~120 — gallery image delete

**Site-wide cleanup:**
4. `src/components/admin/SessionContentManager.tsx` line 226 — replace native `confirm()` with dialog
5. `src/components/admin/SortableClipCard.tsx` — clip delete (admin gallery)
6. `src/components/admin/ContentPrevizManager.tsx` — preview link delete
7. `src/components/admin/BatchVideoUploader.tsx` — queued upload remove (skip — pre-upload queue removal isn't destructive of saved data)
8. `src/components/creative/MoodBoardItem.tsx` — mood board item delete + comment delete
9. `src/components/calendar/EventAttachments.tsx` — file delete
10. `src/components/calendar/EventTasks.tsx`, `EventNotes.tsx`, `EventMeetingLinks.tsx`, `EventLinkedItems.tsx`, `EventCircleback.tsx` — wrap each Trash button
11. `src/components/creative-guide/ZoneSelectionSummary.tsx` — zone removal (skip if it's a deselect, not a destroy — verify during impl)
12. `src/components/PlacementEditDialog.tsx` — placement clear (verify if destructive vs. reset)

For item 11/12: only wrap if the action hits `supabase.from(...).delete()`. Pure UI deselection (toggle) does not need confirmation.

### Copy convention
- Title: `Delete <thing>?`  (e.g. "Delete line item?", "Delete attachment?", "Delete task?")
- Description: `This will permanently remove "<name or summary>". This action cannot be undone.`
- Confirm button stays the destructive red from `DeleteConfirmDialog`.

### UX detail (mobile)
`DeleteConfirmDialog` already inherits the shared `AlertDialog` — buttons hit ≥44px on mobile. Confirmed compliant with project's mobile-ux 44px rule. No new component needed.

### Out of scope
- Deselecting/unchecking selections (mood board reactions, zone toggles, checkbox state changes) — these are reversible UI state, not deletes.
- Pre-save edit-buffer removals where nothing has been persisted yet (e.g. removing a "new-…" line item before clicking Save). For consistency and the user's stated mistap concern, **we will still confirm these** — the trash icon visually reads the same as a destructive delete, and the user explicitly asked for site-wide confirmation.

### Files
~13 component files touched. No DB/schema changes. No new dependencies.

### QA
- Open a proposal in admin, click Edit Items, tap the trash on a line item → confirm dialog appears, Cancel keeps the item, Delete removes it.
- Repeat for: proposal gallery image, calendar task/note/attachment, mood board item, admin clip card, content previz link, session scene.
- Verify mobile (375px) — buttons have ≥44px tap targets and modal is readable.

