# Separate Proposals from Content Packets

New rule: **Proposals = quote + signature only.** A standalone **Content Packet** lives at its own URL/admin section.

## Phase 1 — Strip packet content out of proposals (this pass)

### Admin (`src/pages/AdminProposals.tsx`)
- Remove scenario `<Select>` (Pre-Call Packet / Pre-Packet / Direct Quote) and the "Seed defaults" button.
- Drop `setScenario`, `seedScenarioTwoDefaults`, and the packet branches in `buildPlainTextEmail` / `openInMailApp` — keep only the direct-quote email path (subject prefix "Proposal").
- On `handleCreate`, insert `proposal_scenario: 'direct_quote'`, `is_pre_call_packet: false`.

### Client proposal view (`src/components/proposal/ProposalView.tsx`)
- Remove `<ProposalContractInclusions />` render.
- Drop the `isMappedToSpec` pre-tick effect and `mappedItem` filtering of `tableItems`.
- Replace `additionalServicesLabel` with single label **"Services"**.

### PDF (`src/lib/proposalPdfGenerator.ts`)
- Remove `scenarioLabel` chip on cover, "Mapped to Spec" filtering, and scenario-conditional copy. Pure quote.

### Cleanup
- Delete `src/components/proposal/ProposalContractInclusions.tsx`.
- Leave `proposal_scenario` / `is_pre_call_packet` DB columns intact (historical proposals still render fine).

### Memory
- Add Core rule: "Proposals are quote-only (line items + signature). Packet/inclusions content lives at /packet/:token, never inside proposals."
- New memory `mem://features/client-proposal/quote-only-rule` documenting what was stripped.
- Update `mem://features/client-proposal/proposal-scenarios` to mark scenarios deprecated.

## Phase 2 — Standalone Content Packet (new admin section + page)

Decision: option (a) — `/packet/:token` public page + `/admin/packets` manager.

### Database (migration)
- New table `public.content_packets`:
  - `id`, `token` (unique, public), `event_name`, `client_name`, `venue_name`, `event_date`, `cover_image_url`, `intro_text`, `is_active`, `created_by`, `created_at`, `updated_at`.
- New table `public.content_packet_sections`:
  - `id`, `packet_id` (FK), `section_type` ('inclusions' | 'rich_text' | 'image' | 'video' | 'link_list'), `title`, `body` (jsonb), `sort_order`, timestamps.
- GRANTs: `authenticated` full, `anon` select (token-scoped via RLS), `service_role` all.
- RLS:
  - `anon` can read packets + sections only when packet `is_active = true` (token filter happens client-side via `.eq('token', …)`).
  - `authenticated` admin (via `has_role(auth.uid(), 'admin')`) can CRUD.
- Seed default "Inclusions" copy (current venue contract bullets from the old banner) for any newly created packet.

### Routes (`src/App.tsx`)
- Public: `/packet/:token` → `src/pages/ClientContentPacket.tsx`.
- Admin: `/admin/packets` → `src/pages/AdminContentPackets.tsx` (list + create + edit, mirroring AdminProposals patterns).

### Client packet page (`src/pages/ClientContentPacket.tsx`)
- Same Soleia branded chrome as `ProposalView` (logo, dark/light theme), but read-only.
- Renders: cover image, event header, intro, then ordered `sections`:
  - `inclusions` → the gold-bar "Included in Your Venue Contract" block (copy reused).
  - `rich_text` → branded prose block.
  - `image` / `video` → media tile with tap-to-fullscreen.
  - `link_list` → labeled buttons (Lookbook share, Creative Guide, Tripleseat link, etc.).

### Admin manager (`src/pages/AdminContentPackets.tsx`)
- List with status badge + Active toggle (mirrors AdminProposals row).
- Create form: event name, client name, venue, event date, optional linked `proposal_id` (display only — no data fusion).
- Edit: section list with DnD reordering, add/remove sections, edit fields per type.
- "Copy public link" + "Copy email snippet" actions (re-use the email-snippet pattern from ProposalEmailCard).

### Portal entry
- Add a "Content Packets" card in `src/pages/AdminPortal.tsx` using the gold-accent icon convention (e.g. `BookOpen`).

## Out of scope for now
- Migrating any existing Pre-Call Packet proposals into the new `content_packets` table. Per your answer, those stay as-is.
- Email automation that fires the packet link automatically — admins copy/paste manually like the other email tools.

## Implementation order
1. Phase 1 changes + memory updates (small, ship first).
2. Phase 2 migration → admin page → client page → portal entry (each as its own focused change once you confirm).

Want me to ship Phase 1 now and queue Phase 2 next, or do you want both in one go?
