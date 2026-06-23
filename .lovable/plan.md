## Problem
The Creative Session page hard-codes the previz player to the bundled "Mutiny" Unreal asset. Uploaded session clips (e.g. `NightScene` on the 4th of July session) are fetched from `session_previz_clips` into state but never rendered — `PrevizSection` just returns `<PrevizMovie />` with the bundled file.

## Fix
Wire the uploaded clips into the previz player so each creative session plays its own uploaded movie(s).

### Changes — `src/pages/CreativeSession.tsx`
1. Pass `previzClips` into `PrevizSection` as a prop.
2. Rewrite `PrevizSection({ clips })`:
   - If `clips.length === 0` → keep current `<PrevizMovie />` (bundled fallback).
   - If `clips.length >= 1` → render an inline `<video>` (same 16:9 rounded-3xl `edge-gold` shell, `Unreal Previz` badge, error fallback) using the selected clip's `url`. Default to the first clip (already sorted with `is_default` first).
   - If `clips.length > 1` → render a small row of pill buttons above/below the player with each `clip.title` to switch between them (state inside `PrevizSection`). Uses existing primary/gold styling, no new design tokens.

No backend, schema, or upload-pipeline changes — `fetchPrevizClips` already runs on session load and realtime is not needed for this fix (clips are stable per session view).

### Verification
On `/creative/creative-mpbzjcwh-3ft5og` the player will load the `NightScene` public URL from `session_previz_clips` instead of the bundled mutiny asset. Sessions with no uploads keep the existing bundled previz.