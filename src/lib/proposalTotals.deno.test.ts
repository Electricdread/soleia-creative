import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { calcLineTotal, calcProposalTotal, calcSubtotal } from './proposalTotals';

/**
 * `supabase/functions/_shared/proposalTotals.ts` is a copy of this module,
 * because edge functions cannot import from `src/`. The copy is what
 * `studio-sync` publishes proposal totals with, so if the two drift, Studio OS
 * shows the owner a number their client never saw.
 *
 * `finalSlots.test.ts` guards its own Deno copy with `toContain`, which is right
 * for a lookup table. This one is arithmetic: a copy where someone changed `>`
 * to `>=`, or dropped the `is_flat_fee` branch, would sail through a substring
 * check. So the guard here is byte-equality of everything from the first
 * `export` — the headers above that line differ on purpose.
 */

const body = (source: string) => source.slice(source.indexOf('export '));

const BROWSER = readFileSync('src/lib/proposalTotals.ts', 'utf8').replace(/\r\n/g, '\n');
const DENO_COPY = readFileSync('supabase/functions/_shared/proposalTotals.ts', 'utf8').replace(/\r\n/g, '\n');

describe('proposalTotals — the Deno copy stays in step', () => {
  it('is byte-identical from the first export', () => {
    expect(body(DENO_COPY)).toBe(body(BROWSER));
  });

  it('actually found an export in both', () => {
    // A slice from -1 would make the check above pass on two unrelated files.
    expect(BROWSER.indexOf('export ')).toBeGreaterThan(-1);
    expect(DENO_COPY.indexOf('export ')).toBeGreaterThan(-1);
  });

  it('carries a header saying where it came from', () => {
    expect(DENO_COPY.slice(0, DENO_COPY.indexOf('export '))).toContain('src/lib/proposalTotals.ts');
  });
});

/**
 * The rules the published total depends on, pinned here because the endpoint
 * has no test harness of its own. `capture_proposal_signature` in SQL computes
 * `sum(price * GREATEST(quantity,1))` and does NOT honour `is_flat_fee`; these
 * are the semantics that disagree with it, and they are the ones the client saw.
 */
describe('the rules studio-sync publishes', () => {
  it('ignores quantity on a flat fee', () => {
    expect(calcLineTotal({ price: 3000, quantity: 3, is_flat_fee: true })).toBe(3000);
  });

  it('multiplies by quantity otherwise', () => {
    expect(calcLineTotal({ price: 250, quantity: 4 })).toBe(1000);
  });

  it('treats a missing or invalid quantity as one', () => {
    expect(calcLineTotal({ price: 250, quantity: null })).toBe(250);
    expect(calcLineTotal({ price: 250, quantity: 0 })).toBe(250);
    expect(calcLineTotal({ price: 250, quantity: -2 })).toBe(250);
  });

  it('sums only what the client ticked when signed', () => {
    const items = [
      { id: 'a', price: 3000, is_flat_fee: true, client_selected: true },
      { id: 'b', price: 500, quantity: 2, client_selected: false },
      { id: 'c', price: 250, quantity: 4, client_selected: true },
    ];
    expect(calcProposalTotal(items, { signed: true })).toBe(4000);
  });

  it('never falls back to all items — that is the $10,000 ghost total', () => {
    const items = [
      { id: 'a', price: 3000, client_selected: false },
      { id: 'b', price: 7000, client_selected: false },
    ];
    expect(calcProposalTotal(items, { signed: true })).toBe(0);
  });
});

/**
 * A discount is money, and money that is wrong is worse than money that is
 * missing. These pin the edges: the shape of each kind, and the two slips that
 * would otherwise print a proposal owing the client money.
 */
describe('discounts', () => {
  const items = [
    { id: 'a', price: 1000, quantity: 1, client_selected: true },
    { id: 'b', price: 500, quantity: 2, client_selected: true },
  ];
  const signed = { signed: true } as const;

  it('takes a percentage off the selected scope', () => {
    expect(calcSubtotal(items, signed)).toBe(2000);
    expect(calcProposalTotal(items, { ...signed, discount: { type: 'percent', value: 10 } })).toBe(1800);
  });

  it('takes a flat amount off', () => {
    expect(calcProposalTotal(items, { ...signed, discount: { type: 'amount', value: 250 } })).toBe(1750);
  });

  it('never discounts below zero, however large the slip', () => {
    expect(calcProposalTotal(items, { ...signed, discount: { type: 'amount', value: 99999 } })).toBe(0);
    expect(calcProposalTotal(items, { ...signed, discount: { type: 'percent', value: 500 } })).toBe(0);
  });

  it('ignores a discount that is absent, zero or nonsense', () => {
    expect(calcProposalTotal(items, signed)).toBe(2000);
    expect(calcProposalTotal(items, { ...signed, discount: null })).toBe(2000);
    expect(calcProposalTotal(items, { ...signed, discount: { type: 'amount', value: 0 } })).toBe(2000);
    expect(calcProposalTotal(items, { ...signed, discount: { type: 'percent', value: -5 } })).toBe(2000);
  });

  it('discounts only what the client actually accepted', () => {
    const mixed = [...items, { id: 'c', price: 4000, quantity: 1, client_selected: false }];
    expect(calcProposalTotal(mixed, { ...signed, discount: { type: 'percent', value: 50 } })).toBe(1000);
  });

  it('rounds to the cent rather than trailing float dust', () => {
    const odd = [{ id: 'a', price: 333.33, quantity: 1, client_selected: true }];
    expect(calcProposalTotal(odd, { ...signed, discount: { type: 'percent', value: 33 } })).toBe(223.33);
  });
});
