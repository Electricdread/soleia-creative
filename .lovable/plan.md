## Goal
When a client drops a file into their assigned Google Drive folder, fire a Zapier webhook so you get a notification (Email, Slack, SMS — whatever you wire up in the Zap).

## How it works

```text
pg_cron (every 2 min)
   └─► edge fn: drive-upload-watcher
         ├─ for each client_link with drive_folder_id:
         │    1. List Drive folder children (via google_drive connector gateway)
         │    2. Compare against drive_seen_files table
         │    3. For each NEW file:
         │         - insert into drive_seen_files
         │         - POST to ZAPIER_WEBHOOK_URL
         └─ done
```

## Setup steps (one-time)

1. **You create the Zap** in Zapier:
   - Trigger: *Webhooks by Zapier → Catch Hook*
   - Action: whatever notification you want (email, Slack, push)
   - Copy the "Catch Hook" URL.
2. **Add `ZAPIER_WEBHOOK_URL` secret** — I'll request it once the plan is approved.

## Implementation

### 1. New table `drive_seen_files`
Tracks which Drive file IDs we've already notified on (prevents duplicate Zaps).

```sql
create table public.drive_seen_files (
  id uuid primary key default gen_random_uuid(),
  link_id uuid references public.client_links(id) on delete cascade,
  drive_file_id text not null,
  file_name text,
  seen_at timestamptz default now(),
  unique (link_id, drive_file_id)
);
-- GRANTs to service_role only (no client access)
-- RLS enabled, no policies (locked to service role)
```

### 2. New edge function `drive-upload-watcher`
- `verify_jwt = false` (called by pg_cron)
- For each active `client_links` row with a non-null `drive_folder_id`:
  - GET `connector-gateway/google_drive/drive/v3/files?q='{folderId}'+in+parents&fields=files(id,name,mimeType,size,webViewLink,createdTime)`
  - Diff against `drive_seen_files`
  - For each new file, POST to `ZAPIER_WEBHOOK_URL`:
    ```json
    {
      "client_name": "...",
      "event_name": "...",
      "event_date": "...",
      "file_name": "...",
      "file_type": "...",
      "file_size": 12345,
      "file_url": "https://drive.google.com/...",
      "session_link": "https://soleiacreative.app/admin/sessions/{id}",
      "timestamp": "2026-06-10T..."
    }
    ```
  - Insert into `drive_seen_files`
- On first run for a given folder: seed `drive_seen_files` with existing files but DO NOT fire webhook (avoids notification flood on backfill).

### 3. pg_cron schedule
Every 2 minutes, invoke `drive-upload-watcher`. (Uses `pg_net` + the service role via existing pattern.)

### 4. Admin UI tweak (small)
In **/admin/looks → Storage** panel, show a "Drive Watcher" status row: last run time, total files tracked, last-fired webhook timestamp (read from `drive_seen_files`). No new page.

## Technical notes
- Uses existing `google_drive` connector gateway (already linked — `GOOGLE_DRIVE_API_KEY` is configured).
- Assumes `client_links.drive_folder_id` exists. If not, I'll add it as a nullable column and surface it in the session manager.
- Webhook fires server-side from the edge function (no CORS, full visibility into success/failure logged to `email_send_log`-style or just edge function logs).
- Backfill-safe: first scan of a folder just records IDs without notifying.

## Out of scope
- Changing where original files are stored (still Drive cold storage).
- In-app notification UI — Zapier handles delivery.
- Notifications for `session_uploads` (in-app uploads) — separate flow already exists via `notify-upload` function.
