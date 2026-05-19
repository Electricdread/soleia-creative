## Problem

A client viewing a proposal clicked the "Creative Guide" tile and was bounced to `/admin/login`. The route `/creative-guide` is currently wrapped in `<ProtectedRoute requireAdmin>`, so anyone without an admin session gets redirected. The guide itself is fully informational (venue specs, LED zones, delivery standards) — nothing on it is sensitive or operator-only, so it's safe to expose publicly.

## Proposed Fix

Make the Creative Guide a public, client-friendly section that lives on its own, with no auth required.

### 1. Remove auth gating from the guide routes

In `src/App.tsx`:

- `/creative-guide` → drop `<ProtectedRoute requireAdmin>`, render `<CreativeGuide />` directly (public).
- `/creative-guide/print` → same, public.

### 2. Open from the proposal in a new tab

In `src/components/proposal/ProposalView.tsx` (Pre-Call Resources tile, line ~994), change the Creative Guide tile so it opens `/creative-guide` in a new tab (`target="_blank"`, `rel="noopener"`). That keeps the proposal context intact and reinforces that the guide is its own destination.

### 3. Light header cleanup for non-admin viewers

`CreativeGuideView` already has no admin-only controls in the header (just the logo, Print button, and the "Powered by" badge), so no admin/non-admin branching is needed. The Print button stays — clients benefit from it too.

### Subdomain question

A separate subdomain (e.g. `guide.soleiacreative.app`) is **not required** for this fix. The current custom domain `soleiacreative.app` already serves the route, and making it public is enough to solve the redirect problem. A subdomain would add DNS/SSL setup and a second hosting target for no functional gain. Recommend skipping it unless you specifically want the guide branded as its own product surface — happy to set that up later if you want.

### Out of scope

- No changes to `/creative-guide/print` content, the printable PDF, or any guide section.
- No changes to admin nav (admins still see the Creative Guide link in `AdminPortal`).
- No new database fields, no edge function changes.
- No subdomain setup (call it out only if you say yes).

### Memory follow-up

The existing memory entry `creative-guide-system` says the guide is "private admin-only". After this change I'll update that note to reflect that the guide is now publicly viewable (linked from client proposals), while the print route remains accessible to everyone too.
