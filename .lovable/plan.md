## Goal
Drop the previz cue-marker timing feature entirely. Keep the focus on clear video + working audio playback.

## Changes

1. **Remove cue overlay from the player**
   - `src/components/previz/PrevizPlayer.tsx`: stop rendering `VenuePrevizCueOverlay` and any marker UI / duration-probing logic that exists only to position cues. Keep the standard video element, controls, and audio path untouched.

2. **Hide cue management UI**
   - Remove the "Cue points" editor/section from the previz admin (in `SessionPrevizClipsManager.tsx` or whichever sub-component renders the cue list/add-cue form). Uploads, re-encoding, progress, and clip list stay exactly as they are.
   - Remove any cue-related controls from the client-facing venue view that renders previz.

3. **Delete now-unused files**
   - `src/components/previz/VenuePrevizCueOverlay.tsx`
   - `src/lib/mediaDuration.ts` (only used to place cues)
   - Any small cue-only helper/types file if one exists.

4. **Leave data alone**
   - Do NOT drop the cue points table/columns. Existing rows stay in the database in case we want to revisit this later; they simply won't be read or written from the UI.

5. **Keep intact**
   - Browser re-encode pipeline (`src/lib/previzCompressor.ts`) with VP9/WebM + AAC/MP4 fallback, `fix-webm-duration`, resumed `AudioContext`, captureStream audio path — this is what gives clear video + audio.

## Technical notes
- After removing the imports of `VenuePrevizCueOverlay` and `getMediaDuration`, run a quick `rg` for any leftover references so the build stays clean.
- No migrations, no edge-function changes, no schema changes.

## Out of scope
- Re-introducing cues in a different form. If you want them back later we can revisit with a dedicated timeline editor.
