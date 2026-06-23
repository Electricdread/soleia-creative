## Goal
Remove the browser re-encoding step from the Session Previz Clips upload so already web-optimized files are uploaded as-is.

## Changes
**`src/components/admin/SessionPrevizClipsManager.tsx`**
- Remove the `reencodePrevizForPlayback` import and its entire try/catch block in `handlePick`.
- Upload the original `File` directly via `uploadPrevizFile(file, ...)` with no renaming or repackaging (no `.previz.mp4/webm` suffix).
- Simplify progress: a single "Uploading previz…" stage going 10% → 100%.
- Update button label from "Optimizing…" to "Uploading…" and adjust the helper copy to reflect "uploaded as-is, no re-encoding".

**`src/lib/previzCompressor.ts`**
- Delete the file (no other references after the change above).

## Out of scope
- No backend, bucket, schema, or playback-side changes.
- Existing already-uploaded `.previz.*` clips remain playable (unchanged URLs).
