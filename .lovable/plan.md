On `/creative-guide/services`, the Creative Package blurb is visually spread out because its internal section headings (`Built by a Team Proven in Immersive Experiences`, `What We Deliver`, `Why It Matters`) are rendered as plain text inside a single `whitespace-pre-wrap` paragraph, blending into the body copy.

### What we will do

1. Keep the existing wording exactly as-is — no rewrite of the copy.
2. Refactor the `The Full Soleia Creative Package` blurb rendering in `src/pages/CreativeGuideServices.tsx` so each logical section becomes a discrete block with a bold heading.
3. Implement by splitting the blurb into structured segments (intro + bold heading + body paragraph) and rendering them with proper spacing, so the page has clearer hierarchy and feels more compact.

### Deliverable

- Updated `src/pages/CreativeGuideServices.tsx` where the Creative Package card displays:
  - **Bold** section headings (`Built by a Team Proven in Immersive Experiences`, `What We Deliver`, `Why It Matters`) as distinct headings.
  - The existing body text preserved word-for-word.
  - A tighter, more scannable layout.