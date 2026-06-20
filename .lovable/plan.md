## Fix session clip uploads + remove Delivery

### 1. Clip uploads (Clips tab in session edit)

Root cause in `SessionContentManager.handleFileUpload`:
- Always shows "X file(s) uploaded" toast even when individual uploads or DB inserts failed.
- No size cap → very large videos silently fail in browser/storage.
- No playability check on videos → broken files appear missing after "success".
- No per-file progress, so user thinks the upload is still going when it has already errored out.

Fix:
- Track `succeeded` and `failed` counts; toast accurate result ("3 uploaded, 1 failed").
- Reject files over 500 MB up front with a clear message.
- For video files, run `probePlayable` (same helper used for previz) before upload; reject unplayable files with the AME re-export hint.
- Surface real errors from both `storage.upload` and `from('mood_board_items').insert` (console.error + per-file toast).
- Add a simple progress indicator (current file index / total) next to the "Uploading..." label so it's clear when work is actually finished.
- After the loop, `await fetchItems()` and only then clear `uploading`; do not show success unless at least one file succeeded.

### 2. Remove the Delivery feature from sessions

- `src/components/admin/CreativeSessionCard.tsx`: drop the `Delivery` `TabsTrigger`, drop the `<TabsContent value="delivery">` block, switch `TabsList` back to `grid-cols-3`, remove the `Truck` import, remove the `editDropboxUrl` state + persistence if it's only used here.
- `src/App.tsx`: remove `/delivery/:token` and `/delivery-guide` routes and their imports (`SessionDeliveryGuide`, `DeliveryGuide`).
- Delete `src/pages/SessionDeliveryGuide.tsx` and `src/pages/DeliveryGuide.tsx`.
- Leave `/creative-guide/content-delivery` (technical content-delivery guide) untouched unless you also want it gone.

No DB migration — the `dropbox_request_url` column on `creative_sessions` can stay unused; safer than dropping data.

### Technical notes
- `creative-uploads` bucket already accepts video; the failure is purely client-side error handling + missing size/playability validation.
- Async upload pattern (edge-function background processing) is overkill here; uploads happen directly client → Supabase Storage.