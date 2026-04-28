The migration is still failing because the current function still downloads each storage object into a `Blob` before uploading it to Drive. Even though the Drive upload side is streamed, `storage.download()` buffers the original video in the function first, so 100–190 MB clips can still exceed the function memory limit. The failing requests are returning status `546 WORKER_RESOURCE_LIMIT`.

Plan:

1. Replace buffered storage downloads with signed URL streaming
   - In `migrate-clips-to-drive`, stop using `admin.storage.from('clips').download(...)` for migration.
   - Use `createSignedUrl(...)` to generate a temporary storage URL.
   - `fetch()` that signed URL and pass `response.body` directly into the Drive upload request.
   - This avoids creating a full in-memory `Blob` for each video.

2. Update Drive upload helper to accept streams
   - Change `uploadStreamToDrive(...)` from `Blob` input to a `ReadableStream` plus `sizeBytes` and `mimeType`.
   - Keep Google Drive resumable upload, but send the storage response stream as the PUT body.
   - Remove or heavily restrict the media-upload fallback, because it can hide the real failure and may still be resource-heavy.

3. Lower the automatic safety threshold
   - Reduce the auto-migration file limit from 200 MB to a safer value, likely 100 MB.
   - The database currently shows 20 files over 100 MB and 9 files over 200 MB, so this will prevent repeated crashes while still migrating the smaller bulk safely.
   - Oversized files will be marked as skipped with clear manual-download instructions.

4. Sort migration by smallest files first
   - For orphaned files, list a window of files, sort by `metadata.size` ascending, and migrate the smallest safe files first.
   - This prevents the migration from repeatedly starting on large early filenames such as the Gold/SKY-SPACE clips.

5. Make the UI error more useful
   - Surface `WORKER_RESOURCE_LIMIT` as “file too large / migration exceeded compute limits” instead of only “Edge Function returned a non-2xx status code.”
   - Continue showing skipped/failed files and direct bucket download links for manual Drive upload.
   - Adjust “Migrate all orphans” to stop gracefully once only oversized files remain.

6. Deploy and test the function
   - Deploy the updated `migrate-clips-to-drive` function.
   - Test `mode: count` and a single orphan batch.
   - Confirm it either migrates a small file successfully or returns a clean skipped-file response instead of a 546 compute-limit crash.

Technical details:

```text
Before:
Storage object -> storage.download() -> full Blob in Edge Function memory -> blob.stream() -> Drive

After:
Storage object -> signed URL -> fetch Response.body stream -> Drive resumable upload
```

Files to update:
- `supabase/functions/migrate-clips-to-drive/index.ts`
- `src/components/admin/StoragePanel.tsx`

After this, the remaining very large originals may still need manual upload to Drive, but the automated migration should no longer crash on the first large clip.