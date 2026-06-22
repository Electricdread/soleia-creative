## Goal

Make the previz feel smooth and reliable in the 3D venue view, while keeping the new audio toggle working.

## Assumption

I’ll treat “playback is not good” as choppy/stuttering playback in the 3D venue previz, especially with large 3840×2160 uploads.

## Plan

1. **Reduce 3D render pressure during previz playback**
   - Lower the 3D canvas device-pixel-ratio ceiling while previz is active.
   - Keep the venue interactive, but avoid making the browser render more pixels than needed while also decoding video.

2. **Make the video element more playback-stable**
   - Use safer video loading behavior for the 3D texture.
   - Start muted for autoplay, then preserve the tap-to-unmute behavior.
   - Ensure source changes reset/play cleanly instead of leaving the video in a bad buffering state.

3. **Throttle expensive video-driven updates if needed**
   - Review any per-frame color sampling / texture-driven effects in `RoomScene.tsx` and reduce their frequency during previz so the video decode gets priority.

4. **Improve admin guidance for source files**
   - Update the previz upload text to recommend web-optimized h.264 MP4 exports instead of maximum-quality 4K masters.
   - Keep the current upload flow intact; no database changes and no new backend pipeline.

## Expected files

- `src/components/venue/RoomScene.tsx`
- `src/components/VenueVideoMappingView.tsx`
- `src/components/admin/SessionPrevizClipsManager.tsx`

## Not included

- No new backend transcoder.
- No schema/storage changes.
- No changes to cue/comment/voting behavior.