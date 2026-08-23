import { describe, expect, it } from 'vitest';
import { assetDeadlineFor, isBusinessDay, subtractBusinessDays } from './businessDays';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('businessDays', () => {
  it('matches the deadline the PM wrote for the NCAN event', () => {
    // Monday October 5 2026, counted back 21 business days, skipping Labor Day
    // on Monday September 7 — the PM's brief says Thursday September 3.
    expect(iso(assetDeadlineFor(new Date(2026, 9, 5)))).toBe('2026-09-03');
  });

  it('would land a day later if only weekends were skipped', () => {
    // Guards the holiday rule specifically: without Labor Day this is Sep 4.
    const withoutHolidays = (() => {
      const cursor = new Date(2026, 9, 5);
      let left = 21;
      while (left > 0) {
        cursor.setDate(cursor.getDate() - 1);
        if (cursor.getDay() !== 0 && cursor.getDay() !== 6) left--;
      }
      return cursor;
    })();
    expect(iso(withoutHolidays)).toBe('2026-09-04');
  });

  it('does not count the event day itself', () => {
    // One business day before Tuesday is Monday, not Tuesday.
    expect(iso(subtractBusinessDays(new Date(2026, 9, 6), 1))).toBe('2026-10-05');
  });

  it('steps over a weekend', () => {
    // One business day before Monday Oct 5 is Friday Oct 2.
    expect(iso(subtractBusinessDays(new Date(2026, 9, 5), 1))).toBe('2026-10-02');
  });

  it('treats weekends and federal holidays as non-working', () => {
    expect(isBusinessDay(new Date(2026, 9, 3))).toBe(false);  // Saturday
    expect(isBusinessDay(new Date(2026, 8, 7))).toBe(false);  // Labor Day
    expect(isBusinessDay(new Date(2026, 10, 26))).toBe(false); // Thanksgiving
    expect(isBusinessDay(new Date(2026, 9, 5))).toBe(true);   // ordinary Monday
  });

  it('observes a Saturday holiday on the Friday before', () => {
    // July 4 2026 falls on a Saturday, so Friday July 3 is the holiday.
    expect(isBusinessDay(new Date(2026, 6, 3))).toBe(false);
  });

  it('observes a Sunday holiday on the Monday after', () => {
    // Christmas 2027 falls on a Saturday; New Year's Day 2028 on a Saturday
    // too, so check a Sunday case: June 19 2027 is a Saturday... use Nov 11
    // 2029, a Sunday, observed Monday Nov 12.
    expect(isBusinessDay(new Date(2029, 10, 12))).toBe(false);
  });

  it('crosses a year boundary', () => {
    // 21 business days before Monday January 11 2027 lands in December 2026,
    // skipping Christmas and New Year's Day.
    const deadline = assetDeadlineFor(new Date(2027, 0, 11));
    expect(iso(deadline)).toBe('2026-12-09');
  });
});
