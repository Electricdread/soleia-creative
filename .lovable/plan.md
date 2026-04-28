## Problem

All 20 remaining orphans are 100–250 MB and exceed the safety threshold, so the function correctly skips them — but nothing migrates. The previous OOM crashes happened because we buffered the file. Now we stream end-to-end, so the 100 MB cap is overly conservative.

We need to:
1. Raise the cap so streaming can actually do its job.
2. Add a true background-job path for the few giants that still won't fit in a single request window (Supabase edge functions still have a wall-clock and CPU-time limit, separate from memory).

## Plan

### 1. Raise the streaming threshold

In `supabase/functions/migrate-clips-to-drive/index.ts`:

- Bump `MAX_FILE_BYTES` from **100 MB → 500 MB**. Streaming uses near-zero RAM, so the previous 100 MB limit was a guess from when we still buffered.
- Keep batch size for `orphans` mode at **1** (one big upload per invocation) to stay well inside CPU/wall-time limits.
- Keep size-ascending sort so smaller files clear first.

### 2. Better progress reporting in the loop

In `src/components/admin/StoragePanel.tsx`:

- "Migrate all orphans" loop currently bails when only skipped files remain. Update it to keep going as long as `succeeded > 0` per batch, and only stop when a batch returns `succeeded: 0 && all-failed-are-skipped`.
- Show per-file size in the results row (e.g., `134 MB`) so it's obvious why one took longer.
- When a non-skipped failure happens (real error), surface the actual error message verbatim instead of the generic "non-2xx" string.

### 3. Safety net for true giants (>500 MB)

For the handful of clips above the new cap (the 250 MB+ files):

- Keep the existing "Download from bucket" manual flow for anything over 500 MB.
- Add a one-line note in the UI: *"Files over 500 MB must be migrated manually via the bucket link."*

### 4. Deploy and verify

- Deploy `migrate-clips-to-drive`.
- Trigger one orphan batch from the UI on a ~110 MB file and confirm success.
- Then run "Migrate all orphans" to drain the queue down to only true giants (if any).

## Files

- `supabase/functions/migrate-clips-to-drive/index.ts` — raise threshold, ensure batch=1
- `src/components/admin/StoragePanel.tsx` — improve loop continuation, show sizes, surface real errors

## Why this should work

The original 100 MB cap was set defensively when we were still loading files into memory. With the current signed-URL → fetch → Drive PUT pipeline, the function only holds a few KB of stream chunks at a time. Edge functions handle multi-hundred-MB streamed transfers fine as long as the wall-clock stays under the limit, which a single ~130 MB upload comfortably does.