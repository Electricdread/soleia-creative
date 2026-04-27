## Goal
Let you edit / extend client deadlines directly from the **Upcoming Deadlines** panel on `/admin`, without navigating to each module.

## Where editing will live
Inline on each row of the existing `UpcomingDeadlines` panel (top of the admin home). A small **calendar icon button** next to the countdown badge opens a date picker popover. Picking a new date saves immediately and the list re-sorts.

This works for all three deadline sources:
- **Proposals** → updates `proposals.event_date`
- **Creative Sessions** → updates `creative_sessions.event_date`
- **Content Previz / Looks links** → updates `client_links.event_date`

## UX
- Each row gets a `Pencil`/`CalendarDays` icon button (44px touch target on mobile).
- Clicking opens a `Popover` containing the shadcn `Calendar` component with `pointer-events-auto`.
- Quick-extend chips above the calendar: **+3d**, **+7d**, **+14d**, **+30d** for one-tap extensions of the current date.
- On save: optimistic update, toast "Deadline updated", row re-sorts by new urgency.
- The same inline editor appears on rows in `PendingActionsPanel` for proposals/links so you can extend deadlines right where you see them flagged.

## Technical changes

### 1. New component: `src/components/admin/InlineDeadlineEditor.tsx`
- Props: `module: 'proposal' | 'session' | 'link'`, `entityId: string`, `currentDate: string | null`, `onSaved: (newDate: string) => void`
- Renders a `Popover` with `Calendar` + quick-extend buttons.
- Maps `module` to the correct Supabase table for the `update` call.
- Uses `sonner` toast for feedback.

### 2. Update `src/components/admin/UpcomingDeadlines.tsx`
- Add `<InlineDeadlineEditor>` next to each `<CountdownBadge>`.
- Stop the row's parent `<button>` propagation when the editor is clicked (wrap row in `<div>` instead of `<button>`, with a separate "open" affordance).
- After save, update the local `items` state and re-sort.

### 3. Update `src/components/admin/PendingActionsPanel.tsx`
- For `unsigned-proposal` and link rows, add the same inline editor so you can push the deadline forward without leaving the dashboard.

### 4. No DB changes required
RLS already allows authenticated admins to update all three tables (`proposals`, `creative_sessions`, `client_links`).

## Files
- `src/components/admin/InlineDeadlineEditor.tsx` (new)
- `src/components/admin/UpcomingDeadlines.tsx` (edit)
- `src/components/admin/PendingActionsPanel.tsx` (edit)

## Out of scope
- Bulk-editing multiple deadlines at once (can add later if useful).
- Editing the *content asset* deadline stored in `calendar_event_client_info.content_deadline` — that already has its own editor inside the calendar event detail panel. Let me know if you want that surfaced on the dashboard too.