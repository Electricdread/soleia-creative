

## Plan: Consolidate duplicate link buttons & isolate the delete button

### Problem
Both the Creative Session card and Proposal row have **multiple buttons that all point to the same URL**, plus the **Trash/Delete sits flush against the "Open" button**, making accidental deletion easy.

### Duplicates identified

**Creative Session card** — current action row:
`[Public toggle] [Mail] [Edit] [Share] [Link] [↗ Open] [🗑 Delete]`
- `Share` (copyOgShareLink) and `Link` (onCopyLink) **both copy URLs for the same session** — just OG-wrapped vs direct.

**Proposal row** — current action row:
`[Mark Sent] [Edit] [Link2 session] [Mail] [Share] [Copy] [↗ Open] [🗑 Delete]`
- `Share` (OG wrapper) and `Copy` (direct link) **both copy URLs for the same proposal**.

In both, the trash icon is the rightmost ghost button immediately adjacent to the Open ↗ button — same size, same styling, very easy mis-tap (especially on touch).

### Changes

**1. Consolidate the two "copy link" buttons into one split-style "Copy Link" dropdown**
Replace the separate `Share` + `Link/Copy` buttons with a single **"Copy Link" button + small chevron menu** giving two options:
- "Social share link (rich preview)" → `copyOgShareLink(token, type)`
- "Direct link" → existing direct copy
Default click action = social share link (the recommended one).

**2. Visually isolate the Delete button**
- Add a vertical divider (`<div className="w-px h-5 bg-border/50 mx-1" />`) between the Open ↗ button and Delete.
- Push the trash to the far right with a small extra gap (`ml-2`).
- Keep the existing `DeleteConfirmDialog` on Creative Sessions (already safe).
- **Wrap the proposal Delete in `DeleteConfirmDialog` too** — currently it uses a plain `confirm()` which is also easy to dismiss accidentally. Switch to the same branded confirm dialog used on Creative Sessions for consistency.
- Tint the trash button red on hover only (already done) and keep its base color muted so it doesn't draw the eye.

### Resulting action rows

**Creative Session card:**
```text
[Public toggle] [Mail] [Edit] [🔗 Copy Link ▾] [↗ Open]   |  [🗑]
```

**Proposal row:**
```text
[Mark Sent] [Edit] [Link2 session] [Mail] [🔗 Copy Link ▾] [↗ Open]   |  [🗑]
```

Buttons drop from 6→4 (Creative) and 7→5 (Proposals), with the destructive action visually separated.

### Files changed
- `src/components/admin/CreativeSessionCard.tsx` — merge Share + Link into dropdown, add divider before delete
- `src/pages/AdminProposals.tsx` — merge Share + Copy into dropdown, add divider before delete, replace `confirm()` with `DeleteConfirmDialog`

### Out of scope
- No DB changes
- No changes to the linking dialog or email templates
- "Mark Sent" / "Link session" stay distinct (different actions, not duplicates)

