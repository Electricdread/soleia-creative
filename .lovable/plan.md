

## Plan: Fix Content Delivery Email Template Rendering on Desktop

### Problem
The email template uses `<div>` with `max-width:600px` for layout. Most desktop email clients (Gmail web, Outlook, Apple Mail) have poor support for `max-width` on divs and CSS properties like `linear-gradient`, `border-radius`, and `overflow:hidden`. This causes the email to collapse or only show the logo on desktop — it only renders correctly on mobile because mobile clients tend to be more standards-compliant.

### Solution
Rebuild the email HTML using **table-based layout** — the industry standard for cross-client email compatibility:

1. Wrap everything in a centered `<table>` with `width="600"` instead of a `<div>` with `max-width`
2. Convert each section (header, body, steps, footer) to `<tr>/<td>` cells
3. Replace `linear-gradient` backgrounds with solid dark color (`#111111`) since gradients are unsupported in Outlook
4. Replace `border-radius` on outer container (unsupported in Outlook) — keep it on inner elements where it degrades gracefully
5. Add `<!DOCTYPE>` and basic `<html><body>` wrapper with a centered outer table for full-width background
6. Use explicit `width`, `cellpadding`, `cellspacing` attributes on tables
7. Keep all existing content, steps, specs table, tips, CTA button, and footer intact

### Technical Details
- Outer structure: `<table width="100%" bgcolor="#f5f5f5">` containing a centered `<table width="600">`
- Header: `<td bgcolor="#111111" style="padding:40px 24px;text-align:center;">` with logo
- Body: `<td style="padding:32px 28px;background:#ffffff;">` with all step blocks
- Footer: `<td bgcolor="#111111">` with logo and contact
- CTA button uses the bulletproof button pattern (table-based) for Outlook compatibility

### File to Edit
- `src/components/admin/CollectAssetsEmailCard.tsx` — rewrite `buildAssetsEmailHtml` with table-based markup

