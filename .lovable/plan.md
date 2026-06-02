## Update Ticker Display Image

Replace the existing Ticker reference images with the new Vanderpump Hotel render the user just uploaded.

### Changes

1. Save uploaded image (`Snapshot_20260513021313670.jpg`) into the project as the new Ticker visuals:
   - `public/creative-guide/ticker-specs.jpg` (overwrite)
   - `public/creative-guide/ticker-display.jpg` (overwrite)

2. No code changes needed — `src/lib/creativeGuide.ts` already references those paths for the Ticker display.

### Note

The carousel at the top of the Marquee/Ticker section (`TickerVideoCarousel.tsx`) plays **videos** from the `marquee-ticker-media` bucket, not these images. If the goal is to replace what's labeled "Ticker Preview" in the carousel as well, that requires uploading a new video to that bucket — let me know and I'll handle it separately.
