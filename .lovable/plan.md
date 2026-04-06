

## Plan: Media Download Link Email Template

### What We're Building
A new `MediaDownloadEmailCard` component — similar in structure to the existing `CollectAssetsEmailCard` — that generates a branded HTML email for sharing media download links with clients. The admin enters a **Project Name**, **Client Name**, and **Download Link** (Dropbox/Google Drive/etc.), clicks "Copy Email", and gets rich HTML copied to clipboard.

### Email Template Design
- Dark textured gradient header with Soleia logo (same as Content Delivery Email)
- Clean body with greeting using client name
- Brief message: "Your media files for [Project Name] are ready for download"
- Gold gradient CTA button: "Download Media"
- Instruction note about the download link
- Dark footer with Soleia logo, "Creative Team", and contact email

### UI Component
- Card with `Download` icon, title "Media Download Email", subtitle "Share media download links with clients"
- Three input fields: **Project Name**, **Client Name**, **Download Link**
- Expand/collapse preview + "Copy Email" button
- Same rich clipboard copy pattern (`ClipboardItem` with `text/html`)

### Files to Create
- `src/components/admin/MediaDownloadEmailCard.tsx`

### Files to Edit
- `src/pages/AdminCreative.tsx` — import and render `MediaDownloadEmailCard` alongside the other email cards

