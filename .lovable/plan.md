# Fix Creative Session Media Ordering on Upload

## Problem
When admins upload multiple media files into a Creative Session via **Session Content Manager**, the new items don't appear in the order they were added (or at the end of the list). They show up in random/unstable order, and prioritization via drag-and-drop gets disrupted.

## Root Cause
In `src/components/admin/SessionContentManager.tsx` (`handleFileUpload`), the `sort_order` is computed **once** outside the upload loop:

```ts
const nextOrder = items.length;  // ← same value used for every file
for (const file of files) {
  await supabase.from('mood_board_items').insert({ ..., sort_order: nextOrder });
}
```

Result: every file in the batch is inserted with the **same** `sort_order`, so the secondary `created_at` sort decides order — and because uploads complete out-of-sequence (especially videos), the visible order becomes unpredictable.

There's also a secondary issue: `items.length` ignores existing `sort_order` values that may be higher (after prior drag-reorders), so new items can collide with existing ones.

The sibling component `AddMoodBoardItem` already does this correctly using a `getNextSortOrder()` helper (max+1) and incrementing per file.

## Fix

In `src/components/admin/SessionContentManager.tsx`:

1. Add a `getNextSortOrder(sessionId)` helper (mirror of the one in `AddMoodBoardItem.tsx`) that queries the current max `sort_order` for the session.
2. In `handleFileUpload`:
   - Call `getNextSortOrder` once before the loop to get the starting index.
   - Use a local `let sortOrder = startingIndex;` and increment **inside** the loop (`sortOrder++`) after each insert.
3. Keep the existing fetch ordering (`sort_order ASC, created_at ASC`) — no change needed.

## Files Modified
- `src/components/admin/SessionContentManager.tsx` — fix per-file `sort_order` assignment in `handleFileUpload`

## Verification
After fix:
- Uploading 5 files in one batch → they appear at the end of the list in the order picked.
- Existing drag-prioritized items stay at the top; new items are appended below.
- No collisions with previously reordered items.
