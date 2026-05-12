## Add Content Delivery Guide to `02_Pixel Map` Drive subfolder

When a client Drive folder is auto-created on proposal sign, also drop the master Content Delivery Guide PDF into the `02_Pixel Map` subfolder — alongside the existing `SOLEIA-Pixel-Map.png`.

### Why `02_Pixel Map`
That subfolder already holds the technical asset (the pixel map). The Content Delivery Guide explains how to package/encode/name files for the LED system, so it belongs with the same technical bundle. (If you'd rather drop it in `03_Client Asset Collect`, say the word and I'll switch.)

### Implementation

Edit `supabase/functions/create-client-drive-folder/index.ts`:

1. After the existing Pixel Map upload block (around line 253), add a third upload block — same idempotent `findOrCreate` pattern:
   - File name: `SOLEIA-Content-Delivery-Guide.pdf`
   - Source URL resolution order:
     1. `site_settings.content_delivery_guide_url` (admin override)
     2. Fallback: `${SUPABASE_URL}/storage/v1/object/public/creative-guide-template/SOLEIA-Content-Delivery-Guide.pdf`
   - MIME type: `application/pdf`
   - Parent folder: `pixelMapFolderId`
   - Skip if a file with that name already exists in the folder
   - Wrap in try/catch — non-fatal, log only (matches existing pattern for zip + pixel map)

2. No DB schema changes. No new tables. The `site_settings` row is optional — works out of the box with the public bucket fallback.

### Source PDF

Two options for the master PDF that lives in `creative-guide-template`:
- **Option A (default)**: You upload `SOLEIA-Content-Delivery-Guide.pdf` to the existing `creative-guide-template` Supabase Storage bucket manually (same place `SOLEIA-Pixel-Map.png` lives). Nothing else needed.
- **Option B**: I add a small admin tool to generate the PDF via `deliveryGuidePdf.ts` and upload it to that bucket on demand. Tell me if you want this — otherwise I'll stop at Option A.

### Out of scope
- No changes to the live `/delivery-guide` page or `deliveryGuidePdf.ts`.
- No changes to existing folder structure or names.
- No changes to per-session delivery guides (`/delivery/:token`).
