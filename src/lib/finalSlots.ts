/**
 * The four surfaces a client delivers finished content for, and the Drive
 * folders they land in.
 *
 * Names are load-bearing here: the watcher decides which surface a file is for
 * by looking at the folder it was dropped into, and this project has already
 * lost folders to hand-typed strings — a leading zero split Whatnot across two
 * client folders, a trailing comma split MOC&CO. The same request that created
 * these four spelled them four different ways, one difference being an
 * invisible trailing space.
 *
 * So matching never compares raw names. Everything goes through
 * `normaliseFolderKey`, which lowercases and drops non-alphanumerics, and a
 * table of aliases catches the spellings a person is likely to type. A folder
 * someone renames from "TV Screens" to "TVScreens" keeps working.
 *
 * `supabase/functions/_shared/finalSlots.ts` carries the same table for Deno,
 * which cannot import from `src/`. `finalSlots.test.ts` fails if the two drift.
 */

export type FinalSlot = 'elevator' | 'tv' | 'main_leds' | 'ticker_marquee';

export interface FinalSlotDef {
  slot: FinalSlot;
  /** Folder created inside 04_Finals, and what the client sees in Drive. */
  folder: string;
  /** Label on the job timeline. */
  label: string;
  /** What belongs in it, in the client's words. */
  hint: string;
}

/** Sits alongside 01_Soleia Creative Guide, 02_Pixel Map, 03_Client Asset Collect. */
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

export const FINAL_SLOT_ORDER: FinalSlot[] = FINAL_SLOTS.map((s) => s.slot);

export const FINAL_SLOT_LABEL: Record<FinalSlot, string> = Object.fromEntries(
  FINAL_SLOTS.map((s) => [s.slot, s.label]),
) as Record<FinalSlot, string>;

/** Lowercase, alphanumerics only — so spacing, case and punctuation cannot break a match. */
export function normaliseFolderKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Spellings a person actually types. The canonical folder names resolve through
 * `normaliseFolderKey` on their own; these cover the rest.
 */
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

/** The surface a folder name means, or null when it is not one of the four. */
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

/**
 * Dropped into the finals folder when it is created.
 *
 * The rule also appears in the packet and the Content Delivery Guide, but this
 * is the one that sits in the window where the drag is actually happening — a
 * rule read a fortnight ago does not stop a TV file landing in Main LEDs.
 */
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
