import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `supabase/functions/_shared/eventName.ts` is a copy of this module, because
 * edge functions cannot import from `src/`. The copy is what `sync-google-calendar`
 * names a booking with in Google Calendar. If the two drift, one booking carries
 * two names: one on Soleia's calendar, another on the owner's Google Calendar.
 *
 * Byte-equality from the first `export`; the headers above that differ on purpose.
 */

const body = (source: string) => source.slice(source.indexOf('export '));

const BROWSER = readFileSync('src/lib/eventName.ts', 'utf8').replace(/\r\n/g, '\n');
const DENO_COPY = readFileSync('supabase/functions/_shared/eventName.ts', 'utf8').replace(/\r\n/g, '\n');

describe('eventName — the Deno copy stays in step', () => {
  it('is byte-identical from the first export', () => {
    expect(body(DENO_COPY)).toBe(body(BROWSER));
  });

  it('actually found an export in both', () => {
    expect(BROWSER.indexOf('export ')).toBeGreaterThan(-1);
    expect(DENO_COPY.indexOf('export ')).toBeGreaterThan(-1);
  });

  it('carries a header saying where it came from', () => {
    expect(DENO_COPY.slice(0, DENO_COPY.indexOf('export '))).toContain('src/lib/eventName.ts');
  });
});
