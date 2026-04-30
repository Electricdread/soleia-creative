# Site-Wide "Return Home" Button Cleanup

Add a single, consistent "Return Home" control to every page that currently lacks navigation back to the Admin Portal (`/admin`, the de facto home for authenticated users) or to a sensible landing for public pages. The Creative Guide section is intentionally excluded per the brand rule that its header has no back button.

## Audit Results

Pages that already have a back/home control (no change):
- `AdminCreative`, `AdminLooks`, `AdminCalendar`, `AdminEmailPreviews`, `AdminUsers`, `AdminProposals`, `AdminStorage` — Back to `/admin`
- `OfficePortal` — Back to `/admin`
- `DeliveryGuide`, `TailgateDeliveryGuide` — Back to `/`
- `SessionDeliveryGuide` — has "Go Home" only on error; needs one in normal header
- `NotFound` — has "Return to Home" link
- `AdminPortal` / `Index` — IS the home, no button needed
- `AdminLogin` — auth entry, no button needed

Pages explicitly EXCLUDED (Creative Guide section):
- `CreativeGuide` (`CreativeGuideView`)
- `PrintCreativeGuide`

Pages that need a "Return Home" button added:
1. `SharedLookBook` (`/looks/:token`) — public client page, no header nav
2. `SharedSession` (`/session/:token`) — wrapped gallery, no top-level home button
3. `CreativeSession` (`/creative/:token`) — public client page, no header back
4. `ClientProposal` (`/proposal/:token`) — public client page, no header back
5. `ShowBloxPreview` (`/preview/:token`) — public preview, no header back
6. `Tutorial` (`/tutorial`) — has header but no return button
7. `SessionDeliveryGuide` (`/delivery/:token`) — add to normal-state header (currently only on error)

## Design

A small, consistent button rendered in the top-left of each page's existing header (or a fixed top-left if no header exists). Uses the same pattern already used in `AdminCreative`/`AdminLooks`:

```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => navigate('/')}
  className="text-muted-foreground hover:text-foreground"
>
  <Home className="w-4 h-4 mr-2" />
  Home
</Button>
```

Destination logic:
- Authenticated/admin context pages → `navigate('/')` (which redirects to `/admin` via `ProtectedRoute`)
- Public client-facing pages (SharedLookBook, ClientProposal, ShowBloxPreview, CreativeSession, SessionDeliveryGuide, SharedSession) → `navigate('/')` as well; for unauthenticated visitors this lands on the protected route → admin login, which is the correct "exit" behavior. We'll use the `Home` icon + label "Home" so it reads naturally on both sides.

For client-facing public pages, the button is styled subtly (ghost, low-contrast) so it doesn't compete with the branded content.

## Changes by File

1. `src/pages/SharedLookBook.tsx` — Add a slim sticky top bar with Soleia logo (already used) and a left-aligned Home button.
2. `src/pages/SharedSession.tsx` — Wrap `SharedGalleryView` in a fragment with a fixed top-left Home button overlay (or pass through a header slot if simpler — implement as a small absolute-positioned button to avoid touching the gallery component).
3. `src/pages/CreativeSession.tsx` — Add Home button to the existing top header area near the Soleia logo.
4. `src/pages/ClientProposal.tsx` — Add a fixed top-left Home button overlay above `ProposalView` (proposal view is full-bleed cinematic, so use a low-contrast floating button that respects the dark luxury aesthetic).
5. `src/pages/ShowBloxPreview.tsx` — Add Home button to the existing header next to the Soleia logo.
6. `src/pages/Tutorial.tsx` — Add Home button at the left of the existing header (line ~705).
7. `src/pages/SessionDeliveryGuide.tsx` — Add Home button to the normal-state header (it already imports `ArrowLeft` and has the error-state version).

No changes to:
- Creative Guide pages (excluded)
- Admin pages that already have Back buttons
- `AdminPortal` / `Index` (is home)
- `AdminLogin`, `NotFound`

## Visual Consistency

- Icon: `Home` from lucide-react (clearer than `ArrowLeft` for "return home")
- Label: "Home" (short, fits mobile)
- Mobile: icon-only at `<sm` breakpoint where header space is tight
- Touch target: 44px min (h-11 on mobile) per project mobile UX rule
- Color: respects each page's theme — `text-muted-foreground` for light pages, `text-zinc-400 hover:text-white` for dark pages (Looks/Proposal/Preview)

## Out of Scope

- No changes to Creative Guide section
- No changes to header layouts beyond adding the button
- No new routes or auth changes
