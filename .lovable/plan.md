## The Problem

When you tap **Copy Email** on a proposal (the mail-icon button in `/admin/proposals`) and paste into iOS Mail, you get a URL-encoded fragment of the subject line in the body — e.g. `Proposal:%20TranformanTEST%20%E2%80%94%20Fudale` — instead of the rich branded HTML.

### Root cause

The clipboard write in `AdminProposals.tsx → copyEmailTemplate` puts two parts on the clipboard:

- `text/html` → the full branded email
- `text/plain` → **just the subject line** (`Proposal: TranformanTEST — Fudale`)

iOS Mail's compose view does **not** accept `text/html` from the clipboard. It silently falls back to the `text/plain` part — which is the subject only — and renders it URL-encoded. So the user ends up with a meaningless body and no link, no logo, no CTA.

The other email cards (`ProposalEmailCard`, `CreativeSessionEmailCard`, `CollectAssetsEmailCard`, `MediaDownloadEmailCard`, `ClientAssetCollectEmailCard`) have the same bug pattern: their `text/plain` fallback is either the subject or the raw HTML source — neither is useful when pasted into iOS Mail.

## The Fix

Two changes, both frontend-only:

### 1. Make the plain-text clipboard fallback actually useful

In every "copy email" handler, set `text/plain` to a short, readable plain-text version of the message that always includes the proposal/session URL. So even when iOS Mail strips the HTML, the user gets something meaningful to send.

Files to update:
- `src/pages/AdminProposals.tsx` (`copyEmailTemplate`) — fetch URL from response or build it; plain text becomes:
  ```
  {Subject line}

  Hi {client},

  Your proposal is ready to review:
  {proposal URL}

  — Soleia Creative Team
  ```
- `src/components/admin/ProposalEmailCard.tsx` — same shape, using existing `proposalLink`.
- `src/components/admin/CreativeSessionEmailCard.tsx` — same shape, mention the project folder URL if present.
- `src/components/admin/CollectAssetsEmailCard.tsx`, `MediaDownloadEmailCard.tsx`, `ClientAssetCollectEmailCard.tsx` — same pattern, using the relevant link each card already has.

### 2. Add a second "Open in Mail app" button on iOS

Next to **Copy Email** in `AdminProposals.tsx`, add a small secondary button (envelope icon, label "Mail") that opens a `mailto:` link prefilled with subject + plain-text body + URL. This is the only reliable way to get content into iOS Mail compose with one tap.

```
mailto:?subject={subject}&body={plain-text body}
```

The button shows on all platforms but is the recommended path on iPad/iPhone (matches the existing mobile-first preferences). The Copy Email button continues to work for desktop (Gmail, Outlook web, Apple Mail desktop all paste rich HTML correctly).

## Out of Scope

- The HTML template itself — it's correct.
- The `generate-session-email` edge function — already returns clean HTML + subject.
- The `notify-proposal-signed` flow — separate path, not the one the user used.

## Verification

After the change:
1. Tap **Copy Email** on a proposal in `/admin/proposals` from iPad → paste into iOS Mail → body now contains the readable plain-text message + the proposal URL (not URL-encoded gibberish).
2. Tap **Mail** button → iOS Mail opens with subject + body + URL prefilled.
3. From desktop browser → paste into Gmail/Outlook still produces the full branded HTML.
