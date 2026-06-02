## Update Creative Guide template to the new June 2026 project file

The uploaded `CREATIVE GUIDE June2026 Soleia.zip` (~25 MB) is the updated After Effects project + source assets. Two buttons in the Creative Guide already offer "Download After Effects Template" — they currently point to `/creative-guide/After_Effects_Template.zip` (an old in-repo file). We'll repoint them at the new zip.

Because the zip is 25 MB (over the 5 MiB PWA cache cap and too large to commit), it goes to Cloud storage instead of `public/`.

### Steps

1. Upload the zip to the existing public `creative-guide-template` storage bucket as `CREATIVE_GUIDE_June2026_Soleia.zip`.
2. In `src/components/creative-guide/DisplaySpecsView.tsx`:
   - Change `LED_AE_TEMPLATE_ZIP` to the public bucket URL.
   - Update the `link.download` filename to `CREATIVE_GUIDE_June2026_Soleia.zip`.
3. In `src/components/creative-guide/CustomContentView.tsx`:
   - Update the `<a href="/creative-guide/After_Effects_Template.zip" download>` to the same bucket URL with the new filename.
4. Leave `TICKER-MARQUEE.zip` and the individual pixelmap downloads untouched — those are separate assets not in this upload.
5. Optionally delete the stale `public/creative-guide/After_Effects_Template.zip` from the repo once the new link is verified.

### Notes

- The bucket is already public, so the file will be reachable at `https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/creative-guide-template/CREATIVE_GUIDE_June2026_Soleia.zip` immediately after upload.
- No database, RLS, or UI/copy changes required — only the underlying file the existing buttons fetch.
- Button labels ("Download After Effects Template") remain unchanged.