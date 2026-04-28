# Migrate Orphaned Originals to Google Drive

## Problem
Supabase `clips` bucket holds 109 files (~5.6 GB) that aren't tracked in `cached_clips`. The current migrator only processes DB-indexed rows, so these orphans never move to Drive and storage stays full.

## Plan

### 1. Edge function: `supabase/functions/migrate-clips-to-drive/index.ts`
Add an `orphans` mode alongside the existing `cached` mode:
- Accept `{ mode: 'cached' | 'orphans', batchSize: number }` (default `cached`, batch 5).
- In `orphans` mode:
  1. List files from `storage.objects` in the `clips` bucket (paged).
  2. For each file: download from Supabase → upload to Drive folder `Soleia Originals/` via the connector gateway (multipart) → on success, delete the Supabase object.
  3. Skip files already present on Drive (match by name) to make it resumable.
  4. Return `{ processed, succeeded, failed, errors[], remaining }`.

### 2. New endpoint: `count-orphans` (inline in same function or new mode)
Add a `mode: 'count'` that returns `{ totalOrphans, totalBytes }` by listing the bucket so the UI can show progress.

### 3. UI: `src/components/admin/StoragePanel.tsx`
- Add "Orphaned Originals" card showing: orphan count, total size, "Migrate Next Batch" button, and "Migrate All" (loops batches until `remaining = 0`).
- Live progress bar + toast per batch.
- Buttons enabled whenever orphan count > 0 (independent of `cached_clips`).

### 4. Safety
- Drive uploads use existing Drive connector (already healthy).
- Delete from Supabase only after Drive upload returns 200 + file ID.
- Log every action to console for debugging via `edge_function_logs`.

## Files
- `supabase/functions/migrate-clips-to-drive/index.ts` (extend)
- `src/components/admin/StoragePanel.tsx` (add orphans section)

## Outcome
You'll be able to open `/admin/storage`, see "109 orphaned files (5.6 GB)", click **Migrate All**, and watch them move to Drive batch by batch, freeing Supabase storage.
