# Fix card elevation / layering

**Problem.** In light mode `--card` and `--background` are both pure white, so `bg-card` is invisible against the page and `shadow-md` (a black-tinted shadow on white) reads as a faint hairline. In dark mode `bg-card` is only marginally lighter than `bg-background`, and Tailwind's default black shadows disappear entirely on a near-black surface.

## Changes

1. **`src/index.css` — add elevation tokens**
   - Light theme: add `--surface: 30 25% 97%` (warm off-white page wash) and `--shadow-card: 0 1px 2px hsl(220 15% 15% / 0.06), 0 8px 24px -8px hsl(220 15% 15% / 0.12)`, `--shadow-card-hover: 0 2px 4px hsl(220 15% 15% / 0.08), 0 18px 40px -12px hsl(220 15% 15% / 0.18)`.
   - Dark theme: override `--surface: 30 15% 4%` (slightly darker than `--card` so cards lift), and `--shadow-card: 0 1px 0 hsl(45 40% 70% / 0.05) inset, 0 1px 2px hsl(0 0% 0% / 0.5), 0 12px 32px -10px hsl(0 0% 0% / 0.7)`, `--shadow-card-hover: 0 1px 0 hsl(45 40% 70% / 0.08) inset, 0 2px 4px hsl(0 0% 0% / 0.6), 0 22px 48px -12px hsl(0 0% 0% / 0.85), 0 0 0 1px hsl(45 60% 50% / 0.12)`.
   - Add utility classes:
     ```css
     .shadow-card { box-shadow: var(--shadow-card); }
     .shadow-card-hover:hover { box-shadow: var(--shadow-card-hover); }
     .bg-surface { background-color: hsl(var(--surface)); }
     ```

2. **`tailwind.config.ts`** — register `surface: 'hsl(var(--surface))'` under `colors` so `bg-surface` is a real Tailwind utility (alternative to the CSS class above; pick one — prefer Tailwind registration for consistency).

3. **`src/pages/ClientProposal.tsx`** — none (wrapper is `ProposalView`).

4. **`src/components/proposal/ProposalView.tsx`**
   - Change page wrapper `min-h-screen bg-[#f8f9fa]` (already swept to `bg-background` earlier) → `min-h-screen bg-surface` so cards have something to lift off in light mode.
   - Replace all `shadow-md hover:shadow-lg transition-shadow` on the card divs (lines 386, 512, 652, 831, 838, 885) with `shadow-card hover:shadow-card-hover transition-shadow duration-300`.

5. **`src/components/proposal/ProposalGallery.tsx`, `ProposalTimeline.tsx`, `ProposalTerms.tsx`, `ProposalApprovedClips.tsx`** — same shadow-token swap on any card containers using `bg-card … shadow-md`.

## Out of scope
- Other admin/client pages (not reported as broken). Tokens are added globally so future swaps are one-line.
- PDF generator, emails, shadcn `Card` primitive default styling.

## Acceptance
- Light mode: proposal cards sit on a warm off-white wash with a soft, visible drop shadow; hover lifts noticeably.
- Dark mode: cards read as a distinct lifted plane above the page, with a subtle gold-tinted inner highlight and a deeper ambient shadow on hover.
- No hardcoded hex colors introduced; everything routed through HSL tokens.
