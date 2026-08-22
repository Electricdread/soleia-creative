import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FINALS_FOLDER,
  FINAL_SLOTS,
  normaliseFolderKey,
  slotForFolderName,
  type FinalSlot,
} from './finalSlots';

/**
 * A folder name is how the watcher decides which surface a delivered file is
 * for, so these tests are about names not drifting — between the two copies of
 * the table, and away from what a person actually types.
 */

const DENO_COPY = readFileSync('supabase/functions/_shared/finalSlots.ts', 'utf8');

describe('finalSlots — the Deno copy stays in step', () => {
  it('declares the same folder root', () => {
    expect(DENO_COPY).toContain(`export const FINALS_FOLDER = '${FINALS_FOLDER}'`);
  });

  it('declares the same four slots, folders and labels', () => {
    for (const def of FINAL_SLOTS) {
      expect(DENO_COPY, `slot ${def.slot}`).toContain(`slot: '${def.slot}'`);
      expect(DENO_COPY, `folder ${def.folder}`).toContain(`folder: '${def.folder}'`);
      expect(DENO_COPY, `label ${def.label}`).toContain(`label: '${def.label}'`);
    }
  });

  it('carries every alias the browser copy carries', () => {
    const aliases = [...DENO_COPY.matchAll(/\['([a-z]+)', '([a-z_]+)'\]/g)].map((m) => m[1]);
    // Anything the browser resolves that is not a canonical folder name must
    // also be listed on the Deno side, or the watcher files it as unfiled.
    for (const probe of ['elevators', 'tvs', 'mainroom', 'marquee']) {
      expect(aliases, `alias ${probe}`).toContain(probe);
    }
  });
});

describe('slotForFolderName', () => {
  it('resolves the canonical folder names', () => {
    expect(slotForFolderName('Elevator')).toBe('elevator');
    expect(slotForFolderName('TV Screens')).toBe('tv');
    expect(slotForFolderName('Main LEDs')).toBe('main_leds');
    expect(slotForFolderName('Ticker Marquee')).toBe('ticker_marquee');
  });

  it('resolves the spellings from the original request', () => {
    // These four are exactly how the owner wrote them — note the trailing
    // space on "TV Screens ", which is invisible and would otherwise miss.
    expect(slotForFolderName('Elevators')).toBe('elevator');
    expect(slotForFolderName('TV Screens ')).toBe('tv');
    expect(slotForFolderName('MainLEDs')).toBe('main_leds');
    expect(slotForFolderName('TickerMarquee')).toBe('ticker_marquee');
  });

  it('survives a client renaming a folder', () => {
    expect(slotForFolderName('tv_screens')).toBe('tv');
    expect(slotForFolderName('  MAIN  LEDS  ')).toBe('main_leds');
    expect(slotForFolderName('Ticker-Marquee')).toBe('ticker_marquee');
  });

  it('returns null for anything else, so a stray folder is never miscounted', () => {
    expect(slotForFolderName('04_Finals')).toBeNull();
    expect(slotForFolderName('03_Client Asset Collect')).toBeNull();
    expect(slotForFolderName('Old versions')).toBeNull();
    expect(slotForFolderName('')).toBeNull();
    expect(slotForFolderName(null)).toBeNull();
  });

  it('never maps two slots to one key', () => {
    const keys = FINAL_SLOTS.map((s) => normaliseFolderKey(s.folder));
    expect(new Set(keys).size).toBe(FINAL_SLOTS.length);
  });

  it('covers every slot exactly once', () => {
    const slots = FINAL_SLOTS.map((s) => s.slot);
    const expected: FinalSlot[] = ['elevator', 'tv', 'main_leds', 'ticker_marquee'];
    expect([...slots].sort()).toEqual([...expected].sort());
  });
});
