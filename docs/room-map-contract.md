# room-map — the contract a generated frame has to satisfy

**Version 1.** `public/venue/room-map.v1.json`, served at `/venue/room-map.v1.json`.

Generated from `src/lib/venueSurfaces.ts` by `npm run export:room-map`.
Guarded by `src/lib/roomMap.test.ts`.

## Why this exists

The venue plays **one 3840 × 2160 frame** across every LED surface at once. Each
screen is a rectangle inside that frame. Those fifteen rectangles were, until
now, readable only by this app — `venueSurfaces.ts` for the guide, and a second
copy in `RoomScene.tsx` for the 3D previz.

Everything that *generates* a frame lives outside this repo: a ComfyUI graph on
the studio machine, an After Effects template, a render. Each of them has had to
be told the numbers by hand. That is exactly the shape of failure the
[studio-sync contract](studio-sync-contract.md) was written to end — a consumer
holding its own copy of numbers it does not own, then going quietly wrong when
they change. A rectangle moving by eight pixels does not throw an error; it
prints content half onto the neighbouring screen and nobody notices until the
room is full.

So: one published file, regenerated from the single source, with a test that
fails the build if the copy on disk has drifted or if `RoomScene` has diverged.

## What a generator has to get right

1. **The canvas is exactly 3840 × 2160.** Not a crop of one, not a scale of one.
2. **Content goes inside its rectangle.** Pixels outside every rectangle are
   never shown. Pixels crossing a boundary appear on the neighbouring screen.
3. **Aspect ratios are extreme and must be generated for, not scaled to.**
   SR/SL Curves are 2304 × 272 (≈ 8.5:1). The Sol Rays are up to 1920 × 128
   (15:1). A 16:9 generation squeezed into one of these arrives as a stripe;
   generate or outpaint at the stated aspect instead.
4. **The six Sol Rays print on both blades of their pair, the second upside
   down** — one atlas row feeds both. Ray content has to read either way up.
5. **Do not mirror.** The screens read from the audience side and `RoomScene`
   mirrors U when it previews a frame. A generator writing into the map does
   not.
6. **`logo: true` screens already carry one of the ten static logos** included in
   every buyout. Generated content for those has to leave the logo legible.

## Shape

```jsonc
{
  "contract": { "name": "soleia.room-map", "version": 1 },
  "frame": { "w": 3840, "h": 2160, "note": "…" },
  "regions": [ /* below */ ],
  "notes": [ "…" ]           // the rules above, in the file itself
}
```

### Per region

| Field | Notes |
|---|---|
| `label` | The screen's name as the pixel map labels it and the crew says it. |
| `node` | The mesh name in the Unreal export — the stable key. Rename-safe; `label` is not. |
| `band` | `walls`, `curves`, `rays` or `outdoor`. The grouping the guide's legend uses. |
| `logo` | `true` if this screen carries one of the ten included static logos. |
| `rect` | `[x, y, w, h]` in frame pixels, **top-left origin**. |
| `size` | `{ w, h }` — the screen's native resolution, which is the size of its rectangle. |
| `aspect` | `w ÷ h`. Stated because ignoring it is the most common way generated content arrives unusable. |
| `norm` | The same rectangle as fractions of the frame, **top-left origin** — the convention PIL, canvas and ComfyUI crop and paste in. |
| `gl` | The same rectangle **bottom-left origin** — what a GL sampler wants. `RoomScene` computes exactly this for `uRegion`. |

Read defensively and ignore fields you don't know. **Additive-only within a
version:** new optional fields may appear in v1. Removing a field, or changing
what one means, requires v2.

## Versioning

`room-map.v1.json` keeps being served when v2 exists. A consumer should pin the
file it was built against.

## Maintaining it

`npm run export:room-map` after any change to a rectangle, a screen name, a node
name or a logo flag, then commit the regenerated JSON.

`npm run test` covers four things, and there is no CI here, so run it:

- the committed JSON still equals what `venueSurfaces.ts` produces;
- `RoomScene.tsx`'s own `REGIONS` table still holds the identical numbers, so
  the previz a client is shown matches what will play in the room;
- every rectangle fits inside the frame;
- no two rectangles overlap — a generator compositing screen by screen has to be
  able to trust that.
