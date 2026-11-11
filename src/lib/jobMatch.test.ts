import { beforeEach, describe, expect, it, vi } from 'vitest';

// findOrCreateJob reads and writes `jobs` through the Supabase client. The
// mock serves a fixed list and records what would have been inserted.
let jobsTable: unknown[] = [];
const inserted: Record<string, unknown>[] = [];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: jobsTable, error: null }),
      insert: (row: Record<string, unknown>) => {
        inserted.push(row);
        return { select: () => ({ single: () => Promise.resolve({ data: { id: 'new-job' }, error: null }) }) };
      },
    }),
  },
}));

import {
  dateFromName,
  distinctiveTokens,
  findOrCreateJob,
  matchStrength,
  pickJob,
  shouldSyncJobIdentity,
  type JobCandidate,
} from './jobMatch';

// The two real jobs from 2026-11-11, as they stood when the session was raised.
const FOURTH_OF_JULY: JobCandidate = {
  id: '8b9e0e53-eae8-6f0b-2a7f-c6e8a56ff155',
  title: '07.04.26 4th of July',
  client_name: 'CAESARS Entertainment',
  event_date: '2026-07-04',
  is_active: false,
};
const F1: JobCandidate = {
  id: '5c13e8c6-d8e1-4b68-80a7-67e5ac4df17f',
  title: '11.19.26 F1 Las Vegas Grand Prix – Caesars',
  client_name: 'F1 Las Vegas Grand Prix – Caesars',
  event_date: '2026-11-19',
  is_active: true,
};

// What Admin > Creative sessions > New Session sent: no date field.
const F1_SESSION = {
  clientName: 'F1 Las Vegas Grand Prix – Caesars',
  eventName: '11.19.26 F1 Las Vegas Grand Prix – Caesars',
  eventDate: null,
};

beforeEach(() => {
  jobsTable = [];
  inserted.length = 0;
});

describe('the F1 session that landed on 4th of July (2026-11-11)', () => {
  it('never matches the 4th of July job', () => {
    expect(matchStrength(F1_SESSION, FOURTH_OF_JULY)).toBeNull();
  });

  it('would not match 4th of July even without the date prefix, on "caesars" alone', () => {
    expect(matchStrength(
      { clientName: 'F1 Las Vegas Grand Prix – Caesars', eventName: 'F1 Las Vegas Grand Prix – Caesars', eventDate: null },
      FOURTH_OF_JULY,
    )).toBeNull();
  });

  it('matches the F1 job exactly, whichever order the jobs come back in', () => {
    expect(pickJob(F1_SESSION, [FOURTH_OF_JULY, F1])).toEqual({ job: F1, strength: 'exact' });
    expect(pickJob(F1_SESSION, [F1, FOURTH_OF_JULY])).toEqual({ job: F1, strength: 'exact' });
  });

  it('attaches to the F1 job and allows its identity sync', async () => {
    jobsTable = [FOURTH_OF_JULY, F1];
    const attached = await findOrCreateJob(F1_SESSION);
    expect(attached).toEqual({ jobId: F1.id, how: 'exact' });
    expect(shouldSyncJobIdentity(attached)).toBe(true);
    expect(inserted).toHaveLength(0);
  });

  it('starts a new, dated job rather than borrow 4th of July when F1 has no job yet', async () => {
    jobsTable = [FOURTH_OF_JULY];
    const attached = await findOrCreateJob(F1_SESSION);
    expect(attached).toEqual({ jobId: 'new-job', how: 'created' });
    expect(inserted).toEqual([{
      title: '11.19.26 F1 Las Vegas Grand Prix – Caesars',
      client_name: 'F1 Las Vegas Grand Prix – Caesars',
      event_date: '2026-11-19',
    }]);
  });
});

describe('dateFromName', () => {
  it('reads the MM.DD.YY prefix', () => {
    expect(dateFromName('11.19.26 F1 Las Vegas Grand Prix – Caesars')).toBe('2026-11-19');
    expect(dateFromName('07.04.26 4th of July')).toBe('2026-07-04');
    expect(dateFromName('9.3.26 - Travcon')).toBe('2026-09-03');
    expect(dateFromName('11/19/2026 F1')).toBe('2026-11-19');
  });

  it('ignores names without a leading date, and impossible dates', () => {
    expect(dateFromName('F1 Las Vegas Grand Prix')).toBeNull();
    expect(dateFromName('Travcon 09.15.26')).toBeNull();
    expect(dateFromName('13.40.26 Nonsense')).toBeNull();
    expect(dateFromName(null)).toBeNull();
  });
});

describe('distinctiveTokens', () => {
  it('drops the venue and brand words every Caesars booking shares', () => {
    expect([...distinctiveTokens('F1 Las Vegas Grand Prix – Caesars')].sort()).toEqual(['f1', 'grand', 'prix']);
    expect([...distinctiveTokens('07.04.26 4th of July', 'CAESARS Entertainment')].sort()).toEqual(['4th', 'july']);
  });
});

describe('matchStrength', () => {
  const mri: JobCandidate = { id: 'mri', title: 'CN - MRI Software', client_name: 'MRI', event_date: '2026-10-19', is_active: true };

  it('pulls a same-day proposal onto the packet\'s job on one shared word', () => {
    expect(matchStrength({ clientName: 'MRI', eventName: 'MRI', eventDate: '2026-10-19' }, mri))
      .toEqual({ strength: 'dated', shared: 1 });
  });

  it('does not match on one shared word when either side is undated', () => {
    expect(matchStrength({ clientName: 'MRI', eventName: 'MRI', eventDate: null }, mri)).toBeNull();
  });

  it('never matches two different known dates, even with the same name', () => {
    expect(matchStrength(
      { clientName: 'MRI', eventName: 'CN - MRI Software', eventDate: '2027-10-19' },
      mri,
    )).toBeNull();
  });

  it('accepts two shared words on an active job when one side is undated', () => {
    const job: JobCandidate = { id: 'z', title: 'MOC&CO x ZAXBYS Path to Hero', client_name: 'MOC&CO x ZAXBYS', event_date: null, is_active: true };
    expect(matchStrength({ clientName: 'MOC&CO x ZAXBYS', eventName: 'Zaxbys Path to Hero', eventDate: null }, job))
      .toEqual({ strength: 'tokens', shared: 4 });
  });

  it('does not take a word-only match onto a closed job', () => {
    const job: JobCandidate = { id: 'z', title: 'MOC&CO x ZAXBYS Path to Hero', client_name: 'MOC&CO x ZAXBYS', event_date: null, is_active: false };
    expect(matchStrength({ clientName: 'MOC&CO x ZAXBYS', eventName: 'Zaxbys Path to Hero', eventDate: null }, job)).toBeNull();
  });
});

describe('pickJob', () => {
  it('prefers the active job when two match equally well', () => {
    const closed: JobCandidate = { id: 'a', title: 'Travcon 2026', client_name: 'CR', event_date: '2026-09-15', is_active: false };
    const open: JobCandidate = { id: 'b', title: 'Travcon 2026', client_name: 'CR', event_date: '2026-09-15', is_active: true };
    expect(pickJob({ clientName: 'CR', eventName: '09.15.26 Travcon 2026', eventDate: null }, [closed, open])?.job.id).toBe('b');
  });

  it('starts a new job rather than guess between two equal word-only matches', () => {
    const one: JobCandidate = { id: 'a', title: 'Acme Spring Launch', client_name: 'Acme', event_date: null, is_active: true };
    const two: JobCandidate = { id: 'b', title: 'Acme Spring Launch Afterparty', client_name: 'Acme', event_date: null, is_active: true };
    expect(pickJob({ clientName: 'Acme', eventName: 'Acme Spring', eventDate: null }, [one, two])).toBeNull();
  });
});

describe('shouldSyncJobIdentity', () => {
  it('lets a created, exact or same-day match rename the job, and nothing weaker', () => {
    expect(shouldSyncJobIdentity({ jobId: 'x', how: 'created' })).toBe(true);
    expect(shouldSyncJobIdentity({ jobId: 'x', how: 'exact' })).toBe(true);
    expect(shouldSyncJobIdentity({ jobId: 'x', how: 'dated' })).toBe(true);
    expect(shouldSyncJobIdentity({ jobId: 'x', how: 'tokens' })).toBe(false);
    expect(shouldSyncJobIdentity(null)).toBe(false);
  });
});
