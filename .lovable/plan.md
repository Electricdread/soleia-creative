## Goal
Make previz clip switching/playback instant — no buffering wait when a viewer opens the 3D venue or picks a different clip from the playlist.

## Approach
Preload every previz clip in the background as soon as `VenueRoom` mounts, so by the time the user clicks Play or switches clips the bytes are already in the browser cache.

## Changes

**`src/components/VenueVideoMappingView.tsx`**
- On mount (and whenever `clips` changes), kick off a background prefetch for every clip URL:
  - Use hidden `<video preload="auto" muted playsinline>` elements (one per clip) appended off-screen, OR a `fetch(url, { cache: 'force-cache' })` per URL that streams the body to `/dev/null`.
  - Prefer the hidden-video approach: it warms the browser's media cache the same way the real `RoomScene` video element will read it, and it's bounded by the browser's own media memory limits.
- Prioritize the currently-active clip first, then the rest in parallel (cap at ~3 concurrent to avoid saturating mobile networks).
- Clean up the prefetch elements on unmount.

**`src/components/venue/RoomScene.tsx`**
- Change the live playback `<video>` element's `preload` from `'metadata'` to `'auto'` so once previz is toggled on, the browser fetches the full clip immediately (it can reuse bytes already warmed by the prefetch).

## Notes / trade-offs
- Background prefetch uses bandwidth up front. For a typical previz session (a handful of ~720p re-encoded clips) this is the right trade — viewers stop seeing the "buffering" pause when switching clips.
- No changes to upload/encode pipeline, audio handling, or the 3D scene itself.
- No backend changes.