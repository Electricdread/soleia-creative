

## Plan: Proposal Admin Actions + Redesigned PDF Generator

### What We're Building
1. **Edit button** (pencil icon) on proposal cards — navigates to `/proposal/:token` with `?edit=true` (already exists)
2. **Link Creative Session button** (link icon) on proposal cards — opens a dialog to associate/unlink a creative session
3. **Copy Email Template button** (mail icon) on proposal cards — calls `generate-session-email` edge function with `type=proposal` and copies rich HTML to clipboard
4. **Redesigned Proposal PDF** — new `proposalPdfGenerator.ts` using jsPDF with optional cinematic cover page and compact single-page content layout

### Technical Details

**1. AdminProposals.tsx — Add Mail + Link icons to proposal cards**
- Add `Mail` icon button that fetches `generate-session-email?token=X&type=proposal` and copies the returned HTML to clipboard as rich text (same pattern as CreativeSessionCard)
- Add `Link2` icon button that opens a new `ProposalSessionLinker` dialog showing available creative sessions with link/unlink capability
- The edge function already supports `type=proposal` — no backend changes needed

**2. New component: `ProposalSessionLinker.tsx`**
- Dialog/sheet that shows available creative sessions from the database
- Displays current linked session if any, with an "Unlink" option
- On select, updates `proposals.session_id` and refreshes

**3. New file: `src/lib/proposalPdfGenerator.ts`**
- Uses jsPDF (already in project dependencies)
- **Cover page** (conditional — only if `gallery[0]` exists):
  - Dark background (#1a1a1a)
  - Soleia logo centered at top
  - Full-bleed gallery image
  - Event title, client name, venue, date overlaid in white text
- **Content page** (always present):
  - Dark header band with Soleia logo + "PROPOSAL" badge
  - Compact scope table: Item / Type / Price columns
  - Timeline row with dot indicators (horizontal compact layout)
  - Terms in 2-column layout
  - Grand total prominently displayed
  - Signature block if signed

**4. ProposalView.tsx — Replace `window.print()` with PDF generator**
- Import and call `generateProposalPdf()` passing proposal data, items, timeline, and first gallery image
- Remove the `window.print()` call

### Files to Create
- `src/lib/proposalPdfGenerator.ts`
- `src/components/admin/ProposalSessionLinker.tsx`

### Files to Edit
- `src/pages/AdminProposals.tsx` — add Mail and Link2 icon buttons to each proposal card
- `src/components/proposal/ProposalView.tsx` — replace print with PDF generator

