/**
 * Deno copy of `src/lib/finalSlots.ts`.
 *
 * Edge functions cannot import from `src/`, so the table lives twice.
 * `src/lib/finalSlots.test.ts` reads this file and fails if the folder names,
 * slot keys or aliases drift apart — which matters more than usual here,
 * because a folder name is how the watcher decides which surface a delivered
 * file belongs to.
 *
 * Change one, change both.
 */

export type FinalSlot = 'elevator' | 'tv' | 'main_leds' | 'ticker_marquee';

export interface FinalSlotDef {
  slot: FinalSlot;
  folder: string;
  label: string;
  hint: string;
}

export const FINALS_FOLDER = '04_Finals';

export const FINAL_SLOTS: FinalSlotDef[] = [
  {
    slot: 'elevator',
    folder: 'Elevator',
    label: 'Elevator',
    hint: 'The portrait 600 × 800 elevator loop.',
  },
  {
    slot: 'tv',
    folder: 'TV Screens',
    label: 'TV',
    hint: 'Content for the cabana, bungalow and front-door televisions.',
  },
  {
    slot: 'main_leds',
    folder: 'Main LEDs',
    label: 'MainLEDs',
    hint: 'The 3840 × 2160 room file — walls, curves, ceiling rays and the beachclub exteriors.',
  },
  {
    slot: 'ticker_marquee',
    folder: 'Ticker Marquee',
    label: 'Ticker Marquee',
    hint: 'The exterior street-facing marquee.',
  },
];

export function normaliseFolderKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const ALIASES: [string, FinalSlot][] = [
  ['elevators', 'elevator'],
  ['elevatorled', 'elevator'],
  ['elevatorscreen', 'elevator'],
  ['tv', 'tv'],
  ['tvs', 'tv'],
  ['tvscreen', 'tv'],
  ['televisions', 'tv'],
  ['narrowcasting', 'tv'],
  ['mainled', 'main_leds'],
  ['leds', 'main_leds'],
  ['led', 'main_leds'],
  ['mainroom', 'main_leds'],
  ['mainscreens', 'main_leds'],
  ['ticker', 'ticker_marquee'],
  ['marquee', 'ticker_marquee'],
  ['tickermarque', 'ticker_marquee'],
];

const BY_KEY = new Map<string, FinalSlot>();
for (const def of FINAL_SLOTS) BY_KEY.set(normaliseFolderKey(def.folder), def.slot);
for (const [alias, slot] of ALIASES) BY_KEY.set(alias, slot);

export function slotForFolderName(name: string | null | undefined): FinalSlot | null {
  if (!name) return null;
  return BY_KEY.get(normaliseFolderKey(name)) ?? null;
}

/**
 * Names that mean "this is the finals root".
 *
 * The Whatnot client created theirs by hand, called it `Finals`, and nested it
 * inside `Client Asset Folder` rather than beside it. Insisting on `04_Finals`
 * as a direct child would have created a second, empty folder next to the one
 * they were already using — the duplicate-folder trap this project has hit
 * twice before.
 */
export function isFinalsFolder(name: string | null | undefined): boolean {
  if (!name) return false;
  const k = normaliseFolderKey(name);
  return k === 'finals' || k === '04finals' || k === 'final' || k === 'finalfiles';
}

export const FINALS_README = [
  'SOLEIA — WHERE TO PUT YOUR FINAL FILES',
  '',
  'Please drop each finished file into the subfolder for the screens it plays on.',
  'Files left loose in this folder are not picked up automatically, and we may not',
  'see them in time.',
  '',
  ...FINAL_SLOTS.map((s) => `  ${s.folder}/  —  ${s.hint}`),
  '',
  'Delivery specs, the Pixelmap and the After Effects project are in the Content',
  'Delivery Guide: https://soleiacreative.app/creative-guide/content-delivery',
  '',
  'Questions: contact your Soleia Creative Team representative.',
].join('\n');
