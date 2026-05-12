## Goal

Reword the proposal's workflow/timeline language across the on-page proposal, the default timeline rows, the PDF, and the proposal email to clearly state the post–creative-call workflow:

> Work begins only after (a) the proposal is signed and (b) all client brand assets are received. From that point: 14 days to create and deliver for review → client has 3 days to review → 1 included revision → all revision requests must reach us no later than 4 days before the event.

## Edits

### 1. `src/components/proposal/ProposalTerms.tsx`
Rewrite the **Revisions** block and add a new **Production Workflow & Timeline** block at the top of Terms:

- **Production Workflow & Timeline** (new, first block):
  - Work does not begin until the proposal is signed off **and** all client brand assets have been received. Both must be in hand to start the clock.
  - Once both conditions are met, we have **14 days** to create and deliver the first review cut.
  - Client then has **3 days** from delivery to submit consolidated review notes.
  - Final revision requests must reach us **no later than 4 days before the event** so we can apply, render, and deliver in time.
- **Revisions** (rewrite):
  - Includes **one** revision round within the approved creative direction.
  - Notes must be submitted in writing within the 3-day review window.
  - Requests received later than 4 days before the event cannot be guaranteed.
  - Concept/direction changes or new components require a new quote.

### 2. `src/components/proposal/ProposalView.tsx` — Asset Deadline section (≈ lines 859–870)
Reword to match: "All client brand assets must be delivered before work can begin. Production starts only once the proposal is signed and assets are received — we then have 14 days to deliver the first review."

### 3. `src/pages/AdminProposals.tsx` — default `proposal_timeline` rows (≈ lines 156–161)
Replace defaults with:
1. `Kickoff Conditions` — `Sign-off + Assets` — Work begins only after the proposal is signed and all brand assets are received.
2. `Content Creation` — `14 Days` — From kickoff, first review cut delivered within 14 days.
3. `Client Review` — `3 Days` — Client has 3 days from delivery to submit consolidated revision notes.
4. `Revision & Final Delivery` — `1 Revision` — One revision round; final notes due no later than 4 days before the event.

(Existing proposals keep their stored timeline; only new proposals get the new defaults.)

### 4. `src/lib/proposalPdfGenerator.ts` — terms array (≈ lines 429–436)
Update the bullet list to mirror the new workflow:
- Work begins only after sign-off and asset delivery.
- 14 days from kickoff to first review cut.
- Client review window: 3 days from delivery.
- One included revision round.
- Final revision requests due ≥ 4 days before event.
- Creative licensing covers event duration only.

### 5. `supabase/functions/generate-session-email/index.ts` — proposal email "What's inside" / Timeline row
Update the "Timeline" line in the pre-call packet to read: *"After sign-off + assets: 14 days to deliver, 3 days to review, 1 revision, final notes due 4 days before event."* Mirror the same one-liner in the plain-text fallback in `AdminProposals.tsx` (`buildPlainTextEmail`) and `ProposalEmailCard.tsx`.

## Out of scope
- No DB schema changes.
- No changes to creative-session, delivery-guide, or creative-guide copy (those keep the legacy 21-day language used elsewhere).
- No changes to existing proposals' stored timeline rows.
