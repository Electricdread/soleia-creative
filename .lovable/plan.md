## Issues seen in screenshots

1. **Image-47 (iOS Mail compose)** — pasting "Copy Email" into iOS Mail produces our plain‑text fallback, which is currently a bare 5‑line message with no header, no styling, and no signature block. It reads more like a debug dump than a client email.
2. **Image-48 (rendered HTML email)** — the gold "View Proposal →" button is technically wrapped in `<a href="…">`, but when the HTML is pasted into Gmail/iOS compose, many clients drop the `<a>` styling on a styled block button and the user can no longer click it. There is also no visible URL anywhere as a fallback.

## Fix

### 1. Upgrade the proposal HTML in `supabase/functions/generate-session-email/index.ts`

Bring the proposal branch up to the same standard as `ProposalEmailCard.tsx`:

- Dark Soleia header band with `soleia-logo-color.png` (matches every other Soleia email).
- "Your Project Proposal" heading + greeting line ("Dear {client},").
- Gold left-border "Event Details" card (event name, venue, date) when data is present.
- Short paragraph framing the proposal.
- Light "What you'll find inside" panel with 3 rows (Scope, Timeline, Pricing) — small, no fake "digital signature" emoji clutter.
- Gold pill CTA button "View Proposal →" with `href={pageUrl}`.
- **Plain-URL fallback under the button** ("If the button doesn't work, copy this link:" + visible `pageUrl` as a text link). This guarantees a clickable URL even when a mail client strips the styled button.
- Dark footer band with small Soleia logo and contact email.

Keep the existing `subject` value unchanged. Keep the function signature, query params, and response shape identical (still returns `{ html, subject }`), so `AdminProposals.copyEmailTemplate` keeps working without changes.

### 2. Polish the plain-text fallback in `src/pages/AdminProposals.tsx → buildPlainTextEmail`

Rewrite to a cleaner, signed format that looks intentional when iOS Mail falls back to text/plain:

```
SOLEIA CREATIVE TEAM
Project Proposal

Hi {client},

Your proposal for {event} is ready to review and sign:
{proposalUrl}

Inside you'll find the scope of work, timeline,
and pricing — plus a one-click digital signature
when you're ready to move forward.

Let me know if you have any questions.

— Soleia Creative Team
luisdreamslv@gmail.com
```

This is what shows up in the iOS Mail compose window (image-47) and in the `mailto:` fallback. It now looks like a real email instead of a fragment.

### 3. Verification

- From `/admin/proposals`, tap **Copy Email** on a proposal, paste into Gmail desktop → richer branded HTML renders, gold button is clickable, and the URL appears as a visible text link below it.
- Same flow into iOS Mail → the new plain-text version shows with header, body, signature, and a tappable URL on its own line.
- Tap **Open in Mail app** → mailto opens with the same polished text body.

## Out of scope

- `ProposalEmailCard.tsx` (the Tools page card) — already uses a rich template, no changes.
- `notify-proposal-signed`, auth emails, transactional infrastructure — unrelated paths.