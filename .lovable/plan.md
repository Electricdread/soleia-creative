

## Plan: Proposal Admin Actions and Redesigned PDF

### What We're Building
1. **Email Template button** on each proposal card in AdminProposals — calls the existing `generate-session-email` edge function with `type=proposal` and copies rich HTML to clipboard
2. **Link Creative Session icon** on each proposal card — quick-link button that opens the proposal in edit mode with session linking focused
3. **Proposal PDF Generator** (`src/lib/proposalPdfGenerator.ts`) — a new jsPDF-based PDF that replaces `window.print()` with a professionally designed document

### PDF Design
- **Optional Cover Page**: When gallery images exist, page 1 is a full-bleed dark cinematic cover with the DSX logo, event title, client name, venue, and date overlaid. Page 2 begins the content.
- **No gallery = single content page** (no cover)
- **Content Page Layout**:
  - Dark header band (#1a1a1a) with Soleia logo, "PROPOSAL" badge, and company name
  - Compact scope table: Item / Type / Price columns
  - Timeline row with dot indicators (compact horizontal layout)
  - Terms in 2-column layout to save vertical space
  - Total prominently displayed
  - Signature block if signed

### Technical Details

**Files to create:**
- `src/lib/proposalPdfGenerator.ts` — new PDF generator using jsPDF following patterns from `pdfGenerator.ts`

**Files to edit:**
- `src/pages/AdminProposals.tsx` — add Mail icon button to each proposal card that calls `generate-session-email?token=X&type=proposal` and copies HTML to clipboard
- `src/components/proposal/ProposalView.tsx` — replace `window.print()` with the new PDF generator; pass gallery data to it

**Edge function:** No changes needed — `generate-session-email` already handles `type=proposal`

### Implementation Steps
1. Add email template copy button to AdminProposals proposal cards (Mail icon, calls edge function, copies rich HTML)
2. Create `proposalPdfGenerator.ts` with cover page logic and compact content layout
3. Update ProposalView's Print PDF button to use the new generator instead of `window.print()`

