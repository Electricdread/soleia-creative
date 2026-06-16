# Apply Creative Guide scheme site-wide

The design tokens, gold gradient, and fonts (Inter / DM Serif Display / JetBrains Mono) are already global in `src/index.css` and `tailwind.config.ts`. The Creative Guide just *uses* them with discipline. This plan retrofits the rest of the site to the same conventions — **no new tokens, no layout rewrites, no PDF/email changes**.

## The 4 conventions to enforce

1. **Headings** → `font-display` (DM Serif Display). Hero/section titles add `text-gradient-gold`.
2. **Numeric / spec / status / metadata labels** → `font-mono` (JetBrains Mono), often uppercase + tracked.
3. **Body** → `font-sans` (Inter) — already the default, but kill any leftover hardcoded fonts.
4. **Colors** → semantic tokens only (`text-foreground`, `text-muted-foreground`, `text-primary`, `bg-card`, `border-border/60`). Remove any hardcoded `text-white`, `bg-black`, `bg-[#...]`, `text-gray-*`.

## Two tiny shared utilities (added to `src/index.css`)

```
.scheme-eyebrow  → font-mono uppercase tracking-[0.2em] text-xs text-primary/80
.scheme-title    → font-display text-3xl sm:text-4xl text-foreground (gold gradient variant: .scheme-title-gold)
.scheme-divider  → h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent
```

These mirror the patterns already inline in `CreativeGuideView.tsx` so pages can adopt them in one or two class swaps.

## Pages retrofitted (visual only, layout untouched)

**Client-facing**
- `ClientProposal.tsx` / `ProposalView.tsx` — section titles → `font-display`, status badges / line-item amounts / dates → `font-mono`, replace any hardcoded grays.
- `CreativeSession.tsx` / `SharedSession.tsx` — section headers + eyebrow labels.
- `SharedLookBook.tsx` — gallery section headers + mono metadata.
- `ContentDelivery.tsx`, `DeliveryGuide.tsx`, `SessionDeliveryGuide.tsx`, `TailgateDeliveryGuide.tsx` — already partially aligned; finish headings + spec rows.

**Admin / portals**
- `AdminPortal.tsx`, `AdminProposals.tsx`, `AdminLooks.tsx`, `AdminCreative.tsx`, `AdminCalendar.tsx`, `AdminUsers.tsx`, `AdminStorage.tsx`, `OfficePortal.tsx` — page titles → `font-display`, table headers / counts / IDs / timestamps → `font-mono`, replace hardcoded colors with tokens.
- Auth: `PendingApproval.tsx`, `AccessGranted.tsx`, `AdminSetup.tsx` — heading + eyebrow only. `AdminLogin.tsx` left as-is (per prior decision).

## Out of scope (explicitly)

- PDF generators (`proposalPdfGenerator.ts`, `deliveryGuidePdf.ts`, etc.) — print aesthetic stays.
- Email HTML templates and email-asset cards.
- Token values, dark/light palette, business logic, RLS, routes.
- Layouts, spacing systems, component restructuring.
- shadcn/ui primitives (`button.tsx`, `card.tsx`, etc.) — they already consume tokens.

## Rollout order

1. Add the 3 utility classes to `src/index.css`.
2. Sweep client-facing pages (proposal → session → lookbook → delivery).
3. Sweep admin pages (portal → proposals → looks → creative → calendar → users → storage → office).
4. Sweep auth pages.
5. Quick visual pass in preview (light + dark) to catch stragglers.

## Acceptance

- Every page heading renders in DM Serif Display.
- Every numeric/spec/status/timestamp renders in JetBrains Mono.
- No hardcoded color utilities remain on retrofitted pages (grep for `text-white|bg-black|text-gray-|bg-\[#`).
- Light and dark modes both look cohesive with the Creative Guide.
