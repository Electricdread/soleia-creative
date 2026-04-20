
## Fix proposal PDF cover page text overlap

### Problem
On the cover page of `proposalPdfGenerator.ts`, the event title is drawn with `maxWidth: CONTENT_W` so jsPDF wraps long titles to multiple lines — but the subtitles ("Prepared for…", "at <venue>", date) are positioned at fixed offsets (`+30`, `+48`, `+68`) from the title baseline. When the title wraps to 2+ lines, the second line draws on top of the subtitles, producing the unreadable mess in the screenshot.

A second related issue: when the title is long enough to wrap, the 32pt font also gets visually crowded against the cover image above.

### Fix
In `generateCoverPage`:

1. **Measure the wrapped title before drawing.** Use `doc.splitTextToSize(proposal.event_name, CONTENT_W - 40)` to get the actual line array, then compute total title height = `lines.length × lineHeight`.

2. **Auto-shrink long titles.** If the title wraps to more than 2 lines, drop the font size from 32pt → 26pt → 22pt until it fits in ≤2 lines (or cap at 3 lines max). This keeps the cover balanced.

3. **Anchor subtitles below the measured title block.** Replace fixed `bottomY + 30/48/68` offsets with a running `cursorY` that starts at `titleEndY + 18` and increments based on each subtitle's actual line height.

4. **Reserve a fixed bottom band for the text block.** Pin the title block so the entire text group (title + "Prepared for" + venue + date) is bottom-anchored: compute total text-block height first, then set `startY = PAGE_H - 80 - totalTextH` so the date always sits ~80pt above the page bottom and the title grows upward.

5. **Add a soft dark scrim behind the text band** (a semi-transparent dark rectangle covering the bottom 25% of the cover image area) so text is readable even when the cover image is bright/busy — this also visually separates text from the image like the original design intent.

### Files
- `src/lib/proposalPdfGenerator.ts` — rewrite `generateCoverPage` text-block layout (lines ~117–140)

### QA
After the change, generate a test PDF for the McDonald's proposal (long title) and a short-title proposal, convert page 1 to image with `pdftoppm`, and visually verify no overlap on either.
