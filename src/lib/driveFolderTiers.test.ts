import { describe, expect, it } from 'vitest';
import {
  folderShowDate,
  folderTier,
  nearestColour,
  venueToday,
} from '../../supabase/functions/_shared/driveFolderTiers';

/**
 * Client job folders by how close the show is (owner, 2026-09-14): red within 7 days, indiglo 8 to 30 days
 * out, plain after that, and into Archive 7 days after the show. The dates are the real folders' shows, read
 * on 2026-09-14.
 */
describe('folderTier', () => {
  const today = '2026-09-14';

  it('sorts the real folders the way the owner picked', () => {
    const cases: [string, string][] = [
      ['2026-09-15', 'hot'], // CR - Travcon 2026
      ['2026-09-21', 'hot'], // 7 days out
      ['2026-09-22', 'soon'], // 8 days out
      ['2026-09-23', 'soon'], // WHATNOT
      ['2026-10-14', 'soon'], // Rendezvous, 30 days out
      ['2026-10-19', 'later'], // CN - MRI Software
      ['2026-11-17', 'later'], // HLTH26
      ['2026-09-13', 'past'], // yesterday
      ['2026-09-08', 'past'], // 6 days ago
      ['2026-09-07', 'archive'], // 7 days ago
      ['2026-09-05', 'archive'], // LABOR DAY
      ['2026-05-27', 'archive'], // GainSight
    ];
    for (const [date, tier] of cases) expect(folderTier(date, today), date).toBe(tier);
  });

  it('counts the show day itself as within 7 days', () => {
    expect(folderTier('2026-09-14', today)).toBe('hot');
  });

  it('reads a timestamp by its date and leaves an undated folder alone', () => {
    expect(folderTier('2026-09-15T08:00:00Z', today)).toBe('hot');
    expect(folderTier(null, today)).toBeNull();
    expect(folderTier('', today)).toBeNull();
  });
});

describe('venueToday', () => {
  it('is the Las Vegas day, not the UTC one', () => {
    // 02:34 UTC on the 15th is 19:34 on the 14th in Las Vegas.
    expect(venueToday(new Date('2026-09-15T02:34:00Z'))).toBe('2026-09-14');
    expect(venueToday(new Date('2026-09-15T08:00:00Z'))).toBe('2026-09-15');
  });
});

describe('folderShowDate', () => {
  const today = '2026-09-14';

  it('follows the soonest show still to come', () => {
    expect(folderShowDate(['2026-09-05', '2026-10-05'], today)).toBe('2026-10-05');
    expect(folderShowDate(['2026-09-10', '2026-09-20', '2026-11-01'], today)).toBe('2026-09-20');
  });

  it('follows the latest show once all are past', () => {
    expect(folderShowDate(['2026-06-11', '2026-07-04'], today)).toBe('2026-07-04');
    expect(folderShowDate(['2026-09-05', '2026-09-10'], today)).toBe('2026-09-10');
  });

  it('has no date when no record carries one', () => {
    expect(folderShowDate([null, undefined, ''], today)).toBeNull();
  });
});

describe('nearestColour', () => {
  it('snaps to the closest colour Drive offers', () => {
    expect(nearestColour('#5AA9FF', ['#f83a22', '#4986e7', '#9fc6e7'])).toBe('#4986e7');
    expect(nearestColour('#E53935', ['#f83a22', '#4986e7', '#9fc6e7'])).toBe('#f83a22');
  });

  it('asks for the colour itself when there is no palette', () => {
    expect(nearestColour('#5AA9FF', [])).toBe('#5AA9FF');
  });
});
