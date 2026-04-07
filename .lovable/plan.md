

## Plan: Creative Session Email Template

### What We're Building
A new `CreativeSessionEmailCard` component that lets the admin select a creative session from a dropdown, then generates and copies a branded HTML email inviting the client to review the design work. The email dynamically pulls the session's cover image as the hero header.

### Email Template Design
- **Dynamic cover image** from the selected creative session as the full-width hero header (dark gradient fallback if no cover)
- Dark textured gradient header with Soleia logo below the cover image
- Body copy explaining the creative session: invites the client to review curated design concepts, explains they can browse mood boards, leave comments, and approve favorites
- Brief navigation walkthrough (scroll through designs, tap to expand, use the approve button)
- Gold gradient CTA button: **"View Creative Session →"** linking to `/creative/{token}`
- Dark footer with Soleia logo, "Creative Team", and contact email

### UI Component
- Card with `Palette` icon, title **"Creative Session Email"**, subtitle "Share creative sessions with clients for review"
- **Select dropdown** that fetches all active creative sessions from the database, displaying `project_name — client_name`
- When a session is selected, auto-populate the client name and cover image from session data
- Expand/collapse HTML preview + "Copy Email" button
- Same rich clipboard copy pattern (`ClipboardItem` with `text/html`)

### How It Works
1. Component fetches `creative_sessions` on mount (id, token, project_name, client_name, cover_images, event_date)
2. Admin selects a session from the dropdown
3. Cover image URL, project name, client name, and event date are extracted from the selected session
4. The shared link is built as `https://soleia-creativeteam.com/creative/{token}`
5. HTML template is generated with all dynamic fields interpolated
6. "Copy Email" writes rich HTML to clipboard

### Files to Create
- `src/components/admin/CreativeSessionEmailCard.tsx`

### Files to Edit
- `src/pages/AdminCreative.tsx` — import and render `CreativeSessionEmailCard` alongside the other email cards

