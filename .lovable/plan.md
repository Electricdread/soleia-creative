

## Plan: Branded HTML Email Template for Sharing Creative Session Links

### What We're Building
A new edge function (`send-session-email`) that generates and serves a branded HTML email template for sharing creative session links. Plus a UI button in the admin creative session cards to copy or trigger this email.

### Approach
Since this project doesn't have Lovable email infrastructure set up (no verified email domain), we'll create a **copyable branded HTML email** approach — similar to the existing `EmailTemplateCard` pattern but dynamic per-session. This generates a rich HTML email body that admins can paste into their email client.

### Technical Details

**1. New Edge Function: `generate-session-email`**
- Accepts `token`, `type` (creative/session), and returns rendered HTML email
- Fetches session data (project name, client name, cover image, event date) from the database
- Returns a beautifully formatted HTML email with:
  - Soleia gold/amber branding (`#B8860B` primary, `#8B6914` accent)
  - Cover image as hero banner
  - Project name and client name
  - Event date if available
  - Styled "View Session" CTA button linking to the session
  - Professional footer with Soleia Creative Team branding

**2. UI Integration: `CreativeSessionCard.tsx`**
- Add an "Email" action button to each session card
- On click, calls the edge function with the session token
- Copies the rendered HTML to clipboard (as rich HTML so it pastes formatted in email clients)
- Toast confirmation: "Email template copied — paste into your email client"

**3. Email Template Design**
- White background body (#ffffff)
- Gold accent header bar
- Cover image with rounded corners
- Clean typography with session details
- Amber/gold CTA button matching Soleia brand
- Subtle footer with "Soleia Creative Team" and support email

### Files to Create/Edit
- `supabase/functions/generate-session-email/index.ts` — new edge function
- `src/components/admin/CreativeSessionCard.tsx` — add email button
- Deploy the edge function

