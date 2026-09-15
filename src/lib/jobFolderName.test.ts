import { describe, expect, it } from 'vitest';
import { folderDay, jobFolderName } from '../../supabase/functions/_shared/jobFolderName';

/**
 * The client job folder name (owner, 2026-09-14): "MM.DD.YY" + the job title, the same words as the
 * calendar. The cases are the job titles and dates behind the 22 folders renamed in Drive that day.
 */
describe('jobFolderName', () => {
  it('names folders the way they were renamed in Drive', () => {
    const cases: [string, string, string][] = [
      ['CR - Travcon 2026', '2026-09-15', '09.15.26 CR - Travcon 2026'],
      ['09.05.26 LABOR DAY', '2026-09-05', '09.05.26 LABOR DAY'],
      ['09.23.26 WHATNOT', '2026-09-23', '09.23.26 WHATNOT'],
      ['09.29.26 Interstate15+G2E', '2026-09-29', '09.29.26 Interstate15+G2E'],
      ['09.30.26 |525 Productions x ZAXBYS', '2026-09-30', '09.30.26 525 Productions x ZAXBYS'],
      ['06.24.26 | Transperfect Event', '2026-06-24', '06.24.26 Transperfect Event'],
      ['05.27 GainSight', '2026-05-27', '05.27.26 GainSight'],
      ['07.20 Fudale x Github', '2026-07-20', '07.20.26 Fudale x Github'],
      ['10.22.26 Mitsubishi Laser - Fabtech 2026', '2026-10-22', '10.22.26 Mitsubishi Laser - Fabtech 2026'],
      ['11.10.26 CR-ServiceNation', '2026-11-10', '11.10.26 CR-ServiceNation'],
      ['08.25.26 World Wide Technology', '2026-08-25', '08.25.26 World Wide Technology'],
    ];
    for (const [title, date, expected] of cases) expect(jobFolderName(title, date)).toBe(expected);
  });

  it('takes the day from the event date, not from a day the title carries', () => {
    expect(jobFolderName('09.14.26 - Rendezvous', '2026-10-14')).toBe('10.14.26 Rendezvous');
  });

  it('keeps the title alone when there is no event date', () => {
    expect(jobFolderName('Soleia Pre-Call Packet', null)).toBe('Soleia Pre-Call Packet');
    expect(folderDay('')).toBeNull();
  });

  it('reads a timestamp by its date', () => {
    expect(jobFolderName('HLTH26', '2026-11-17T08:00:00Z')).toBe('11.17.26 HLTH26');
  });

  it('replaces characters a Windows folder cannot hold', () => {
    expect(jobFolderName('A/B: C?', '2026-01-02')).toBe('01.02.26 A-B- C-');
  });

  it('never turns a client name that starts with digits into a date', () => {
    expect(jobFolderName('525 Productions x ZAXBYS', '2026-09-30')).toBe('09.30.26 525 Productions x ZAXBYS');
  });
});
