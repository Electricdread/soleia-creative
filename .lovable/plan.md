

## Plan: Restore Content Delivery Email Template

### Problem
The `CollectAssetsEmailCard.tsx` ("Content Delivery Email") was over-cleaned and now has generic asset-upload copy that duplicates the Client Asset Collect template. It should contain the **technical content delivery instructions** — After Effects project files, DXV3 encoding steps, LED Pixel Map specs, TV display specs, Resolume Alley, etc.

### What to Do

**Restore the email HTML body in `CollectAssetsEmailCard.tsx`** to contain the original content delivery guide content (from `EmailTemplateCard.tsx`), formatted as branded rich HTML with the Soleia dark header/footer and gold CTA styling:

1. **Opening paragraph**: "We are providing you with an After Effects project file prepared specifically for our LED video configuration mapping..."
2. **Step 1–5**: Prepare Your Video, Download Resolume Alley, Encode to DXV3, Check Specs, Submit Content
3. **Specs table**: TV Displays (1920x1080 / 3840x2160) and LED Pixel Map (3840x2160, alpha, 60fps)
4. **Tips section**: ProRes first, darker tones, white logos, alpha channel
5. **CTA button**: "Access Project Folder" linking to the cloud link field
6. **Footer**: Soleia logo + Creative Team

Keep the existing UI fields (Project Name, Cloud Link) and the rich HTML clipboard copy behavior.

### File to Edit
- `src/components/admin/CollectAssetsEmailCard.tsx` — replace `buildAssetsEmailHtml` body with the full content delivery guide content

