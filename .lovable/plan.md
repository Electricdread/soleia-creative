## Backfill revised Creative Guide zip across all client Drive folders

Push the revised June 2026 zip into every existing client Drive folder, and update the source-of-truth so future folders always pull the latest.

### Steps

1. **Upload the revised zip under the canonical name** the edge function uses:
   - Re-upload to `creative-guide-template/SOLEIA - Creative Guide Project.zip` (overwriting whatever's there). This is the filename `create-client-drive-folder` expects, so new folders going forward automatically get the revision.

2. **Set the site_settings pointer** so the URL is centrally controlled:
   - Insert/update row `{ key: 'creative_guide_template_url', value: '<public URL of the new zip>' }`.

3. **Create a new edge function `refresh-client-drive-templates`** that:
   - Lists all proposals with `drive_folder_id IS NOT NULL`.
   - For each, locates the `01_Soleia Creative Guide` subfolder.
   - Finds `SOLEIA - Creative Guide Project.zip` in that subfolder (any matching name).
   - Deletes the old file (Drive trash) and uploads the new zip from the Supabase URL.
   - Returns a summary `{ processed, updated, skipped, errors[] }`.

4. **Trigger the backfill once** by calling the new function via `curl_edge_functions`. Report how many folders were updated.

5. **Fix stale link** in `src/components/creative-guide/PrintableCreativeGuide.tsx:515` — currently points to the deleted `/creative-guide/After_Effects_Template.zip`. Replace with the Supabase URL.

### Technical details

- The Google Drive connector is already linked (the existing edge function uses `LOVABLE_API_KEY` + `GOOGLE_DRIVE_API_KEY` via the gateway).
- The backfill function is one-off but kept deployable so it can be re-run any time the master zip changes.
- Drive uploads use `uploadType=multipart`, same pattern as `create-client-drive-folder`.
- Idempotency: re-running the backfill will simply replace the file again — safe.
- No DB schema changes beyond a single `site_settings` upsert.

### Notes

- The June-dated filename in the bucket (`CREATIVE_GUIDE_June2026_Soleia.zip`) stays in place for the in-app download buttons. Both filenames will exist in the bucket pointing at the same content.
- After this runs, every client folder ever created will contain the revised zip; future folders pull it automatically.
