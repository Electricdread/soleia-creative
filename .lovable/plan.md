## Goal

Reframe the proposal email so it reads as a pre-creative-call onboarding packet — a menu of line items, the Collect Assets folder, and the Creative Guide project file — rather than a "review and sign now" message. Add an optional scheduling link (Calendly/Google) per proposal that surfaces as a secondary CTA, and keep a soft fallback line for when scheduling is handled separately.

## What changes

### 1. Add an optional `creative_call_url` field to proposals

- New nullable `text` column on `public.proposals`: `creative_call_url`.
- Edit UI in the proposal editor (where event name / venue / date are edited) gets a new input: **"Creative call scheduling link (optional)"** with placeholder `https://calendly.com/...`.
- The field is purely informational — no validation beyond "looks like a URL".

### 2. Rewrite proposal email copy (HTML + plain-text)

Edit `supabase/functions/generate-session-email/index.ts` (the `type === 'proposal'` branch) and `buildPlainTextEmail` in `src/pages/AdminProposals.tsx`.

New tone — pre-call onboarding packet:

- **Heading**: "Your Proposal & Pre-Call Packet" (replaces "Your Project Proposal").
- **Intro**: "Ahead of our creative call, please take a few minutes to review the materials below. They'll get you acquainted with our process so we can hit the ground running on the call — choosing themes, line items, and content ideas for {event}."
- **"What's inside" section** rewritten to 4 rows, no fake "sign now" framing:
  - Line Item Menu — browse our full menu of services and pricing
  - Creative Guide — venue specs, LED zones, content delivery standards
  - Collect Assets folder — where you'll drop logos, references, brand assets
  - Timeline — key milestones leading up to the event
- **Primary CTA**: "Open Proposal & Menu →" (instead of "View Proposal").
- **Secondary CTA (only if `creative_call_url` is set)**: "Schedule Our Creative Call →" rendered as an outlined gold pill below the primary button.
- **Fallback line (only if `creative_call_url` is NOT set)**: small italic line under the primary CTA — "We'll reach out separately to schedule the creative call."
- **Closing paragraph** changes from "Please review and sign…" to: "Once you've had a chance to look through everything, we'll meet on the creative call to finalize themes, content, and the line items you'd like to include. The on-page signature stays available for whenever you're ready to lock things in."
- Keep the visible plain-URL fallback under the buttons. Keep header / footer branding unchanged.
- Subject line changes to: `Pre-Call Packet: {event} — {client}`.

Plain-text version mirrors the same structure (header, intro, 4 bullet menu, primary URL, optional schedule URL or fallback line, signed off as Soleia Creative Team).

### 3. Soften the on-page proposal copy (light touch)

`src/components/proposal/ProposalView.tsx` (and any "Sign now" affordances) gets a small banner at the top of the page:

> "This is your pre-call packet. Browse the line item menu, creative guide, and timeline below. We'll discuss themes and final selections together on our creative call — sign whenever you're ready."

The signature block itself is untouched (still functional). No layout or business-logic changes beyond the banner.

### 4. Email tool card surface (`ProposalEmailCard.tsx`)

Same copy + scheduling-link logic mirrored into the in-app "Copy Email" rich template card, so both entry points produce identical output.

## Out of scope

- No backend logic changes (signing, drive-folder creation, status transitions, queue, providers).
- No changes to creative-session emails, content delivery emails, or auth emails.
- No marketing/list emails — this remains a 1:1 transactional pattern.

## Verification

1. From `/admin/proposals`, open a proposal, paste a Calendly URL into the new field, save.
2. Tap **Copy Email** → paste into Gmail → see new heading, 4-row menu, primary "Open Proposal & Menu" button, secondary "Schedule Our Creative Call" pill, and visible fallback URL.
3. Clear the Calendly field, copy again → secondary button is gone, replaced by the small italic "we'll reach out separately" line.
4. Open the proposal page → new pre-call banner is visible at the top; signature block still works.
5. iOS Mail (plain-text fallback) shows the same structure with both URLs (or just the proposal URL + fallback line) and a clean signature.
