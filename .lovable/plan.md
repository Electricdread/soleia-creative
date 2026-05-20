## Goal

1. Add an **After Effects Template** tile to the Pre-Call Resources grid in the client proposal view, matching the existing tile style.
2. Fix the `#display-specs` / `#ae-template` navigation so it scrolls to the **top of the Display Specs page** (not centered on the LED card at the bottom).

---

### 1. `src/components/proposal/ProposalView.tsx`

- Import `Sparkles` (or `Download`) icon from lucide-react alongside the existing `BookOpen`, `FolderOpen`, etc.
- Inside the Pre-Call Resources grid (around line 987), add a new `Tile` between **Creative Guide** and **Collect Assets Folder**:
  - Icon: `Sparkles`
  - Title: `After Effects Template`
  - Subtitle: `Download the LED AE project file.`
  - `href`: `/creative-guide#ae-template`
- Keep the grid `grid-cols-1 sm:grid-cols-2 gap-3` — it already wraps cleanly with 4–5 tiles.

### 2. `src/components/creative-guide/DisplaySpecsView.tsx`

Adjust the hash-arrival behavior so the page lands at the top with the AE card clearly highlighted, instead of centering on the LED card (which is far down the page).

- In the `useEffect` that reads the hash (around line 315–322):
  - Remove the LED-card `scrollIntoView` trigger (or set it to `block: 'start'` only for `#ae-template`, but easier: drop it entirely from `DisplayCard`).
  - Instead, scroll the **window to top** (`window.scrollTo({ top: 0, behavior: 'smooth' })`) so the user sees the "After Effects Template Ready" banner first.
- In `DisplayCard` (around line 59–70): remove the `cardRef.current.scrollIntoView(...)` call. Keep the `ring` + `shadow` highlight styling on the LED card so it still pulses visually when the user scrolls down.
- Keep the dismissible AE banner at the top of the Display Specs page — it's the primary CTA on hash arrival.

### Out of scope

- No changes to proposal email templates (the `/creative-guide#display-specs` link in emails still works and now lands at the top of the page with the banner visible).
- No changes to `CreativeGuideView.tsx`, `creativeGuide.ts`, or backend.
- No new assets.
