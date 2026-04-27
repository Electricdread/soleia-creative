## Goal

Give admins a self-serve "Drive Cold Storage" control surface inside the existing Soleia Looks admin area:

1. **Migrate older clips** button that runs the existing `migrate-clips-to-drive` edge function in batches with live progress + per-clip results.
2. **Download original** action in the Clip Manager that streams the file from Google Drive via `download-from-drive` whenever `original_storage = 'drive'`.
3. **Drive connection status widget** that verifies the Drive connector is reachable (list + create a test folder) and surfaces any gateway/API errors.

## New / Updated Files

```text
src/components/admin/StoragePanel.tsx          (new — Drive status + migrate UI)
src/components/admin/SortableClipCard.tsx      (add Download Original action)
src/components/admin/ClipManager.tsx           (pass drive fields into card)
src/pages/AdminLooks.tsx                       (add new "Storage" tab)
supabase/functions/drive-status/index.ts       (new — health-check endpoint)
supabase/functions/migrate-clips-to-drive/...  (small response tweak: return per-clip detail)
supabase/config.toml                           (register drive-status function)
```

## 1. Drive connection status widget

New edge function `drive-status` does three things and returns a structured report:

- Calls `POST https://connector-gateway.lovable.dev/api/v1/verify_credentials` (gateway built-in check).
- `GET /drive/v3/files?q=name='Soleia Originals' and mimeType='application/vnd.google-apps.folder'&fields=files(id,name)` — proves list permission.
- If the folder is missing, creates a temporary `Soleia Health Check {timestamp}` folder via `POST /drive/v3/files` then deletes it via `DELETE /drive/v3/files/{id}` — proves write permission. If `Soleia Originals` exists, only do the temp create/delete (still exercises write).
- Returns `{ verifyCredentials, listOk, writeOk, soleiaFolderId, latencyMs, errors[] }`.

Frontend widget `DriveStatusCard` (inside `StoragePanel.tsx`):
- Shows three pills: **Auth**, **List**, **Write**, each green/red with latency.
- Shows `Soleia Originals` folder ID + Drive link when present.
- Shows the raw error message from any failing check (gateway HTTP status + body excerpt).
- "Re-test" button.

## 2. Migrate older clips UI

`StoragePanel.tsx` adds a card with:
- Stat row: total clips, clips on Supabase (`original_storage='supabase'` and `video_url not null`), clips on Drive.
- **Batch size** input (default 5, max 20).
- **Migrate next batch** button — invokes `supabase.functions.invoke('migrate-clips-to-drive', { body: { batchSize } })`.
- **Migrate all** button — loops batches until the response reports `remaining = 0` or an error, with a cancel button.
- Live progress bar (`migrated / totalSupabase`).
- Results list: per-clip row with title, status (✓ migrated / ✗ failed), Drive link or error message. Persisted in component state for the session.
- Refresh button to recompute stats from `cached_clips`.

Tweak to `migrate-clips-to-drive`: ensure the response shape is
```json
{ "processed": n, "succeeded": [...], "failed": [{id,title,error}], "remaining": n }
```
so the UI can render rows reliably.

## 3. Download original from Drive

In `SortableClipCard.tsx`, when the clip has `original_storage === 'drive'` and a `drive_file_id`:
- Add a small "Download original" menu item / icon button (Download icon).
- Handler:
  ```ts
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-from-drive?fileId=${clip.drive_file_id}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${session.access_token}`, apikey: VITE_SUPABASE_PUBLISHABLE_KEY } });
  const blob = await res.blob();
  // trigger anchor download with filename from content-disposition or clip.title
  ```
- Falls back to existing Supabase `video_url` download when `original_storage === 'supabase'`.
- Toast on error using the JSON error body returned by the edge function.

`ClipManager.tsx` query is updated to also select `drive_file_id, drive_web_view_link, original_storage` and pass them into the card props (Clip interface extended).

## 4. Navigation

Add a new tab in `src/pages/AdminLooks.tsx` next to "Manage Clips":
```text
[ Sessions ] [ Upload ] [ Add URL ] [ Bulk ] [ Manage ] [ Storage ]
```
Storage tab renders `<StoragePanel />`.

## Technical details (for reference)

- All edge functions keep current CORS pattern (manual headers, OPTIONS handler).
- `drive-status` uses both `LOVABLE_API_KEY` and `GOOGLE_DRIVE_API_KEY` (already configured per `<secrets>`).
- Verify-credentials call uses `https://connector-gateway.lovable.dev/api/v1/verify_credentials` (no connector_id in path).
- Migration loop on the client respects a `remaining` counter from the edge function so we never hammer the gateway; small `await new Promise(r => setTimeout(r, 500))` between batches.
- Download uses fetch-to-blob (matches existing `storage-download-cors-bypass` memory pattern).
- No DB migration needed — all required columns already exist on `cached_clips`.

## Out of scope

- Auto-migration on upload (already routed to Drive in `BatchVideoUploader`).
- Restoring files from Drive back to Supabase.
- Per-user Drive (this stays workspace-scoped on the connected DSX Drive account).
