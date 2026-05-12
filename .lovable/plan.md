# Fix: Proposal page missing menu items + folder links

## Problem

On `/proposal/:token` the client sees:
- An empty line-items table (just `Category / Line Item / Qty / Unit / Rate / Total` headers, no rows) and a `$0` Quote Total.
- No clickable links out to the Creative Guide, the Collect Assets (Google Drive) folder, or a Line Item Menu — even though the email promises all of these "inside the packet".

The code already supports both pieces, they just aren't surfaced on the page:
- `proposals.drive_folder_url` exists and is auto-created on sign (and via `generateClientFolder` from `AdminProposals`).
- `proposals.creative_call_url` exists and only renders as a small text link in the banner.
- `/creative-guide` is a real route.
- `proposal_items` exist in the DB but this proposal was created without any.

## Changes (frontend only)

### 1. `src/components/proposal/ProposalView.tsx` — new "Pre-Call Resources" panel

Render a new card directly under the existing Pre-Call Packet banner (only when `!signed && !isProposalClosed(proposal)`). Four resource tiles in a responsive 2-col grid:

1. **Line Item Menu** — anchor scroll to the `#line-items` section on the same page (add `id="line-items"` to the items wrapper). Subtitle: "Browse services & pricing".
2. **Creative Guide** — opens `/creative-guide` in a new tab. Subtitle: "Venue specs, LED zones, delivery standards".
3. **Collect Assets Folder** — if `proposal.drive_folder_url` is set, opens it in a new tab. If not set:
   - Admin viewing: show a "Generate folder" button that calls `supabase.functions.invoke('create-client-drive-folder', { body: { proposal_id } })` and refreshes via `onRefresh?.()`.
   - Client viewing: show muted text "Folder will be shared after sign-off" (no broken button).
4. **Schedule Creative Call** — only if `proposal.creative_call_url` is set; opens the URL in a new tab. Otherwise hide the tile.

Style to match the existing cream/gold palette (`bg-white`, `border-[#ecf0f1]`, `border-l-4 border-[#c49a3c]` accents, `lucide-react` icons: `ListChecks`, `BookOpen`, `FolderOpen`, `Calendar`).

Remove the now-redundant `Schedule our creative call →` text link inside the banner (replaced by the tile).

### 2. `src/components/proposal/ProposalView.tsx` — items empty state

When `items.length === 0` and not in `editingItems` mode:
- For admins: show a dashed-border card inside the items section with "No line items yet" plus an "Add items" button that calls `setEditingItems(true)` (and an "Add from Library" shortcut).
- For clients: show a muted note "Line items will be finalized together on our creative call." instead of an empty table.

### 3. Anchor target

Add `id="line-items"` to the `<div className="mb-10">` wrapper around the items table (line ~625) so the "Line Item Menu" tile can `href="#line-items"` smooth-scroll to it.

## Out of scope

- No DB migrations.
- No edge function changes (the existing `create-client-drive-folder` already handles idempotency).
- No email template changes (the email already lists these resources correctly).
- Not seeding default items into the test proposal — that's user data.

## Files touched

- `src/components/proposal/ProposalView.tsx` (only file)
