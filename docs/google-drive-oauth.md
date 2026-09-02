# Soleia Google Drive OAuth

Soleia uses its own unattended, server-side Google OAuth grant. It does not
copy DSX Studio OS credentials or read that desktop app's encrypted profile.

## Google Cloud client

- Create a dedicated OAuth client named `Soleia Creative Backend` in a Google
  Cloud project owned by the DSX Google Workspace.
- Use an Internal consent screen when the Cloud project belongs to the same
  Workspace as the authorizing account.
- Grant `https://www.googleapis.com/auth/drive`. The narrower `drive.file`
  scope cannot reliably see files that clients create in their folders.
- Request offline access and consent once to obtain a refresh token for the
  Workspace Drive owner. Routine watcher runs do not prompt anyone.

The current Workspace account observed in DSX Studio OS is
`luisdreams@dsxstudios.io`. Confirm the primary domain in Google Admin before
applying an OAuth trust policy; do not assume `dsxstudiosapp.io` is the tenant
domain just because it is used as a product name.

## Lovable Cloud secrets

Enter these through **Lovable Cloud → Secrets**. Never commit them, paste them
into chat, or store them in a frontend environment variable.

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REFRESH_TOKEN`

All three are required. A partial set fails closed. With all three present,
every Drive edge function calls Google directly. With none present, the old
Lovable Drive connector remains a rollout fallback until the cutover is
verified.

## Verification

1. Deploy all Drive functions that import `_shared/googleDrive.ts`.
2. Call `drive-status` from the authenticated admin Storage panel.
3. Require `healthy: true`, `authMode: "google_oauth"`, and the intended
   Workspace account in `verifyCredentials.account`.
4. Run `drive-upload-watcher` manually and confirm it returns before 90 seconds.
5. Upload a harmless test file to a client asset folder and confirm both the
   `drive_seen_files` row and direct email notification.
6. After a stable observation window, the legacy Lovable connector secrets can
   be retired in a separate change.

## Outage repair

The OAuth cutover and the Aug 28 watcher outage are separate fixes. Migration
`20260830090000_repair_drive_watcher_timeout.sql` changes the existing pg_net
request timeout from its five-second default to 90 seconds while preserving
the live cron job's URL, headers, name, and two-minute schedule. The watcher
also scans four independent folder trees concurrently and retries undelivered
notification rows for 14 days using Resend; Zapier is optional downstream
automation, not the notification authority.
