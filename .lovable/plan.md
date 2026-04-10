

## Plan: Fix Preview Thumbnails

### Problem
1. **Admin content list** (`SessionContentManager`): Video items show a generic Film icon instead of a visual thumbnail. The regex on line 82 checks for image extensions but video `thumbnail_url` values may be null (items uploaded before thumbnail extraction was added), and even when set, the Supabase storage URLs may not match the simple extension regex (e.g., URLs with query params).
2. **Add Item dialog** (`AddMoodBoardItem`): Image previews work via `URL.createObjectURL`, but video files show only an icon — no frame preview is generated for the selection grid.

### Changes

**File 1: `src/components/admin/SessionContentManager.tsx`**
- Fix the thumbnail check on line 82: instead of regex-matching extensions, check if `item.thumbnail_url` exists first (always show it as an image), then fall back to checking `file_url` for image types, then show the type icon.
- For video items without a `thumbnail_url`, render a small `<video>` element with `preload="metadata"` to show the first frame as a natural poster.

**File 2: `src/components/creative/AddMoodBoardItem.tsx`**
- Update `filePreviews` useMemo to also generate preview URLs for video files using `URL.createObjectURL`, then render them as `<video>` elements (muted, no controls) instead of only supporting images.
- This gives users a visual preview of selected video files before uploading.

### Technical Details
- Admin thumbnail logic becomes: `thumbnail_url` → render as `<img>` | video type → render `<video preload="metadata">` with `file_url` as src | image type → render `<img>` with `file_url` | fallback → type icon
- Client preview grid: for video files, render `<video src={objectUrl} muted preload="metadata" className="w-full h-full object-cover" />` instead of the Film icon placeholder

