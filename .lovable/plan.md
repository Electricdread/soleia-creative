# Replace "Asset Uploads" with "Client Uploads" on the dashboard

Swap the existing **Asset Uploads** tile in `DashboardStatusGrid.tsx` for a new **Client Uploads** tile sourced from the `drive_seen_files` table (populated by the `drive-upload-watcher` edge function). Clicking the card triggers an immediate Drive scan and refreshes the count — no navigation.

## What the card shows

- **Primary stat**: count of `drive_seen_files` rows with `created_at >= now() - 7 days` ("new this week").
- **Sub-stats**:
  - `all-time` — total rows in `drive_seen_files`.
  - `last scan` — relative time of the most recent `created_at` (e.g. "12m ago", or "—" if none).
- **Icon / tone**: keep purple accent + `Upload` icon for visual continuity (or switch to `CloudDownload` — purple stays).
- **Title**: "Client Uploads".

## Click behavior

Replace the `navigate(href)` action with an inline async handler:

1. Set a local `scanning` state → spinner overlay on the icon, card disables.
2. Invoke the `drive-upload-watcher` edge function via `supabase.functions.invoke('drive-upload-watcher')`.
3. On success: toast `"Scan complete — N new file(s)"` (using the function's return payload if available, else re-query the table) and re-run the existing `load()` to refresh counts.
4. On error: toast `"Scan failed"` with the error message.

Other cards keep their normal navigate-on-click behavior — the click-to-scan pattern is unique to this tile (cards array gains an optional `onClick` that overrides `href`).

## Realtime

Add `drive_seen_files` to the existing realtime subscription in `DashboardStatusGrid` so counts update automatically when the cron-driven watcher fires between manual scans.

## Files touched

- `src/components/admin/DashboardStatusGrid.tsx` — only file changed.
  - Drop `uploadsTotal` / `uploadsWeek` from `Stats` / `ZERO` / `load()`; replace with `driveTotal`, `driveWeek`, `driveLastAt`.
  - Replace the `session_uploads` queries with two `drive_seen_files` queries (head+count, week-filtered count, and a tiny `select('created_at').order('created_at',{ascending:false}).limit(1)` for "last scan").
  - Update the realtime channel: swap `session_uploads` for `drive_seen_files`.
  - Update the 4th card definition: new title/stats and an `onClick` that invokes the edge function.
  - Add `useToast` for feedback and a local `scanning` boolean.

No DB migration, no edge-function changes, no other UI files affected.

## Out of scope

- Building a dedicated `/admin/client-uploads` page.
- Surfacing per-file detail on the dashboard (the Storage panel at `/admin/looks` already handles that).
- Changing the watcher's schedule or webhook payload.
