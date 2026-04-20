
The PDF has overlapping/stumbling text. Looking at the screenshot:
- "Creative Direction, 4K Content Creation & LED Video Mapping (McDonald's Very Good Trip Experience)" — the title and description are overlapping
- "5 ELEVATORS - GUESTS FACING VIDEO SCREEN..." section header overlaps with description text above it
- "TV SCREENS IN CABANAS & BUNGALOWS" overlaps with "1 x Variation for a logo animation, another style,"
- Description text bleeds into the next row

Root cause: the PDF generator is using fixed Y-position increments per row instead of measuring the actual height of wrapped description text and section headers before advancing.

Let me check the generator.

## Plan: Fix proposal PDF text overlap & fit to one page

### Problem
In `proposalPdfGenerator.ts`, each line item advances `y` by a fixed amount, but descriptions wrap to multiple lines and section headers ("IMMERSIVE LED ENVIRONMENT", etc.) inject extra rows without recalculating row height. Result: rows draw on top of each other.

### Fix
1. **Measure before drawing** — for every row, use `doc.splitTextToSize()` on the description to compute wrapped line count, then compute total row height = title line + (descLines × lineHeight) + padding.
2. **Section group headers** — render as their own measured block (gold uppercase, ~14pt height + spacing) and advance `y` by that block's height before drawing the first item beneath it.
3. **Column alignment** — use fixed X anchors:
   - Item column: left margin → 60% width (title + wrapped description constrained to this width)
   - Type column: 60–80%, right-aligned to its column
   - Price column: 80–100%, right-aligned to page margin
   Description wraps within the item column width, never bleeding into Type/Price.
4. **Single-page fit** — tighten vertical rhythm: reduce row padding from current spacing to 4pt, description font 8.5pt with 1.15 line-height, section header spacing 6pt above / 3pt below. Header band, title block, table, total bar, timeline, and terms must all fit on one US Letter page.
5. **Total bar / timeline / terms** — anchor each to a computed Y based on table end height, not a hardcoded position, so a shorter or longer table doesn't push them off-page.
6. **QA** — generate a test PDF, convert to image with `pdftoppm`, visually verify no overlaps and one-page layout. Iterate until clean.

### Files
- `src/lib/proposalPdfGenerator.ts` — measurement + layout rewrite
- No DB or schema changes
