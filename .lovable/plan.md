## Goal

Allow individual proposals to opt out of the "Pre-Call Packet" framing — for clients where the proposal is sent as a straight quote (no creative call, no pre-call resources block, no "pre-call" wording in the email).

## What changes

### 1. Database
Add a per-proposal toggle:
- New column `proposals.is_pre_call_packet boolean not null default true`
- Default `true` keeps every existing proposal behaving exactly as today

### 2. Client proposal page (`src/components/proposal/ProposalView.tsx`)
When `is_pre_call_packet === false`:
- Hide the gold "Pre-Call Packet" banner (lines 452–462)
- Hide the `<PreCallResources>` block (creative call link / drive folder / collect assets, lines 464–469)
- Everything else (line items, gallery, timeline, terms, signature) is unchanged

### 3. Email template + subject (`src/pages/AdminProposals.tsx` + `supabase/functions/generate-session-email/index.ts`)
When the proposal has `is_pre_call_packet === false`:
- Subject: `Proposal: {event_name} — {client_name}` (instead of `Pre-Call Packet: …`)
- Header heading: `Your Proposal` (instead of `Your Proposal & Pre-Call Packet`)
- Body intro: short version that says "please review the proposal below and sign when you're ready" — drops the "ahead of our creative call / hit the ground running" paragraph, the "What's inside" bullet list, and the creative-call scheduling block
- HTML email (`generate-session-email`) mirrors the same conditional — it already loads the proposal row, so it can read the new flag

### 4. Admin UI (`src/pages/AdminProposals.tsx`)
Add a small toggle on each proposal card (next to the existing status / public toggle controls) labelled **"Pre-call packet"** — on by default, off = straight quote mode. Flipping it just updates `proposals.is_pre_call_packet` and refreshes the row.

### 5. New-proposal form
Wherever proposals are created (admin "New Proposal" flow), no UI change needed — the column defaults to `true`. Admin can toggle it off afterwards on the card.

## Out of scope
- No change to the Drive folder creation flow (signed proposals still get the same `Soleia Clients/<Client> — <Event>/` folder with the 3 subfolders and uploaded assets)
- No change to PDF generation
- No change to terms, gallery, timeline, or signature logic
- No new email template — same template branches on the flag

## Technical details

```text
Migration:
  alter table public.proposals
    add column if not exists is_pre_call_packet boolean not null default true;
```

`ProposalView.tsx` — wrap the existing `{!signed && !isProposalClosed(proposal) && (…)}` block with an extra `proposal.is_pre_call_packet !== false` check.

`AdminProposals.tsx` — `buildPlainTextEmail` and `openInMailApp` take the proposal row (already do); branch on `proposal.is_pre_call_packet` to choose subject + body variant.

`generate-session-email/index.ts` — when `type=proposal`, read `is_pre_call_packet` from the already-fetched proposal row and pick the heading + body variant accordingly.
