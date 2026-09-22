/**
 * The room contract — what a frame has to satisfy before it can play here.
 *
 * `venueSurfaces.ts` already holds the fifteen rectangles that make up the
 * 3840 × 2160 pixel map, but only this app can read them. Anything that
 * *generates* a frame lives outside it: a ComfyUI graph on the studio machine,
 * an After Effects template, a render farm. Each of those has, so far, had to
 * be told the numbers by hand, which is the same failure the studio-sync
 * contract was written to end — a consumer holding its own copy of numbers it
 * does not own, and going quietly wrong when they change.
 *
 * So this module derives a publishable form of the same list, and
 * `public/venue/room-map.v1.json` is that form committed to disk. A generator
 * reads the JSON; the JSON is regenerated from `venueSurfaces.ts`; and
 * `roomMap.test.ts` fails the build if the committed copy has drifted. There is
 * still exactly one place a rectangle is edited.
 *
 * Regenerate with `npm run export:room-map`.
 */
import { FRAME_W, FRAME_H, PIXEL_MAP_REGIONS, type PixelMapRegion } from './venueSurfaces';

export const ROOM_MAP_CONTRACT_VERSION = 1;

/** Where the committed copy lives, relative to the repo root. */
export const ROOM_MAP_CONTRACT_PATH = 'public/venue/room-map.v1.json';

export interface RoomMapRegion {
  /** Screen name as the pixel map labels it, and as the crew says it aloud. */
  label: string;
  /** Mesh name in the Unreal export — the stable key for this screen. */
  node: string;
  band: PixelMapRegion['band'];
  /** `true` if this screen carries one of the ten static logos every buyout includes. */
  logo: boolean;
  /** [x, y, w, h] in pixels inside the 3840 × 2160 frame. Top-left origin. */
  rect: [number, number, number, number];
  /** Native pixel size of the screen, which is the size of its rectangle. */
  size: { w: number; h: number };
  /** Width ÷ height. A 16:9 crop dropped onto SR Curves (8.47:1) is the single
   *  most common way generated content arrives unusable, so it is stated. */
  aspect: number;
  /**
   * The same rectangle as fractions of the frame, top-left origin — the
   * convention an image library (PIL, canvas, ComfyUI) crops and pastes in.
   */
  norm: { x: number; y: number; w: number; h: number };
  /**
   * The same rectangle bottom-left origin, which is what a GL sampler wants.
   * `RoomScene` computes exactly this for its `uRegion` uniform.
   */
  gl: { x: number; y: number; w: number; h: number };
}

export interface RoomMapContract {
  contract: { name: string; version: number };
  frame: { w: number; h: number; note: string };
  regions: RoomMapRegion[];
  notes: string[];
}

const round = (n: number) => Number(n.toFixed(6));

export function buildRoomMapContract(): RoomMapContract {
  return {
    contract: { name: 'soleia.room-map', version: ROOM_MAP_CONTRACT_VERSION },
    frame: {
      w: FRAME_W,
      h: FRAME_H,
      note:
        'One frame feeds every screen at once. A generated image is only playable if it is exactly this size and each screen’s content sits inside its own rectangle — anything outside a rectangle is never shown, and anything crossing one bleeds onto the neighbouring screen.',
    },
    regions: PIXEL_MAP_REGIONS.map(({ label, node, rect, band, logo }): RoomMapRegion => {
      const [x, y, w, h] = rect;
      return {
        label,
        node,
        band,
        logo: logo === true,
        rect: [x, y, w, h],
        size: { w, h },
        aspect: round(w / h),
        norm: { x: round(x / FRAME_W), y: round(y / FRAME_H), w: round(w / FRAME_W), h: round(h / FRAME_H) },
        gl: {
          x: round(x / FRAME_W),
          y: round(1 - (y + h) / FRAME_H),
          w: round(w / FRAME_W),
          h: round(h / FRAME_H),
        },
      };
    }),
    notes: [
      'The six Sol Rays are ceiling blades in pairs. Each ray prints on both blades of its pair, the second one upside down, because one atlas row feeds both — so a ray’s content has to read either way up.',
      'The two IMAG walls, the Center panel, all six Sol Rays and the three beachclub exteriors carry one of the ten static logos included in every buyout. The curves and the DJ booth carry motion only.',
      'The curves are extreme letterboxes (2304 × 272, about 8.5:1) and the Sol Rays are more extreme still (up to 15:1). Content generated at 16:9 and scaled to fit one of these arrives as a stripe; generate or outpaint to the stated aspect instead.',
      'Rectangles never overlap. The gaps between them are dead pixels that no screen shows, so they do not need content, but content placed there is lost rather than harmless-looking.',
      'Screens read from the audience side. RoomScene mirrors U when it previews a frame; a generator writing into this map does not, and should not.',
    ],
  };
}
