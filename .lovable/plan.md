# Per-Session Previz Clips with Playlist HUD

Today, the previz movie is a single global URL stored in `site_settings`. We'll move to a per-session list of titled previz clips, manage them from the session admin page, and let clients pick a clip from a dropdown playlist on the 3D venue HUD.

## What admins get

In `SessionContentManager` (the existing session admin screen), a new **Previz Clips** section that lets admins:

- Upload multiple `.mp4` / `.webm` clips for the session (same browser-playability validation as today's `VenuePrevizManager`).
- Give each clip a **title** (e.g. "Act 1 — Welcome", "Logo Reveal", "Headliner Loop").
- Reorder via drag handle, rename inline, delete.
- See an "active by default" badge on the first clip.

Uploads land in the existing public `creative-guide-template` bucket under `previz/<session-id>/<timestamp>-<name>` (no new bucket — workspace blocks new public buckets).

## What clients get

On the per-session video mapping view (linked from the session page), the existing 3D room HUD gains a **playlist dropdown** beside Play Previz / Fullscreen:

- Shows the current clip's title.
- Click to open a popover listing all clips with their titles; tap one to switch.
- Switching swaps the texture on every screen seamlessly; playback state (playing / stopped) is preserved.
- If only one clip exists, the dropdown still shows the title but is non-interactive.
- If no clips exist for the session, falls back to the bundled default (today's behavior).

## Technical details

**Database** — new table `session_previz_clips`:

| column | type |
|---|---|
| session_id | uuid → creative_sessions(id) on delete cascade |
| title | text not null |
| url | text not null |
| sort_order | int |
| is_default | bool |

RLS: admins manage (`has_role(auth.uid(),'admin')`); anon + authenticated SELECT where the parent session's `is_active = true` (clients view via public session token, same model as `client_links`). GRANTs to anon/authenticated/service_role as per project rules.

**Admin UI** — new `SessionPrevizClipsManager` component, mounted in `SessionContentManager`. Reuses the format-validation + `probePlayable` helpers extracted from `VenuePrevizManager` into `src/lib/previzUpload.ts`. DND reorder uses the same `@dnd-kit` pattern already used for content items.

**Client UI** — update `VenueVideoMappingView` + `VenueRoom`:
- Accept a `clips: { id; title; url }[]` prop (replaces single `previzUrl`).
- Add `activeClipId` state; pass active clip's URL into `RoomScene` as `previzUrl`.
- New HUD control: `Popover` (shadcn) trigger button showing `<Layers /> {activeTitle}`; content lists titles with a check on the active one.

**Session page wiring** — the existing per-session route that hosts the 3D venue (or a new `/session/:token/video-mapping` if none exists) fetches `session_previz_clips` for the session and passes them down. The global `/creative-guide/video-mapping` page keeps its current single-URL behavior, untouched.

**Out of scope** — no changes to the global `VenuePrevizManager`, the `venue_previz_url` site setting, or the existing `/admin/video-mapping` page.

## File touch list

- new: `supabase/migrations/<ts>_session_previz_clips.sql`
- new: `src/lib/previzUpload.ts` (extracted helpers)
- new: `src/components/admin/SessionPrevizClipsManager.tsx`
- edit: `src/components/admin/SessionContentManager.tsx` (mount the new section)
- edit: `src/components/VenueVideoMappingView.tsx` (props + playlist HUD)
- edit: the session page that currently renders `VenueVideoMappingView` (pass clips); confirm route during implementation
