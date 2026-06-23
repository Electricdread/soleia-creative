## Goal
On Creative Session pages, replace the interactive 3D venue (`VenueRoom` / `RoomScene`) with the uploaded Unreal-rendered previz movie (`mutiny_movie.mp4`), playing autoplay-muted-looped-inline. The `/creative-guide/video-mapping` guide page keeps the 3D scene unchanged.

## Steps

1. **Upload movie to CDN**
   - Push `mutiny_movie.mp4` through `lovable-assets create` (from `/mnt/user-uploads/`) and write the pointer to `src/assets/mutiny-movie.mp4.asset.json`. No binary lands in the repo.

2. **New `PrevizMovie` component** (`src/components/venue/PrevizMovie.tsx`)
   - Renders a single `<video>` with: `autoPlay`, `muted`, `loop`, `playsInline`, `preload="auto"`, `controls={false}`, `disablePictureInPicture`.
   - Container: matches existing `VenueRoom` shell — `relative w-full overflow-hidden rounded-3xl edge-gold surface-elevated bg-black`, `aspectRatio: 16 / 9`, `object-cover` on the video.
   - Optional small "Unreal Previz" chip top-right (gold/edge-gold) for parity with the prior Now Playing chip — kept minimal.
   - No fullscreen toggle, no playlist, no audio toggle (user spec: ambient autoplay).

3. **Swap in CreativeSession** (`src/pages/CreativeSession.tsx`)
   - Replace `PrevizSection`'s `<VenueRoom .../>` with `<PrevizMovie />`.
   - Drop the now-unused `VenueRoom` / `PrevizClipOption` imports and the `clips` prop plumbing for `PrevizSection` (the parent currently builds `clips` from session media — that logic stays but no longer feeds the previz block).

4. **Leave untouched**
   - `src/components/VenueVideoMappingView.tsx` and `src/pages/VenueVideoMapping.tsx` (the `/creative-guide/video-mapping` page) — 3D scene stays for the guide.
   - `RoomScene.tsx` and venue 3D assets — still used by the guide.

## Technical notes
- Asset served from Lovable CDN URL embedded in the pointer JSON — no public-bucket changes.
- iOS autoplay requirement satisfied by `muted` + `playsInline`.
- No backend, RLS, or schema changes.

## Files
- add `src/assets/mutiny-movie.mp4.asset.json`
- add `src/components/venue/PrevizMovie.tsx`
- edit `src/pages/CreativeSession.tsx` (PrevizSection only)
