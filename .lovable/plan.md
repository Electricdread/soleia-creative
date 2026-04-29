## Problem

When tapping "Browse files" in the Add to Look Book dialog, the iOS file picker opens but most files appear greyed out and unselectable. This happens because the file input uses `accept="video/*"`, which on iOS/iPadOS aggressively filters the Files app to disable anything not recognized as a video — including legitimate video files (like `.mov`, `.mp4` from Drive/Dropbox folders) whose MIME type can't be inferred from extension alone.

The screenshot confirms the user is in iOS Files → Downloads, where `.mp3`, `.pdf`, `.numbers`, etc. are correctly disabled, but on iPad this restriction also frequently disables real video files when their UTI isn't detected.

## Fix

Loosen the file input's accept filter so iOS doesn't pre-filter the picker, then validate the chosen files in JS (which already happens — the existing handler rejects non-video files with a toast).

### Changes to `src/components/admin/lookbook/AddLookMediaDialog.tsx`

1. Change the `<input>` accept attribute from `accept="video/*"` to an explicit list of common video extensions plus the wildcard, so iOS Files presents all matching files as enabled:
   ```tsx
   accept="video/*,.mp4,.mov,.webm,.m4v,.mkv,.avi"
   ```
2. Keep the existing JS-side validation in `handleFiles` that rejects non-video files (`!f.type.startsWith('video/')`) — but make it more lenient by also accepting files whose extension matches a known video extension when the browser-reported MIME type is empty (common on iOS for `.mov`).
3. Update the helper text under the dropzone to mention supported formats explicitly: "MP4, MOV, WebM, M4V — up to 500 MB each".

### Why this works

- `accept="video/*"` on iOS uses UTI matching that's stricter than desktop browsers. Adding explicit extensions tells iOS Files to enable any file with those extensions regardless of UTI detection.
- The defensive JS validation ensures non-video files still can't sneak through if the user manually picks one.

## Files to modify

- `src/components/admin/lookbook/AddLookMediaDialog.tsx` — relax `accept`, add extension-based fallback in `handleFiles`, update helper text.

No database, RLS, or other component changes needed.
