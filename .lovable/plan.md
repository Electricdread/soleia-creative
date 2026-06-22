# Cued Previz Player for Creative Sessions

Play a session's H.264 video (with audio) and overlay a horizontal timeline strip with run-of-show cue markers (e.g. `0:13 — Walk-in Look`, `0:42 — Reception`). Admin authors cues; client view plays the same video with read-only cue markers that highlight as the playhead passes.

## What gets built

### 1. Cue data model
New table `session_previz_cues` scoped to an existing row in `session_previz_clips` (the uploaded H.264 video):

```text
session_previz_cues
  id            uuid pk
  clip_id       uuid → session_previz_clips.id (cascade)
  time_seconds  numeric(8,3)   -- e.g. 13.000, 42.500
  label         text           -- "Walk-in Look", "Reception", "Toast"
  color         text null      -- optional accent override
  sort_order    integer
  created_at / updated_at
```

GRANTs + RLS:
- `authenticated`: full CRUD when the parent session belongs to admin (via existing `has_role`).
- `anon`: SELECT only when the parent session is public OR reached through a valid `client_links` token (same pattern already used for `session_previz_clips`).

### 2. Admin authoring — `SessionPrevizClipsManager`
On each previz clip row, add a **Cues** panel:
- Video player above a horizontal timeline strip (full width, gold ticks on dark rail).
- "Add cue at current time" button — grabs `video.currentTime`, opens inline row to label it.
- Cue list (table): timestamp `mm:ss.s` (editable), label (editable), drag handle reorders only when timestamps tie, delete.
- Markers on the strip are draggable to retime; tooltip shows label + timestamp.
- Keyboard: `M` while focused on the player drops a marker at playhead.

### 3. Shared `<PrevizPlayer />` component
Single component reused by admin + client:
- `<video controls playsInline>` with audio enabled.
- Custom timeline strip below (or overlay-on-hover) rendered from cues:
  - Tick + dot per cue, label above on hover, label always visible for the active cue.
  - Active cue = last cue whose `time_seconds <= currentTime`; highlights in gold (`#c49a3c`), pulses briefly on transition.
  - Click a marker → `video.currentTime = cue.time_seconds`.
- Props: `videoUrl`, `cues[]`, `editable?: boolean`, `onCueChange?`.

### 4. Client view — `CreativeSession` / `/preview/:token`
Where the session's previz video already renders, swap in `<PrevizPlayer editable={false} />`. Cues load via the same query the clip uses today, filtered by `clip_id`. Read-only: no add/edit affordances, just synced highlight + click-to-seek.

### 5. Out of scope (for this pass)
- Multi-track audio, waveform rendering, MIDI/OSC export.
- Auto-detecting cues from audio.
- Editing cues from the client side.
- Changes to non-previz clip players (gallery, lookbook, mood board).

## Technical notes

- Time stored as numeric seconds with millisecond precision; display helper `formatMMSS(t)` already-pattern in the repo (`src/lib/format.ts` if present, else add).
- Active-cue calculation runs off `requestAnimationFrame` while playing, throttled to `timeupdate` when paused — avoids re-renders every frame.
- Marker drag uses pointer events with `clientX → time` mapping against the strip's `getBoundingClientRect()`; commits on pointerup.
- Reuse existing dark surface tokens (`surface-elevated`, `border-border`) and gold accent `#c49a3c`. No new fonts.
- New table follows project RLS conventions: `GRANT` block in same migration, `service_role` ALL, `authenticated` CRUD gated by `has_role(auth.uid(),'admin')`, `anon` SELECT gated by session visibility / token.
- No changes to storage buckets — the H.264 file is already uploaded through the existing previz upload path (`src/lib/previzUpload.ts`).

## Open question

The current `session_previz_clips` row stores a single `url`. Confirm a session typically has **one** master previz video that the run-of-show times against (the plan assumes yes). If a session may have multiple, cues are still scoped per clip, so it still works — just say the word if you want a session-level "primary previz" selector too.
