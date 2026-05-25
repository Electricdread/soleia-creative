## Goal
Make the Edit Session dialog (Details + Content tabs) more comfortable to work in — no more horizontal scrollbar, easier inline editing, and a cleaner content list.

## Problems today
- Dialog is `sm:max-w-xl` (~576px). On the Content tab, rows + action buttons overflow horizontally → page-wide scrollbar visible in screenshot.
- Edit Item panel renders *above* the file list, so editing a row pushes the list off-screen and you lose context of what you're editing.
- Tall content list (21+ items) inside a fixed `max-h-[400px]` is cramped; no sticky header for Add Files / item count.
- Edit Item form is inline (not a modal) — fine, but hidden when you scroll the list.

## Changes

### 1. `src/components/admin/CreativeSessionCard.tsx` — dialog sizing
- Change `DialogContent` from `sm:max-w-xl` to a responsive wider shell: `sm:max-w-2xl lg:max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0`.
- Wrap header in `px-6 pt-6` and Tabs body in `flex-1 overflow-y-auto px-6 pb-6` so the dialog itself scrolls vertically (no horizontal scroll).

### 2. `src/components/admin/SessionContentManager.tsx` — content tab UX
- Make the row container constrain width: add `w-full min-w-0` on the outer wrapper and on each `SortableContentRow` so titles truncate instead of forcing horizontal overflow.
- Sticky toolbar: wrap "Add Files" + item count in a `sticky top-0 bg-background/95 backdrop-blur z-10 py-2` strip so it stays visible while scrolling the list.
- Replace the inline Edit Item panel with a small **dialog/modal** (`Dialog` from shadcn) that opens when clicking the pencil icon. Same fields (thumbnail preview, Title, Description, Scene), same save/cancel buttons. Keeps the list intact and gives more room for the textarea.
- Increase list height to `max-h-[55vh]` (was `400px`) so more items are visible in the wider dialog.
- Add `min-w-0` / `truncate` fixes on the row's middle text column to prevent long titles from pushing action buttons out.

### 3. Out of scope
- No changes to upload pipeline, scenes logic, sort_order behavior, or Details/Delivery tab fields.
- No changes to data model or edge functions.

## Result
- Wider, vertically-scrolling dialog with no horizontal scrollbar.
- Sticky Add Files control + item count always visible.
- Editing an item opens a focused modal instead of pushing the list down.
- Long titles truncate cleanly.
