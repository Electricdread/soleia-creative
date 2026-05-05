## Plan

The Print / Download PDF controls currently only render after switching into the **Item Library** tab. Since you still cannot see them, I’ll make the PDF action visible directly on the proposal page instead of hiding it behind that tab.

## Changes to make

1. **Add a clearly visible “Item Library PDF” button near the top of the Proposals page**
   - Place it beside the existing **New Proposal** button when viewing the main Proposals tab.
   - This button will open a small menu or action row with:
     - **Print Item Library**
     - **Download PDF**
   - This means you do not need to find or open the Item Library tab first.

2. **Keep the existing buttons inside the Item Library tab**
   - The current Print and Download PDF buttons will remain in the Item Library section.
   - The new top-level button will reuse the same PDF generation logic, so both places create the same document.

3. **Make the controls responsive and obvious**
   - On tablet/mobile, the buttons will stack full-width under **New Proposal**.
   - On desktop, they will sit cleanly in the top action area.
   - Use the gold Soleia accent for the download action so it stands out.

## Technical details

- Modify `src/pages/AdminProposals.tsx` only.
- Add a shared helper inside the component to fetch `line_item_templates` once and then call either:
  - `printLineItemLibraryPdf(...)`
  - `downloadLineItemLibraryPdf(...)`
- Reuse the existing `src/lib/lineItemLibraryPdf.ts` generator.
- No database changes.
- No new dependencies.

## Result

When you open `/admin/proposals`, the item library PDF print/download control will be visible near the top of the main proposal screen immediately, without needing to locate the Item Library tab.