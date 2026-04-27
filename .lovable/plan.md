# Plan — Google Drive as Cold Archive for Original Clips

## Goal
Free space in the 8 GB Supabase quota by moving **original** high-res uploads to Google Drive, while keeping all browser-playable previews/thumbnails in Supabase Storage so the UI/UX is unchanged.

## What stays where

| Asset | Location | Reason |
|---|---|---|
| 720p WebM previews (`clip-previews`) | Supabase | Streamed in galleries — needs CDN + range requests |
| Thumbnails / cover images | Supabase | Public URLs used in `<img>` tags |
| `session-uploads`, `creative-uploads`, `email-assets` | Supabase | Active client/admin workflows |
| **Original full-res clips (`clips` bucket)** | **Google Drive** | Cold storage — only downloaded occasionally |

## How it works

```text
Upload flow (BatchVideoUploader)
   │
   ├─► Re-encode to 720p WebM ─► Supabase clip-previews  (UI plays this)
   │
   └─► Original file ─────────► Edge Function ─► Google Drive
                                                       │
                                                       └─► Save driveFileId + webViewLink
                                                            on cached_clips row
```

The gallery, sessions, and proposals never change — they already use the WebM preview URL. The original is only fetched when an admin clicks **Download Original**.

## Implementation steps

### 1. Database migration
Add columns to `cached_clips` (and any other table holding originals):
- `drive_file_id text`
- `drive_web_view_link text`
- `original_storage` text default `'supabase'` (`'supabase' | 'drive'`)

### 2. Edge function: `upload-to-drive`
- Accepts a file (multipart) + target folder name
- Uses Google Drive connector gateway (`https://connector-gateway.lovable.dev/google_drive/upload/drive/v3/files?uploadType=multipart`)
- Creates/uses a `Soleia Originals` folder in Drive
- Returns `{ fileId, webViewLink }`
- Validates JWT, rate-limits, validates file size

### 3. Edge function: `download-from-drive`
- Accepts `driveFileId`
- Streams the file back via `?alt=media`
- Used by admin "Download Original" button

### 4. Edge function: `migrate-clips-to-drive` (one-time)
- Iterates rows in `cached_clips` where `original_storage = 'supabase'`
- Downloads from Supabase `clips` bucket → uploads to Drive → updates row → deletes from Supabase
- Runs in batches (e.g. 10 at a time) with progress reporting

### 5. UI changes
- **`BatchVideoUploader`**: after WebM preview uploads to Supabase, send original to `upload-to-drive` instead of `clips` bucket
- **Admin clip card**: replace "Download Original" Supabase URL with a button that calls `download-from-drive` (uses the existing fetch-to-blob CORS bypass pattern)
- **New "Storage" admin panel** (optional, small): shows Supabase quota used vs. count of clips archived to Drive, with a "Migrate older clips" button

### 6. Drive folder structure
```text
Soleia Originals/
├── 2026-Q2/
│   ├── {clip-id}-{filename}.mov
│   └── ...
└── 2026-Q1/
```
Organized by quarter so the Drive folder stays browsable.

## Tradeoffs you should know
- **Drive uploads are slower** than direct-to-Supabase (must proxy through edge function with `LOVABLE_API_KEY`). Acceptable for originals since users already wait for re-encoding.
- **Drive download throughput** is lower than Supabase CDN — fine for occasional admin downloads, not for streaming.
- All originals will live in **your single Drive account** (the one that authorized the connector). Capacity = your Google plan's quota.
- If the Google Drive connection is ever disconnected, originals stay safe in Drive but the app can't fetch them until reconnected.

## Files to be created/modified
- `supabase/migrations/<timestamp>_add_drive_columns.sql` (new)
- `supabase/functions/upload-to-drive/index.ts` (new)
- `supabase/functions/download-from-drive/index.ts` (new)
- `supabase/functions/migrate-clips-to-drive/index.ts` (new)
- `src/components/admin/BatchVideoUploader.tsx` (modify upload destination)
- `src/components/admin/ClipManager.tsx` or equivalent (Download Original button)
- `src/components/admin/AdminPanel.tsx` (optional Storage panel + Migrate button)

## Out of scope (ask if you want these added)
- Per-client Drive folders shared with each client
- Moving `creative-uploads` or `session-uploads` to Drive (active workflows — UX impact)
- Automatic cleanup based on age
