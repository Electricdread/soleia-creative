/**
 * Writes `public/venue/room-map.v1.json` from `src/lib/venueSurfaces.ts`.
 *
 * Run it after changing a rectangle, a screen name or a logo flag:
 *   npm run export:room-map
 *
 * `src/lib/roomMap.test.ts` fails if you forget.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildRoomMapContract, ROOM_MAP_CONTRACT_PATH } from '../src/lib/roomMap';

const out = resolve(process.cwd(), ROOM_MAP_CONTRACT_PATH);
writeFileSync(out, `${JSON.stringify(buildRoomMapContract(), null, 2)}\n`);
console.log(`wrote ${ROOM_MAP_CONTRACT_PATH}`);
