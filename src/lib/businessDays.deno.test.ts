import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `supabase/functions/_shared/businessDays.ts` is a copy of this module, because
 * edge functions cannot import from `src/`. The copy is what the daily deadline
 * digest counts the 21-business-day content deadline with. If the two drift, the
 * email names one date and the calendar card another.
 *
 * Byte-equality from `const MS_PER_DAY`, not from the first `export`: the private
 * holiday helpers sit above the first export, and they are most of the rule.
 */

// At the start of a line, so the Deno header's own mention of it does not match.
const START = '\nconst MS_PER_DAY';
const body = (source: string) => source.slice(source.indexOf(START));

const BROWSER = readFileSync('src/lib/businessDays.ts', 'utf8').replace(/\r\n/g, '\n');
const DENO_COPY = readFileSync('supabase/functions/_shared/businessDays.ts', 'utf8').replace(/\r\n/g, '\n');

describe('businessDays — the Deno copy stays in step', () => {
  it('is byte-identical from the first line of code', () => {
    expect(body(DENO_COPY)).toBe(body(BROWSER));
  });

  it('actually found the start marker in both', () => {
    expect(BROWSER.indexOf(START)).toBeGreaterThan(-1);
    expect(DENO_COPY.indexOf(START)).toBeGreaterThan(-1);
  });

  it('carries a header saying where it came from', () => {
    expect(DENO_COPY.slice(0, DENO_COPY.indexOf(START))).toContain('src/lib/businessDays.ts');
  });
});
