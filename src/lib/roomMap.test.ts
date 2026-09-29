import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildRoomMapContract, ROOM_MAP_CONTRACT_PATH } from './roomMap';
import { FRAME_W, FRAME_H, PIXEL_MAP_REGIONS } from './venueSurfaces';

const root = resolve(__dirname, '../..');
const contract = buildRoomMapContract();

describe('the published room map', () => {
  it('matches the copy committed to public/', () => {
    const onDisk = JSON.parse(readFileSync(resolve(root, ROOM_MAP_CONTRACT_PATH), 'utf8'));
    // If this fails you changed a rectangle without republishing it. Run
    // `npm run export:room-map` and commit the result: anything generating a
    // frame outside this app reads the JSON, not venueSurfaces.ts.
    expect(onDisk).toEqual(JSON.parse(JSON.stringify(contract)));
  });

  it('names every screen the 3D room names', () => {
    // RoomScene keeps its own REGIONS table because its shader is keyed by the
    // Unreal node name. The numbers must be the same ones, or the previz shows
    // a client a screen that will not match what plays in the venue.
    const src = readFileSync(resolve(root, 'src/components/venue/RoomScene.tsx'), 'utf8');
    const block = src.match(/const REGIONS: Record<string, \[number, number, number, number\]> = \{([\s\S]*?)\n\};/);
    expect(block, 'RoomScene REGIONS table not found — did it move?').toBeTruthy();

    const fromScene = new Map<string, string>();
    for (const line of block![1].split('\n')) {
      const m = line.match(/^\s*(\w+):\s*\[([\d\s,]+)\],/);
      if (m) fromScene.set(m[1], m[2].replace(/\s/g, ''));
    }

    expect(fromScene.size).toBe(contract.regions.length);
    for (const r of contract.regions) {
      expect(fromScene.get(r.node), `${r.label} (${r.node}) missing from RoomScene`).toBe(r.rect.join(','));
    }
  });
});

describe('the rectangles themselves', () => {
  it('all fit inside the frame', () => {
    for (const { label, rect: [x, y, w, h] } of contract.regions) {
      expect(w, `${label} width`).toBeGreaterThan(0);
      expect(h, `${label} height`).toBeGreaterThan(0);
      expect(x + w, `${label} runs off the right edge`).toBeLessThanOrEqual(FRAME_W);
      expect(y + h, `${label} runs off the bottom edge`).toBeLessThanOrEqual(FRAME_H);
    }
  });

  it('never overlap', () => {
    // Two rectangles sharing pixels means one screen showing part of another's
    // content. A generator compositing per-screen has to be able to trust this.
    const rs = contract.regions;
    for (let i = 0; i < rs.length; i++) {
      for (let j = i + 1; j < rs.length; j++) {
        const [ax, ay, aw, ah] = rs[i].rect;
        const [bx, by, bw, bh] = rs[j].rect;
        const overlaps = ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;
        expect(overlaps, `${rs[i].label} overlaps ${rs[j].label}`).toBe(false);
      }
    }
  });

  it('carries a unique, non-empty node name for every screen', () => {
    const nodes = PIXEL_MAP_REGIONS.map((r) => r.node);
    expect(nodes.every(Boolean)).toBe(true);
    expect(new Set(nodes).size).toBe(nodes.length);
  });
});
