

## Plan: Client Asset Collect Email Template

### What We're Building
A new `ClientAssetCollectEmailCard` component — following the same pattern as the existing Content Delivery and Media Download email cards — that generates a branded HTML email for requesting clients to upload their company assets (logos, branding guidelines, etc.) via a cloud link.

### Email Template Design
- Dark textured gradient header with Soleia logo (matching existing templates)
- Polished, polite body copy requesting the client to upload their company assets:
  - Company logo (all formats/variations)
  - Brand guidelines and color palette
  - Typography/font files
  - Any additional branding materials
- Gold gradient CTA button: "Upload Your Assets"
- Helpful note about accepted file formats and organization
- Dark footer with Soleia logo, "Creative Team", and contact email

### UI Component
- Card with `Upload` icon, title **"Client Asset Collect"**, subtitle "Request client branding and company assets"
- Two input fields: **Client Name**, **Cloud Link** (Dropbox/Google Drive upload URL)
- Expand/collapse preview + "Copy Email" button
- Same rich clipboard copy pattern as existing cards

### Files to Create
- `src/components/admin/ClientAssetCollectEmailCard.tsx`

### Files to Edit
- `src/pages/AdminCreative.tsx` — import and render `ClientAssetCollectEmailCard` alongside the other email cards

