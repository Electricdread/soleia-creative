# Plan: Card stacking above surrounding panels

Shadows on `bg-card` blocks can be visually clipped or flattened when a parent panel paints over them, or when sibling sections sit in the same stacking context with no z-axis order. The fix is to give cards an explicit positioned stacking context that lifts them above ambient surfaces, while keeping the surrounding wrappers as the lower "tray".

## Changes

### 1. `src/index.css` — utility helpers

Add two small utilities under `@layer components`:

- `.card-elevated` — applies `position: relative; z-index: 1; isolation: isolate;` so every card creates its own stacking context and paints above neighboring panels without affecting layout.
- `.panel-base` — applies `position: relative; z-index: 0;` for wrapper sections (`bg-surface`, `bg-background`, gradient bands) so they sit beneath elevated cards even when they have their own backgrounds.

This works in both light and dark themes since z-index is theme-agnostic; combined with the existing `--shadow-card` tokens, shadows will no longer be visually cut by adjacent backgrounds.

### 2. Proposal components — apply the utilities

In the proposal view (the surface where the user reported the issue), add `card-elevated` to every `bg-card … shadow-card` container and `panel-base` to the outer section wrappers:

- `src/components/proposal/ProposalView.tsx`
  - Outer `bg-surface` wrapper → add `panel-base`.
  - Each `bg-card … shadow-card` div (header, line items mobile/desktop wrappers, totals, signature, terms section, etc.) → add `card-elevated`.
- `src/components/proposal/ProposalTimeline.tsx` — add `card-elevated` to the `bg-card` wrapper.
- `src/components/proposal/ProposalTerms.tsx` — add `card-elevated` to the `bg-card` wrapper.
- `src/components/proposal/ProposalApprovedClips.tsx` — add `card-elevated` to the clip tiles that use `shadow-card`.
- `src/components/proposal/ProposalGallery.tsx` — add `card-elevated` to any `bg-card` containers.

## Out of scope

- No color, spacing, or layout changes.
- No changes to admin pages, emails, or PDF generators.
- No edits to the shadcn `Card` primitive (keeps global side effects out).

## Technical notes

- `isolation: isolate` is the key piece: it forces a new stacking context so backdrop blends, `bg-card/80`, and parent `overflow-hidden` panels cannot flatten the card's shadow.
- z-index values are kept tiny (0 / 1) to avoid fighting modals, popovers, or sticky headers that already use higher layers.
