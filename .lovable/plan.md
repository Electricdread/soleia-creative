

## Plan: Remove "After Effects project file" from Content Delivery Guide Email

### What's Changing
Remove the second bullet item ("After Effects project file") from the asset list in the email template HTML inside `CollectAssetsEmailCard.tsx`.

### File to Edit
**`src/components/admin/CollectAssetsEmailCard.tsx`** — In the `buildAssetsEmailHtml` function, remove the `<li>After Effects project file</li>` line from the `<ul>` list, keeping only:
- LED Pixel Map template
- Content Delivery Guide PDF

