

## Diagnosis: Toggles ARE there — but they're invisible/cramped

Both toggles exist in code:
- **Creative Sessions** (`CreativeSessionCard.tsx` lines 274-289): tiny `scale-75` Switch + "Live" label squeezed alongside Public switch + 6 other buttons in one horizontal row
- **Proposals** (`AdminProposals.tsx` lines 478-481): tiny `scale-75` Switch + "Live" label squeezed alongside 7 icon buttons

**Why you can't see them:**
1. Switch is shrunk to 75% size (~18×33px)
2. Label says "Live" — reads like a status word, not a toggle
3. Crammed at the start of a 7–8-button action row that overflows on narrow viewports (your viewport is 881px)
4. No visual separation from the surrounding buttons

## Plan: Make Active/Inactive toggle prominent and obvious

### 1. `CreativeSessionCard.tsx` — Promote toggle to header area
Move the **Active** switch out of the cramped action row and into the **top of the card**, next to the title:
- Full-size switch (no `scale-75`)
- Clear label: **"Active"** (not "Live")
- Right-aligned with the title row, so it's the first thing you see
- Keep the existing badge (Active/Inactive dot) below for at-a-glance state

### 2. `AdminProposals.tsx` — Promote toggle to title row
Same treatment on each proposal row:
- Move Active switch out of the icon-button cluster
- Place it in the title block, right side, full size, labeled **"Active"**
- Keep the green/red badge as confirmation

### 3. Visual treatment
```text
┌─────────────────────────────────────────────────┐
│ Project Name                    [Active ●━━━]   │  ← prominent toggle
│ Client • Date                                    │
│ ● Active   🌐 Public                             │  ← status badges
│ ─────────────────────────────────────────────── │
│ [Public ▢] [✉] [Edit] [Share] [Link] [↗] [🗑]   │  ← action row (no Live toggle here)
└─────────────────────────────────────────────────┘
```

### Files
- `src/components/admin/CreativeSessionCard.tsx`
- `src/pages/AdminProposals.tsx`

No DB or behavior changes — toggle wiring already works. This is purely a visibility/UX fix.

