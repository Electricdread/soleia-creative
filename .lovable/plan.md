## Brighten Proposal Client Email

Update `src/components/admin/ProposalEmailCard.tsx` (the `buildProposalEmailHtml` function) so the email reads as a light, airy version of the current layout. No structural changes — same content, same CTA, same fallback link, same Show/Hide preview behavior.

### Changes

**Outer canvas**
- Outer wrapper background: `#f3f1eb` → `#ffffff`
- Inner card border: keep `#e5e5e5` for definition on white-on-white clients

**Header band (was solid black `#111111`)**
- Background: `#faf8f4` (warm cream)
- Bottom border: `1px solid #e8dfc9` (soft gold hairline) for separation
- Logo: swap `soleia-logo-color.png` → use the same asset but it already renders on cream; keep `width:180`, `height:60`
- Add a small uppercase tagline under the logo: `CREATIVE TEAM` in `#B8860B`, `letter-spacing:2px`, `font-size:11px`

**Body**
- Keep white background, dark text (already light-friendly)
- "Event Details" callout: change `background:#faf8f4` → `#fdfbf6`, keep gold left border
- "What You'll Find Inside" panel: change `background:#f9f9f9` → `#faf8f4` for warmth consistency

**Footer band (was solid black `#111111`)**
- Background: `#faf8f4`
- Top border: `1px solid #e8dfc9`
- Logo opacity: remove (`opacity:0.85` → none) since it's now on light bg
- "Creative Team" text color: keep `#B8860B`
- Email link color: `#888888` → `#666666` for contrast on cream

### Out of scope
- No changes to copy, CTA wording, link structure, or the React component shell.
- No changes to other email templates (asset collect, session invite, delivery guide).
- No changes to the proposal page itself or the PDF generator.
