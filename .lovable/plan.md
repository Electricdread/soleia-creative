## Problem

The Print and Download PDF buttons already exist in `src/pages/AdminProposals.tsx` (lines 260–299), but they only appear inside the **Item Library** tab. On the current ~677px viewport the page header is a single non-wrapping flex row containing:

- Soleia logo
- "Client Proposals" title
- Proposals tab button
- Item Library tab button
- Settings icon

At narrow widths this row overflows and the "Item Library" tab gets clipped / pushed off the visible area, so the user can never switch to the tab where the PDF buttons live. Result: "the PDF print button is not visible."

## Fix

### 1. Make the header responsive (`src/pages/AdminProposals.tsx`, header around lines 222–250)

- Allow the header bar to wrap: change the inner row to `flex-wrap gap-3` and stack the title row above the tab row on small screens.
- Hide the "Client Proposals" text label below `sm:` (keep the logo) so the tabs always fit.
- Ensure the Proposals / Item Library tabs render as a self-contained group that wraps to a second line on mobile rather than getting clipped.

### 2. Make the buttons obvious in the library view (lines 254–302)

- Keep both buttons in the card header, but on mobile let the header stack vertically (`flex-col sm:flex-row`) so the buttons sit on their own full-width row instead of squeezing next to the title.
- Give both buttons `w-full sm:w-auto` on mobile for an easy 44px tap target.

### 3. (Optional polish) Surface a quick-access PDF action

When `activeTab === 'library'`, also show a small Download PDF icon button in the page header next to "Item Library" so the action is reachable without scrolling. Reuses the existing `downloadLineItemLibraryPdf` helper.

## Files to modify

- `src/pages/AdminProposals.tsx` — header wrap behavior + library card header responsive layout (no logic changes, no new dependencies).

No DB changes, no edge functions, no new files.
