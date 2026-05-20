## Add Creative Guide AE Template link to proposal emails

Add a new bullet inside the "What You'll Find Inside" block of both proposal-email surfaces, pointing clients to the Creative Guide page (Display Specs section) where the After Effects template + pixel maps live.

### 1. `src/components/admin/ProposalEmailCard.tsx`

In `buildProposalEmailHtml`, inside the "What You'll Find Inside" `<table>` (currently 4 rows: Scope, Timeline, Pricing, Signature), add a 5th row:

- Icon: 🎬 (`&#127916;`) — matches the icon already used for Creative Guide in the session email
- Label: **Creative Guide & AE Template** — venue specs, LED zones, and downloadable After Effects project file
- The bold label is a link to `https://soleiacreative.app/creative-guide#display-specs` (opens in new tab)

### 2. `supabase/functions/generate-session-email/index.ts`

The "What's inside" list (line ~142) already has a plain-text Creative Guide row. Upgrade it to a hyperlinked row using the same URL so clients can jump straight to the AE template download.

### 3. Anchor on the Creative Guide page

Verify `src/components/creative-guide/DisplaySpecsView.tsx` (or its wrapper section in `CreativeGuideView`) has an `id="display-specs"` anchor. If missing, add it to the section wrapper so the email hash link scrolls to the AE Template download card.

### Out of scope

- No changes to the AE template file itself, the Creative Guide page content, or proposal PDF.
- No new database fields, no edge-function secrets, no subdomain work.
- Other email templates (asset collect, session invite, delivery guide) are untouched.
