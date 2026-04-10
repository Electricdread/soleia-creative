

## Plan: Fix Creative Session Media Priority, Thumbnails in Add/Edit Dialog, and Desktop Dialog Width

### Issues Identified

1. **Sort order mismatch**: The client-facing Creative Session page sorts items by `created_at DESC` (newest first, line 135), while the admin sorts by `created_at ASC`. Client-uploaded items via `AddMoodBoardItem` never set `sort_order`, so they appear unpredictably. Both views should use the same ordering: `sort_order ASC`, then `created_at ASC`.

2. **No thumbnail preview when adding/editing files**: The `AddMoodBoardItem` upload tab only shows file names as text. The admin edit panel (`SessionContentManager`) also lacks a preview of the current file. Users should see visual thumbnails of selected/uploaded files.

3. **Dialog too narrow on desktop**: `AddMoodBoardItem` dialog uses `sm:max-w-md` (~28rem), which is cramped on desktop. It should be wider on desktop while remaining unchanged on iPad/mobile.

### Changes

**File 1: `src/pages/CreativeSession.tsx`**
- Fix `fetchItems` sort order: change `created_at` from `descending` to `ascending` to match admin ordering and respect `sort_order` priority.

**File 2: `src/components/creative/AddMoodBoardItem.tsx`**
- Set `sort_order` on newly inserted items (query current max sort_order + 1) so new items appear at the end in priority order.
- Show thumbnail previews of selected files before upload (using `URL.createObjectURL` for images, a film icon for videos, a file icon for PDFs).
- Allow removing individual selected files before uploading.
- Widen dialog: change `sm:max-w-md` to `sm:max-w-lg lg:max-w-2xl` for more room on desktop.
- Reduce vertical padding in the upload drop zone so content fits without scrolling.

**File 3: `src/components/admin/SessionContentManager.tsx`**
- Show a thumbnail preview of the current file in the edit panel (image preview or video poster).

### Technical Details

- Thumbnail generation for selected files uses `URL.createObjectURL()` with cleanup via `URL.revokeObjectURL()`.
- Sort order for new items: query `mood_board_items` for `max(sort_order)` where `session_id` matches, then use `max + 1`.
- The file preview grid in the add dialog will use a responsive grid (`grid-cols-3 sm:grid-cols-4`) with small square thumbnails and an X button to remove each.

