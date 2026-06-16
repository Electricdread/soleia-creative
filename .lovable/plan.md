# Pre-Call Packet Manager (Dashboard)

Build a self-contained Pre-Call Packet feature accessible from the AdminPortal dashboard. Packets are separate from proposals: they hold inclusions / scope-of-work content for client pre-call review and are deployed (made live) from the dashboard via a shareable token URL.

## What you get

- A new portal card **Pre-Call Packets** on `/admin` (dashboard sidebar + grid).
- A new admin page `/admin/packets` to create, edit, deploy (activate/deactivate), copy share link, and delete packets.
- A new public client page `/packet/:token` — read-only, themed like ProposalView, no auth required.
- Tokens generated on create; "Deploy" sets `is_active = true` and surfaces the public URL + copy-link button. "Unpublish" flips it back off.

## Out of scope

- No changes to proposals, quote flow, or PDF generators.
- No removal of the legacy `is_pre_call_packet` / `proposal_scenario` fields on `AdminProposals` (separate cleanup, ask later).
- No email tooling for packets in this pass (link is copy-to-clipboard only).

## Plan

1. **Database** (single migration)
   - `public.pre_call_packets`: `id`, `title`, `client_name`, `event_date` (nullable), `intro` (text), `inclusions` (jsonb array of `{heading, body}`), `scope` (text), `notes` (text), `token` (text unique, default `encode(gen_random_bytes(16),'hex')`), `is_active` (bool default false), `created_by` (uuid), `created_at`, `updated_at`.
   - GRANTs: `authenticated` full CRUD; `service_role` ALL; `anon` SELECT (needed for public token view).
   - RLS:
     - Admins: full ALL via `has_role(auth.uid(),'admin')`.
     - Public (anon + authenticated): `SELECT` only when `is_active = true` (token is the secret; row is hidden until deployed).
   - `update_updated_at_column` trigger.

2. **Routes** (`src/App.tsx`)
   - Add admin-protected `/admin/packets` → `AdminPackets`.
   - Add public `/packet/:token` → `ClientPacket`.

3. **Dashboard integration** (`src/pages/AdminPortal.tsx`)
   - Add `Pre-Call Packets` entry to `portals` array (FileText or BookOpen icon, gold accent), pointing to `/admin/packets`.

4. **New pages / components**
   - `src/pages/AdminPackets.tsx` — list of packets with status badge (Draft / Deployed), New Packet button, edit dialog, Deploy/Unpublish toggle, copy public URL (`${origin}/packet/${token}`), delete confirm.
   - `src/components/admin/PacketEditor.tsx` — form: title, client name, event date, intro, dynamic inclusions list (add/remove/reorder rows), scope, notes. Save → upsert.
   - `src/pages/ClientPacket.tsx` — fetches by token (anon read), renders Soleia-branded read-only view reusing existing tokens (`bg-card`, `card-elevated`, gold accents, DM Serif headings). 404 state when token missing or `is_active=false`.

5. **Memory updates**
   - Update `mem://features/client-proposal/quote-only-rule` to reference the new packet location.
   - New `mem://features/pre-call-packets` describing the system.

## Technical notes

- Token URL uses `window.location.origin` so it works on preview, lovable.app, and `soleiacreative.app`.
- RLS pattern matches existing `proposals` / `lookbook_shares` (token-gated public read, admin-only writes).
- No edge function needed — anon `SELECT` with `is_active=true` policy is sufficient; if we later need signing/expiry, mirror `get_proposal_by_token` SECURITY DEFINER.
- All UI uses semantic tokens; `card-elevated` on packet cards for the layering rule we just landed.
