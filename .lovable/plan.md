# Auto-Include Creative Guide Project Zip in Client Drive Folder

When `create-client-drive-folder` runs, it should also upload the master `SOLEIA - Creative Guide Project.zip` (6 MB, contains `.aep` After Effects project + footage/pixel maps) into the new `01_Soleia Creative Guide` subfolder so every client receives it automatically.

## Storage Approach

The zip is a single shared template — same file for every client. Best place: a new **public Supabase Storage bucket** `creative-guide-template`.

Steps:
1. Migration creates bucket `creative-guide-template` (public read).
2. Manually upload `SOLEIA - Creative Guide Project.zip` to it via `storage_upload` tool → returns a stable public URL.
3. Store that URL as a constant in the edge function (no DB lookup needed).

Why not bundle in the function: edge function deploy size limits and the file rarely changes. Why not Drive-side template copy: requires extra API permissions and a known source file ID.

## Edge Function Changes (`create-client-drive-folder`)

After creating the 3 subfolders, capture the ID of `01_Soleia Creative Guide`, then:

```text
1. fetch(CREATIVE_GUIDE_ZIP_URL) → arrayBuffer
2. multipart upload to Drive:
     metadata { name: 'SOLEIA - Creative Guide Project.zip',
                parents: [creativeGuideFolderId],
                mimeType: 'application/zip' }
3. Skip if a file with that exact name already exists in the folder
   (idempotent re-runs)
```

Reuses the existing gateway helper (`gw`) and the same multipart pattern already used in `upload-to-drive/index.ts`.

## Future-Proofing

Add a small `site_settings` row `creative_guide_template_url` (optional, fallback to constant) so admin can swap the URL without redeploying when the master project is updated.

## Files Touched

**Modified**
- `supabase/functions/create-client-drive-folder/index.ts` — add zip upload step
- Migration: create `creative-guide-template` public bucket + insert `site_settings` key

**Action outside code**
- Upload the zip to the new bucket via `storage_upload` after migration runs

## Notes

- Zip is 6 MB → well within edge function memory and Drive multipart limits.
- Idempotent: lookup-by-name in the parent folder before uploading.
- If the user later wants the Pixel Map PDF auto-included in `02_Pixel Map`, same pattern applies.
