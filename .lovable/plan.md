## Goal

Add an **Assigned Project Manager** to every proposal, and when the client signs, automatically email the signed PDF to (a) the client, (b) the assigned project manager, and (c) Luis (cc).

## Scope

1. Data model: store the assigned PM on each proposal.
2. Admin UI: pick a PM when creating/editing a proposal; show PM on the list and detail views.
3. Client signing flow: on successful sign, generate the signed PDF and send it via email to the client + PM + Luis.
4. Email template: branded Soleia confirmation with the PDF attached and a link back to the proposal.

## Phase 1 — Data model

Add columns to `public.proposals`:
- `assigned_pm_id uuid` — references `auth.users(id)` (nullable; can be unassigned)
- `assigned_pm_name text` — denormalized snapshot for emails/PDFs in case the user is removed later
- `assigned_pm_email text` — same reason; this is the actual recipient

No RLS changes needed (existing admin-write / public-read-by-token policies still apply). GRANTs already cover the table.

A small admin-only RPC `list_admin_users()` returning `{ user_id, email, display_name }` from `profiles` joined to `user_roles` where `role = 'admin'`, so the PM picker has a clean list without exposing all users.

## Phase 2 — Admin UI

In `AdminProposals.tsx` proposal create/edit form:
- New **Assigned Project Manager** dropdown populated from `list_admin_users()`.
- Saving the proposal writes `assigned_pm_id`, plus snapshots `assigned_pm_name` and `assigned_pm_email` from the chosen profile.
- Proposal list row shows a small "PM: Luis Dreams" chip; rows without a PM show an amber "Unassigned" chip so nothing slips through.
- Reset Signature button is unchanged.

## Phase 3 — Signed-PDF email on client signing

Touchpoints:
- `ClientProposal.tsx` / `ProposalView.tsx` `handleSign`: after `sign_proposal_by_token` succeeds, generate the PDF using the existing jsPDF generator, then invoke a new edge function `send-signed-proposal` with `{ proposalId, pdfBase64 }`.
- New edge function `supabase/functions/send-signed-proposal/index.ts`:
  - Verifies the proposal is actually `accepted` and `signed_at IS NOT NULL` (server-side guard so this can't be abused).
  - Loads client email, `assigned_pm_email`, and Luis's address (hardcoded fallback or `site_settings`).
  - Sends one email via the existing app-email pipeline (`send-transactional-email`) using a new template `signed-proposal-confirmation`, with the PDF as an attachment.
  - Logs to `email_send_log` with `idempotencyKey = signed-proposal-<proposalId>` so re-signs/retries don't duplicate.

Note on attachments: the shared transactional pipeline doesn't support attachments today. To keep this clean and reliable, the edge function will instead:
1. Upload the PDF to a new private `signed-proposals` storage bucket at `proposals/<id>/<timestamp>.pdf`.
2. Generate a 30-day signed URL.
3. Send the email with a prominent **Download signed PDF** button pointing at the signed URL (plus a link back to the live proposal page).

This avoids inbox-attachment size/spam issues and gives a stable re-downloadable link.

## Phase 4 — Email template

New React Email template `supabase/functions/_shared/transactional-email-templates/signed-proposal-confirmation.tsx`:
- Soleia gold-on-white header, DM Serif heading "Proposal Signed".
- Body: "Thank you, {clientName}. Your proposal for {eventName} has been signed and accepted."
- Event details block (date, totals).
- **Download Signed PDF** button (gold).
- **View Proposal Online** secondary link.
- Footer: "Your Soleia Project Manager: {pmName} — {pmEmail}".
- Registered in `registry.ts`.

Recipients: `to` = client; `cc` = PM email + Luis. Single send, single log row per signed proposal.

## Phase 5 — Backfill & safety

- One-time data migration leaves `assigned_pm_*` null on existing proposals (Unassigned chip surfaces them).
- If a proposal is signed with no PM assigned, the email still goes out to client + Luis, and Luis gets an extra warning line "No PM was assigned to this proposal" so it can be fixed.
- Admin Reset Signature flow stays as-is; re-signing re-sends the email (idempotency key includes `signed_at` timestamp to allow exactly one send per signing event).

## Out of scope

- Reassigning PM after signing doesn't re-send the email (manual resend button can be added later if you want).
- No PM-side dashboard or notifications panel — email only for now.
- No change to the proposal PDF layout itself beyond adding "Project Manager: {name}" under the signature block.

## Files touched

- Migration: `proposals` columns + `list_admin_users` RPC + `signed-proposals` storage bucket
- `src/pages/AdminProposals.tsx` — PM picker, chips
- `src/components/proposal/ProposalView.tsx` + `src/pages/ClientProposal.tsx` — invoke `send-signed-proposal` after sign
- `src/lib/proposalPdf.ts` (existing PDF generator) — add PM line to signature block
- `supabase/functions/send-signed-proposal/index.ts` — new
- `supabase/functions/_shared/transactional-email-templates/signed-proposal-confirmation.tsx` — new
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — register new template
