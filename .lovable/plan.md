# Auto-include Pixel Map PNG in client Drive folder

The `create-client-drive-folder` edge function already creates a `02_Pixel Map/` subfolder under each client folder but leaves it empty. Mirror the existing Creative Guide zip-upload pattern so the master Soleia pixel map gets dropped in automatically (idempotent).

## Changes

### 1. Asset hosting
- Upload `user-uploads://SOLEIApixmap.png` to the existing public `creative-guide-template` Supabase Storage bucket as `SOLEIA-Pixel-Map.png` (same bucket used for the Creative Guide zip — no new bucket needed).
- Public URL becomes the default the edge function fetches.

### 2. `supabase/functions/create-client-drive-folder/index.ts`
After the existing zip upload block, add a parallel block that:
- Resolves the pixel map URL from optional `site_settings.value` where `key = 'pixel_map_url'`, falling back to the public storage URL `${SUPABASE_URL}/storage/v1/object/public/creative-guide-template/SOLEIA-Pixel-Map.png`.
- Checks `02_Pixel Map/` for an existing file named `SOLEIA-Pixel-Map.png` — skip upload if present (idempotent).
- Otherwise, fetch bytes and multipart-upload to Drive with `mimeType: 'image/png'` into the `pixelMapFolderId`.
- Wrap in `try/catch` like the zip block so failures are non-fatal.

To get the folder ID, change the `Promise.all([…])` (line 122–126) to capture all three IDs:
```ts
const [creativeGuideFolderId, pixelMapFolderId, _assetCollectFolderId] = await Promise.all([…]);
```

### 3. Optional admin override
Add nothing in the UI for now — admins can override later by inserting `pixel_map_url` into `site_settings` (same pattern as `creative_guide_template_url`). No DB migration required since the row is optional.

## Out of scope
- No frontend UI changes.
- No DB migration.
- Existing client folders won't be retroactively populated unless `create-client-drive-folder` is re-invoked for them (it is idempotent and safe to re-run).

## Files touched
- `supabase/functions/create-client-drive-folder/index.ts`
- New asset uploaded to `creative-guide-template` bucket: `SOLEIA-Pixel-Map.png`
