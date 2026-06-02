## Update

Update the Marquee/Ticker Display specs in `src/lib/creativeGuide.ts` to match the new Caesars / Cromwell pixel map.

### New values

- **PC Display canvas:** 3840 x 2160
- **Active LED Video Display area:** 3792 x 192
- **Segments (2 total, replacing the existing 4):**
  - West Side (Las Vegas Blvd): 1608 x 192
  - South Side (Flamingo Rd): 2184 x 192

### Changes in `DISPLAY_TYPES` → `ticker`

- `videoSpecs.resolution`: `1280x768` → `3840x2160` (full canvas, with active 3792x192 ticker area noted)
- `graphicSpecs.resolution`: `1280x768` → `3840x2160`
- `dimensions` array: replace the 4 entries (`West 1`, `West 2`, `South 1`, `South 2`) with:
  - `{ width: 1608, height: 192, label: 'West (Las Vegas Blvd)' }`
  - `{ width: 2184, height: 192, label: 'South (Flamingo Rd)' }`
- Add a creative note clarifying that content must be placed within the 3792 x 192 active area on a 3840 x 2160 canvas, split West (1608) + South (2184).

### Not changed

- Format (MP4 / H264), duration (15 sec), and all other display types remain untouched.

### Question

Should I keep the H264 / MP4 / 15 sec spec, or also update encoding (e.g. to DXV3 like the LED zones)?
