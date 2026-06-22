# Cues in 3D Fullscreen + Scenes Below Previz

Two adds on the session video-mapping page:

1. **Cue strip overlays the 3D venue** — visible inline AND while the venue is in fullscreen, since the existing PrevizPlayer only shows cues on the standalone player below.
2. **Merge scene-grouped clips, comments, and reactions** under the previz on `/session/:token/video-mapping`, retiring the separate `/session/:token` page (it redirects in).

## What gets built

### 1. Expose the 3D previz video for cue sync
`src/components/venue/RoomScene.tsx` already creates an internal `HTMLVideoElement` to feed the WebGL texture. Add an `onVideoReady?: (el: HTMLVideoElement) => void` prop and call it once after the element is created. No change to rendering.

### 2. New `<VenuePrevizCueOverlay />`
`src/components/previz/VenuePrevizCueOverlay.tsx`. Absolutely positioned bottom strip:

```text
┌────────────────────── 3D venue canvas ──────────────────────┐
│                                                              │
│                       (orbit / previz)                       │
│                                                              │
│  ┃ Walk-in Look ┃─────●─────┃ Reception ┃─────┃ Toast ┃     │ ← cue strip
│  0:13           0:42                          1:55     5:30  │
└──────────────────────────────────────────────────────────────┘
```

- Renders inside the `roomRef` container in `VenueVideoMappingView`, so it stays visible in both native fullscreen and the `pseudoFull` fallback.
- Reads `currentTime` from the exposed `<video>` via `requestAnimationFrame`.
- Click a marker → sets `video.currentTime`. Active cue label highlights in gold (`#c49a3c`) with a soft glow.
- Auto-hides when previz is OFF or the clip has no cues (no empty bar clutter).
- Subtle: 28px tall, black 55% backdrop-blur, only takes the bottom strip, doesn't block the existing playlist/fullscreen controls (sits just above them).

### 3. Cue data wiring in `VenueVideoMappingView`
Fetch cues for the active clip with `usePrevizCues(activeId)` and pass to the overlay. Re-fetches when the playlist switches.

### 4. Merge scene gallery under the previz
The existing `src/pages/CreativeSession.tsx` already renders scenes, mood-board items, comments, and reactions for `/session/:token`. Extract that body into a shared component:

- New `src/components/session/SessionSceneGallery.tsx` — takes `sessionId` + `sessionToken`, renders the same scene-grouped item grid, comment threads, and reaction buttons as today. Pure cut-and-paste of the current rendering code (mood_board_items / mood_board_comments / mood_board_reactions queries + the same realtime subscriptions).
- `CreativeSession.tsx` becomes a thin wrapper around `<SessionSceneGallery />` (so existing readers see no regression), or simply redirects to the video-mapping URL.
- `SessionVideoMapping.tsx` renders, in order: heading → `<VenueVideoMappingView />` (with cue overlay) → `<SessionSceneGallery />`. The standalone `<PrevizPlayer />` "Run of Show" section added last time is removed — the cue overlay on the 3D venue replaces it.

### 5. Route redirect
Add a `Navigate replace` in `App.tsx`: `/session/:token` → `/session/:token/video-mapping`. The merged page becomes the canonical client session view.

### 6. Out of scope
- No changes to comments/reactions data model (already supports replies via `parent_id`).
- No new vote buttons (user confirmed: existing reactions are enough).
- No audio on the 3D venue (it remains muted, as required for the WebGL texture / autoplay). Cues are timed against the same playback clock the texture uses, so they stay in sync.
- No edits to admin previz authoring (already shipped).

## Technical notes

- Exposing the video element is the cleanest sync path — no second `<video>` decoding the same MP4 in parallel.
- `roomRef` is the fullscreen target, so anything rendered inside it inherits the fullscreen viewport — no portal or layout duplication needed.
- The overlay component is dumb: takes `video` + `cues`, owns its own rAF loop, exits cleanly when `video` becomes null (clip switch).
- The extracted `SessionSceneGallery` keeps the existing supabase realtime channel names and item-mutation handlers; only the wrapping page changes.
