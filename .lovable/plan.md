## Goal

1. When clients land on `/creative-guide#display-specs` from a proposal email, the page should explicitly draw attention to the **LED After Effects Template download card**.
2. Collapse the standalone "Content Delivery" tab — its essentials (Resolume Alley download, DXV3 workflow, 21-day timeline) belong inside Display Specs, not as a separate section.

---

### 1. `src/components/creative-guide/DisplaySpecsView.tsx`

**Highlight the AE template on hash arrival**

- On mount, read `window.location.hash`. If it equals `#display-specs` (or `#ae-template`):
  - `scrollIntoView({ behavior: 'smooth', block: 'center' })` on the LED card.
  - Apply a 4-second pulsing gold ring + glow (`ring-2 ring-primary shadow-[0_0_60px_-10px_hsl(var(--primary)/0.6)]` with `animate-pulse`) to the LED card, then fade off.
- Inside the LED card, give the "Download After Effects Template" button a `ref` and `id="ae-template"`. Make it the visually primary button: switch from outline to filled gold (`bg-primary text-primary-foreground hover:bg-primary/90`), bump to default size, add Sparkles icon.
- Above the existing card grid, insert a slim **"After Effects Template"** banner that appears only when the hash is present: gold border, Download icon, one-line label "Download the LED After Effects template", primary button that triggers the same `handleDownloadLEDTemplate`. Dismissible with an X.

**Fold Content Delivery essentials in**

Add a compact "Content Delivery" block at the bottom of `DisplaySpecsView` (above the existing footer area), containing:
- Single horizontal card: Resolume Alley download button + Resolume.com link (re-use copy from `ContentDeliveryView` / `DeliveryGuide`).
- 4-step inline workflow (Export → Open Alley → Encode DXV3 → Submit) as a thin numbered row, not 4 large cards.
- 21-business-day timeline note as a single-line callout.

Keep the new block under ~200px tall on desktop — the goal is minimal, not a second page.

### 2. `src/components/CreativeGuideView.tsx`

- Remove the `'content-delivery'` case from the `AnimatePresence` block.
- Remove the `ContentDeliveryView` import.
- Drop the `Send` icon from `categoryIcons`.

### 3. `src/lib/creativeGuide.ts`

- Remove the `content-delivery` entry from `creativeGuideCategories`. Resulting tabs: Introduction · Venue Overview · Display Specs.

### 4. Leave alone

- `src/components/creative-guide/ContentDeliveryView.tsx` (unused after removal, but keep the file for now — no deletion).
- `src/pages/DeliveryGuide.tsx` (still served at `/delivery-guide` for per-session delivery flows).
- Proposal email templates — the existing `#display-specs` link will now both land on Display Specs and trigger the AE highlight.
- `PrintableCreativeGuide.tsx` and print routes — out of scope; print guide can keep its existing structure.

### Out of scope

- No changes to backend, edge functions, or DB.
- No subdomain or routing changes.
- No new assets — AE zip and Resolume URLs already exist.
