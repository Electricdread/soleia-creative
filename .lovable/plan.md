

## Plan: Collect Assets Email Template Component

### What We're Building
A new `CollectAssetsEmailCard` component that generates a branded, rich HTML email template for requesting creative assets from clients. The admin enters a **Project Name** and **Cloud Link URL** (Dropbox/Google Drive), clicks "Copy Email", and gets a fully formatted HTML email copied to the clipboard — ready to paste into any email client.

### Email Template Design
- Gold gradient header bar + "SOLEIA" logo text + "Creative Team" subtitle (matching existing email style)
- Polished body with the user's provided verbiage:
  - Intro about the attached folder (pixel map, AE project, Delivery Guide PDF)
  - Note about immersive screen rendering
  - Consulting load fee notice for LEDs
  - Elevator/ticker availability at additional cost
  - Reference to Content Delivery Guide PDF
  - Cloud link CTA button styled with gold gradient
  - "Download & Upload" instructions referencing the `[Project Name]` labeled folder
- Footer with Soleia Creative Team branding and contact email

### UI Component
- Card with input fields for **Project Name** and **Cloud Link URL**
- Expand/collapse preview of the generated HTML
- "Copy Email" button that copies rich HTML to clipboard (using `ClipboardItem` with `text/html` mime type for rich paste)
- Matches existing `EmailTemplateCard` styling patterns

### Files to Create
- `src/components/admin/CollectAssetsEmailCard.tsx` — new component with input fields + HTML generator

### Files to Edit
- `src/components/admin/CreativeSessionManager.tsx` or relevant admin page — import and render the new card alongside the existing `EmailTemplateCard`

### Technical Notes
- Rich HTML clipboard copy using `navigator.clipboard.write([new ClipboardItem(...)])` so it pastes formatted in email clients
- Dynamic interpolation of project name and cloud link URL into the HTML template
- Same branded email structure as `generate-session-email` (gold header bar, logo, CTA button)

