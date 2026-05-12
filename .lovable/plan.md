# Auto-Generated Client Drive Folder on Proposal Signing

When a client signs a proposal, automatically create a Google Drive folder for that client containing 3 subfolders, set "anyone with link → Editor" permissions, save the link to the proposal, and surface the link in the Creative Session intro email.

## Workflow

```text
Client signs proposal
        ↓
notify-proposal-signed (existing) fires
        ↓
NEW: create-client-drive-folder edge function
        ↓
Drive: "Soleia Clients / <Client Name> — <Event Name>"
   ├── 01_Soleia Creative Guide
   ├── 02_Pixel Map
   └── 03_Client Asset Collect
        ↓
Set parent folder → anyone with link, role: writer
        ↓
Save webViewLink to proposals.drive_folder_url
        ↓
CreativeSessionEmailCard auto-pulls this URL when proposal_id is linked
```

## Database

Add to `proposals` table:
- `drive_folder_url TEXT` — public edit link
- `drive_folder_id TEXT` — Drive folder ID for future operations

## New Edge Function: `create-client-drive-folder`

Input: `{ proposal_id }`

Steps (uses existing `GOOGLE_DRIVE_API_KEY` connector + same gateway pattern as `upload-to-drive`):
1. Fetch proposal (event_name, client_name) via service-role client.
2. If `drive_folder_url` already exists → return it (idempotent).
3. Find/create root folder `"Soleia Clients"` at Drive root.
4. Create child folder `"<Client Name> — <Event Name>"`.
5. Create 3 subfolders inside it:
   - `01_Soleia Creative Guide`
   - `02_Pixel Map`
   - `03_Client Asset Collect`
6. POST to `/drive/v3/files/<parentId>/permissions` with `{ role: 'writer', type: 'anyone' }`.
7. GET parent metadata with `fields=id,webViewLink`.
8. UPDATE proposals with `drive_folder_id` + `drive_folder_url`.
9. Return `{ folderUrl, folderId }`.

Config: add to `supabase/config.toml` with `verify_jwt = false` (called from edge-to-edge or trusted post-sign flow).

## Trigger Wiring

In `ProposalView.tsx → handleSign` (already invokes `notify-proposal-signed`), add a parallel:

```ts
supabase.functions.invoke('create-client-drive-folder', {
  body: { proposal_id: proposal.id },
});
```

Don't await — runs in background. Errors logged, don't block signing UX.

Also add a manual **"Generate Client Folder"** button in `AdminProposals.tsx` per-proposal row (admin-only) for retries / proposals signed before this feature shipped.

## Email Integration

`CreativeSessionEmailCard` already has a session selector. Update it to:
1. When session is linked to a proposal, fetch `proposals.drive_folder_url`.
2. If present, render a new gold-bordered section in the email HTML:

```text
┌─────────────────────────────────────────┐
│ 📁  Your Project Folder                 │
│                                         │
│ Access your Soleia Creative Guide,      │
│ Pixel Map, and asset upload folder:     │
│                                         │
│   [ Open Project Folder ]  ← gold CTA   │
└─────────────────────────────────────────┘
```

3. Add an editable input "Project Folder Link" pre-filled with the auto-generated URL — admin can override before copying the email.

## Files Touched

**New**
- `supabase/functions/create-client-drive-folder/index.ts`
- Migration: add `drive_folder_url`, `drive_folder_id` to `proposals`

**Modified**
- `supabase/config.toml` — register new function
- `src/components/proposal/ProposalView.tsx` — invoke folder fn on sign
- `src/pages/AdminProposals.tsx` — manual "Generate Folder" button + show link
- `src/components/admin/CreativeSessionEmailCard.tsx` — fetch + inject folder link block + override field

## Notes

- Reuses existing `GOOGLE_DRIVE_API_KEY` connector (already used by `upload-to-drive`).
- "Anyone with link → Editor" means no client email required; link is the credential. Treat the URL as semi-sensitive (only shared via the intro email).
- Folder creation is idempotent — safe to retry.
- The 3 subfolders start empty; admin uploads the Creative Guide PDF and Pixel Map PDF manually into Drive (or future enhancement: auto-upload latest PDFs).
