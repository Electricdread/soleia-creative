## Plan

Remove the "Sum of listed prices" total from the Line Item Library PDF (both Print and Download).

## Change

In `src/lib/lineItemLibraryPdf.ts`:
- Remove the running `total` accumulation inside the item loop.
- Remove the footer block that draws the gold divider, "Sum of listed prices" label, and total amount.
- Keep page numbers and the `soleiacreative.app` footer intact.

No other files affected. No DB or dependency changes.