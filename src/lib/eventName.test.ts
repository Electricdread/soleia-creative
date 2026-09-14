import { describe, expect, it } from 'vitest';
import { dayFromEventStart, dayFromTripleseatDate, eventDisplayName } from './eventName';

describe('eventDisplayName', () => {
  it('names a booking after its job, on the day Tripleseat gives', () => {
    expect(eventDisplayName({
      summary: '[D] CR - Travcon 2026',
      dtstart: '2026-09-15T19:30:00',
      jobTitles: ['09.15.26 CR - Travcon 2026'],
    })).toBe('09.15.26 CR - Travcon 2026');
  });

  it("takes the day from Tripleseat's event details over the job title's own", () => {
    expect(eventDisplayName({
      summary: '[D] CR - Travcon 2026',
      dtstart: '2026-09-15T19:30:00',
      tripleseatDate: 'Tue, Sep 15, 2026',
      jobTitles: ['09.14.26 - CR - Travcon 2026'],
    })).toBe('09.15.26 CR - Travcon 2026');
  });

  it("falls back to Tripleseat's name when no single job is linked", () => {
    expect(eventDisplayName({ summary: '[D] whatnot', dtstart: '2026-09-23T19:00:00' })).toBe('09.23.26 whatnot');
    expect(eventDisplayName({
      summary: '[D] EQCA',
      dtstart: '2026-09-25T18:00:00',
      jobTitles: ['09.25.26 EQCA', '09.25.26 EQCA After Party'],
    })).toBe('09.25.26 EQCA');
  });

  it('keeps a late-evening booking on its own day', () => {
    expect(eventDisplayName({ summary: '[D] Late show', dtstart: '2026-09-15T23:30:00' })).toBe('09.15.26 Late show');
  });

  it('leaves the name alone when there is no day to give it', () => {
    expect(eventDisplayName({ summary: '[D] Untimed', dtstart: '' })).toBe('Untimed');
  });
});

describe('day readers', () => {
  it("reads Tripleseat's event page date", () => {
    expect(dayFromTripleseatDate('Tue, Sep 15, 2026')).toBe('09.15.26');
    expect(dayFromTripleseatDate('Thu, Nov 5, 2026')).toBe('11.05.26');
    expect(dayFromTripleseatDate('')).toBeNull();
  });

  it("reads the feed's start as the day it is written", () => {
    expect(dayFromEventStart('2026-09-15T19:30:00')).toBe('09.15.26');
    expect(dayFromEventStart('not a date')).toBeNull();
  });
});
