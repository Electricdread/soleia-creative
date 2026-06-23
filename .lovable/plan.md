## Changes — `src/pages/CreativeSession.tsx` (`PrevizSection`)

1. **Scene selector** — relabel the existing pill switcher as "Scenes" (small uppercase label above the row) so each uploaded previz clip is presented as a selectable scene. Show the row whenever there is at least one clip (not only when >1), so the active scene name is always visible to the client.

2. **Fullscreen button** — add a fullscreen toggle in the player chrome (bottom-right of the video, mirroring the top-right "Unreal Previz" badge styling) using the `Maximize2` / `Minimize2` icons from `lucide-react`. Clicking calls the native Fullscreen API (`requestFullscreen` on the player container, `document.exitFullscreen` to leave) and listens to `fullscreenchange` to keep the icon in sync. In fullscreen, the video remains looping and muted (autoplay-friendly) and uses `object-contain` so the whole frame is visible.

No backend, schema, or other component changes.