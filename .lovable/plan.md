## Goal
Add an admin-only page at `/admin/email-previews` where you can browse and preview each of the six auth email templates (signup, magic link, recovery, invite, email change, reauthentication) rendered with realistic sample data — directly inside the app, before triggering any test sends.

## How it works
The existing `auth-email-hook` Edge Function already has a `/preview` endpoint (see `supabase/functions/auth-email-hook/index.ts`) that:
- Accepts `POST { type: "signup" | "magiclink" | "recovery" | "invite" | "email_change" | "reauthentication" }`
- Renders the matching React Email template with built-in `SAMPLE_DATA`
- Returns the fully rendered HTML

We'll build the admin UI on top of that existing endpoint — no new Edge Function or template duplication needed.

## Changes

### 1. New page — `src/pages/AdminEmailPreviews.tsx`
- Protected admin route with the standard Soleia admin layout (back link to `/admin`, gold accent header, JetBrains Mono labels)
- Left sidebar (or top tab bar on mobile): list of the 6 templates with friendly labels
  - Signup confirmation
  - Magic link
  - Password recovery
  - Invite
  - Email change
  - Reauthentication (OTP)
- Main panel: 
  - Subject line preview (pulled from the same `EMAIL_SUBJECTS` map used by the hook)
  - Sample-data summary card showing the props being injected (recipient, URLs, token)
  - Live `<iframe srcDoc={html}>` rendering of the email at ~600px width so layout matches real inboxes
  - Desktop / Mobile width toggle (600px / 375px)
  - "Open in new tab", "Copy HTML", and "Download .html" buttons
- Loading + error states; auto-fetches when the selected template changes

### 2. Route registration — `src/App.tsx`
- Add `<Route path="/admin/email-previews" element={<ProtectedRoute requireAdmin><AdminEmailPreviews /></ProtectedRoute>} />`

### 3. Admin Portal entry point — `src/pages/AdminPortal.tsx`
- Add a new gold-accent card "Auth Email Previews" linking to `/admin/email-previews` so it's discoverable from the dashboard

### 4. Preview fetch helper (inline in the page, no new lib file)
- Calls `${VITE_SUPABASE_URL}/functions/v1/auth-email-hook/preview` with `Authorization: Bearer <LOVABLE_API_KEY>`
- **Auth note**: the `/preview` endpoint requires the project's `LOVABLE_API_KEY`. Since we cannot expose that key to the browser, we'll add a **thin admin-only Supabase Edge Function** `preview-auth-email` that:
  - Verifies the caller is an authenticated admin (using `has_role(auth.uid(), 'admin')`)
  - Server-side, calls the existing `auth-email-hook/preview` with the `LOVABLE_API_KEY` from Deno env
  - Returns the rendered HTML to the browser
- This keeps the secret on the server and reuses the existing template registry.

### 5. New Edge Function — `supabase/functions/preview-auth-email/index.ts`
- Reads JWT, verifies admin role via service-role client + `has_role` RPC
- Forwards `{ type }` to `auth-email-hook/preview` with bearer auth
- Returns the HTML string as JSON `{ html, subject }`
- Registered in `supabase/config.toml` with `verify_jwt = true`

## Out of scope (can add later if you want)
- Editing sample data inline before rendering
- Actually sending a test email to your inbox from this page (would be a small follow-up: a "Send test to luisdreamslv@gmail.com" button that enqueues via the existing email queue with the rendered HTML)
- Previewing transactional/app email templates (none scaffolded yet)

## Files touched
- **New**: `src/pages/AdminEmailPreviews.tsx`
- **New**: `supabase/functions/preview-auth-email/index.ts`
- **Edit**: `src/App.tsx` (add route)
- **Edit**: `src/pages/AdminPortal.tsx` (add dashboard card)
- **Edit**: `supabase/config.toml` (register new function)
