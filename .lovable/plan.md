## Always render the Unreal previz movie on Creative Session pages

### Root cause
In `src/pages/CreativeSession.tsx` (line 325), the Venue Previz section is wrapped in `{previzClips.length > 0 && (...)}`. That gate is left over from the old 3D scene that needed clip options. On sessions without DB previz clip rows, the new `<PrevizMovie />` never mounts — so it looks like the previz is missing / unchanged.

### Change
**`src/pages/CreativeSession.tsx`** — remove the `previzClips.length > 0` gate so the previz movie renders on every creative session:

```tsx
<section className="space-y-2">
  <div className="flex items-baseline justify-between">
    <h2 className="font-display text-xl text-foreground">Venue Previz</h2>
    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      Run-of-show cues sync to the playback
    </span>
  </div>
  <PrevizSection />
</section>
```

Optionally drop the now-unused `previzClips` fetch/state if nothing else reads it (will verify during edit).

### Untouched
- `PrevizMovie.tsx` (already correct: autoplay, muted, loop, inline, fallback)
- Asset pointer `src/assets/mutiny-movie.mp4.asset.json`
- 3D venue scene in `/creative-guide/video-mapping`

After this, every creative session (including the 4th of July one) will show the new Unreal-rendered previz movie in place of the old 3D scene.