## Update Creative Guide template to revised June 2026 zip

Replace the existing `CREATIVE_GUIDE_June2026_Soleia.zip` in the `creative-guide-template` public storage bucket with the newly uploaded revision.

### Steps

1. Upload `user-uploads://CREATIVE_GUIDE_June2026_Soleia-2.zip` to the `creative-guide-template` bucket, overwriting `CREATIVE_GUIDE_June2026_Soleia.zip`.
2. Verify the file is accessible at the existing public URL.
3. No code changes — both download buttons (`DisplaySpecsView.tsx` and `CustomContentView.tsx`) already point to that URL and filename.
