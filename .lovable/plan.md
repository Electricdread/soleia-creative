# Restore Venue Contract Inclusions Disclaimer

The "Included in your venue contract" band still renders in the PDF (`proposalPdfGenerator.ts`), but it was removed from the client-facing on-screen proposal (`ProposalView.tsx`). Bring it back so clients see it before the optional services list.

## Change

**File:** `src/components/proposal/ProposalView.tsx`

Insert a cream/gold accent card just above the "Additional Services" section label (around line 595), matching the PDF band content:

- Small gold eyebrow: `INCLUDED IN YOUR VENUE CONTRACT`
- Two bullets:
  - Up to 10 static logos — LED screens
  - 1 static logo — all TVs, Cabanas & Bungalows

Styled with semantic tokens (bg-muted/40, gold left border via `border-l-2 border-primary`, small text), consistent with the existing card aesthetic. No logic changes, no PDF changes.
