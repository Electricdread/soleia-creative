

The user wants a toggle to deactivate creative session and proposal links so they can no longer be viewed by clients.

**Current state analysis:**
- `creative_sessions` table has `is_active` (boolean, default true). RLS already enforces `is_active = true` for public viewing.
- `proposals` table has `is_active` (boolean, default true). RLS already enforces `is_active = true` for public viewing.
- `client_links` table also has `is_active` for the Looks Collection sessions.
- The data layer already supports this — we just need UI toggles in the admin cards.

**Existing UI:**
- `CreativeSessionCard.tsx` — manages individual creative session cards (has `is_public` toggle pattern already per memory).
- Proposals are managed in `AdminProposals.tsx` — need to check the card structure.
- `client_links` are managed in `ClientLinkManager.tsx`.

When `is_active = false`, the public route (`/creative/:token`, `/proposal/:token`, `/session/:token`) will already fail to load the data due to RLS, showing the existing "not found" state. No changes to public-facing pages required.

## Plan: Active/Inactive Toggle for Creative Sessions, Proposals & Client Links

### Goal
Add a visible "Active / Inactive" toggle on each session, proposal, and client link card so admins can instantly disable public access without deleting the record. Inactive links will show the existing "Not Found / Expired" message to clients.

### Changes

**1. `src/components/admin/CreativeSessionCard.tsx`**
- Add a `Switch` next to the existing Public/Private toggle labeled "Active"
- When toggled off → updates `is_active = false` on `creative_sessions`
- Show a clear "Inactive" status badge (red/muted) when off
- Confirmation toast: "Session deactivated — link is no longer accessible"

**2. `src/pages/AdminProposals.tsx` (proposal list/cards)**
- Add same `Switch` pattern on each proposal row
- Updates `is_active` on `proposals` table
- "Inactive" badge when off

**3. `src/components/admin/ClientLinkManager.tsx`**
- Add same toggle for Looks Collection client links
- Updates `is_active` on `client_links` table

### Visual Design
- Use existing `Switch` component (gold accent on)
- Status badge: green dot "Active" / red dot "Inactive"
- Place toggle in card header area near existing Public/Private toggle
- Optional: subtle opacity reduction on inactive cards for quick visual scanning

### How clients experience it
- Inactive link → existing "Session Not Found / This link may have expired" message appears (already implemented in `SharedSession.tsx`, `CreativeSession.tsx`, `ClientProposal.tsx`)
- No new error pages needed — RLS policies already block inactive records

### Out of scope
- Auto-expiration by date (could be future enhancement using `expires_at` column already on `client_links`)
- Bulk deactivation
- Email notification to client on deactivation

