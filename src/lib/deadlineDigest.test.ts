import { describe, expect, it } from 'vitest';
import {
  buildDeadlineDigest,
  businessDaysUntil,
  digestAction,
  isClientAsset,
  parseDay,
  planDigest,
} from '../../supabase/functions/_shared/deadlineDigest';
import type { AttachedProposal, JobWithMembers } from './jobStage';

/**
 * The daily deadline digest (owner, 2026-10-25). Job names follow the live board on that day; ids are made up.
 */
const TODAY = '2026-10-25';

const job = (over: Partial<JobWithMembers['job']> & { id: string; title: string }, members: Partial<JobWithMembers> = {}): JobWithMembers => ({
  job: {
    client_name: over.title, event_date: null, track: 'creative', call_held_on: null,
    drive_folder_id: null, drive_folder_url: null, notes: null, is_active: true, ...over,
  },
  proposals: [], packets: [], sessions: [], assetCount: 0, hasCreativePackage: false, meetingCount: 0,
  ...members,
});

const proposal = (over: Partial<AttachedProposal>): AttachedProposal => ({
  id: 'p', token: 't', event_name: 'x', status: 'draft', signed_at: null, is_active: true,
  signoff_due_on: null, drive_folder_id: null, ...over,
});
const packet = { id: 'k', token: 't', title: 'packet', kind: 'creative_post_call', is_active: true, drive_folder_id: null };

describe('isClientAsset', () => {
  it('counts what is in the asset drop, on old and new folder names', () => {
    expect(isClientAsset({ file_name: 'AAPL-Logo.png', parent_folder_name: '03_Client Asset Collect', final_slot: null })).toBe(true);
    expect(isClientAsset({ file_name: 'logo.eps', parent_folder_name: 'Client Asset Collect', final_slot: null })).toBe(true);
  });

  it('counts the top of a drop-only folder', () => {
    expect(isClientAsset({ file_name: 'BoRS 2026 logo_blk.eps', parent_folder_name: '', final_slot: null })).toBe(true);
    expect(isClientAsset({ file_name: 'Asset 1.png', parent_folder_name: null, final_slot: null })).toBe(true);
  });

  it("never counts Soleia's seeded files or a final", () => {
    expect(isClientAsset({ file_name: 'SOLEIA - Creative Guide Project.zip', parent_folder_name: '01_Soleia Creative Guide', final_slot: null })).toBe(false);
    expect(isClientAsset({ file_name: 'SOLEIA-Pixel-Map.png', parent_folder_name: '02_Pixel Map', final_slot: null })).toBe(false);
    expect(isClientAsset({ file_name: 'READ ME — where to put finals.txt', parent_folder_name: '04_Finals', final_slot: null })).toBe(false);
    expect(isClientAsset({ file_name: 'Kioti_MAINLEDs.mov', parent_folder_name: 'Main LEDs', final_slot: 'main_leds' })).toBe(false);
    // Dragged into the drop by hand — still Soleia's.
    expect(isClientAsset({ file_name: 'SOLEIA Pixel Map.png', parent_folder_name: '03_Client Asset Collect', final_slot: null })).toBe(false);
  });
});

describe('businessDaysUntil', () => {
  it('counts working days ahead and calendar days behind', () => {
    // Sun Oct 25 → Wed Oct 28: Mon, Tue, Wed.
    expect(businessDaysUntil(parseDay(TODAY), parseDay('2026-10-28'))).toBe(3);
    expect(businessDaysUntil(parseDay(TODAY), parseDay(TODAY))).toBe(0);
    expect(businessDaysUntil(parseDay(TODAY), parseDay('2026-10-06'))).toBe(-19);
  });

  it('skips Veterans Day', () => {
    // Tue Nov 10 → Thu Nov 12 is one working day, not two.
    expect(businessDaysUntil(parseDay('2026-11-10'), parseDay('2026-11-12'))).toBe(1);
  });
});

describe('digestAction', () => {
  it('asks for a draft proposal to be sent, which nextAction does not', () => {
    const j = job({ id: 'kioti', title: 'Kioti Tractor', event_date: '2026-11-08' }, { packets: [packet], proposals: [proposal({ status: 'draft' })] });
    expect(digestAction(j)?.verb).toBe('Send');
  });

  it('leaves a signed job with client files alone', () => {
    const j = job({ id: 'ok', title: 'Fine', event_date: '2026-11-20' }, {
      proposals: [proposal({ status: 'accepted', signed_at: '2026-10-01T00:00:00Z' })], assetCount: 4,
    });
    expect(digestAction(j)).toBeNull();
  });
});

describe('planDigest', () => {
  const board = [
    // Played: was "33d overdue" in the old digest.
    job({ id: 'whatnot', title: '9.23.26 Whatnot', event_date: '2026-09-23' }, { proposals: [proposal({ status: 'accepted', signed_at: '2026-09-01T00:00:00Z' })] }),
    job({ id: 'roadster', title: '11.05.26 Roadster Shop', event_date: '2026-11-05' }, { packets: [packet], assetCount: 6 }),
    job({ id: 'aapl', title: '11.09.26 AAPL', event_date: '2026-11-09' }, { packets: [packet], proposals: [proposal({ status: 'sent' })], assetCount: 17 }),
    job({ id: 'aws', title: '11.30.26 AWS - APJ', event_date: '2026-11-30' }, { packets: [packet], proposals: [proposal({ status: 'draft' })], assetCount: 1 }),
    job({ id: 'shine', title: '12.01.26 CN - Shine Tours', event_date: '2026-12-01' }, { packets: [packet], proposals: [proposal({ status: 'draft' })] }),
    job({ id: 'far', title: 'Next spring', event_date: '2027-04-01' }, { packets: [packet] }),
    job({ id: 'daiken', title: '11.10.2026 DAIKEN' }, { sessions: [{ id: 's', token: 't', project_name: 'x', is_active: true }] }),
    job({ id: 'off', title: 'Switched off', event_date: '2026-11-01', is_active: false }, { packets: [packet] }),
  ];
  const plan = planDigest({ today: TODAY, jobs: board });
  const row = (id: string) => plan.rows.find((r) => r.jobId === id);

  it('leaves out played shows, far-off shows and inactive jobs', () => {
    expect(row('whatnot')).toBeUndefined();
    expect(row('far')).toBeUndefined();
    expect(row('off')).toBeUndefined();
    expect(plan.played).toBe(1);
  });

  it('carries the 21-business-day content deadline the calendar card shows', () => {
    expect(row('roadster')?.contentDue).toBe('2026-10-06');
    expect(row('aws')?.contentDue).toBe('2026-10-28');
    expect(row('aws')?.contentDays).toBe(3);
  });

  it('puts a missed or imminent content deadline under Act now', () => {
    expect(row('roadster')?.bucket).toBe('now');
    expect(row('aapl')?.bucket).toBe('now');
    expect(row('aws')?.bucket).toBe('now');
    expect(row('shine')?.contentDays).toBe(4);
    expect(row('shine')?.bucket).toBe('week');
  });

  it('keeps an undated job in its own section', () => {
    expect(row('daiken')?.bucket).toBe('undated');
  });

  it('orders by show date', () => {
    expect(plan.rows.map((r) => r.jobId)).toEqual(['roadster', 'aapl', 'aws', 'shine', 'daiken']);
  });

  it('flags a sent proposal whose sign-by date has passed', () => {
    const late = planDigest({
      today: TODAY,
      jobs: [job({ id: 'x', title: 'X', event_date: '2027-01-15' }, { packets: [packet], proposals: [proposal({ status: 'sent', signoff_due_on: '2026-10-20' })] })],
    });
    expect(late.rows[0].signByPassed).toBe('2026-10-20');
    expect(late.rows[0].bucket).toBe('now');
  });
});

describe('buildDeadlineDigest', () => {
  it('sends nothing when nothing is waiting', () => {
    expect(buildDeadlineDigest(TODAY, { rows: [], onTrack: 3, played: 9 })).toBeNull();
  });

  it('names what to do, not how many days are left', () => {
    const plan = planDigest({
      today: TODAY,
      jobs: [job({ id: 'aws', title: '11.30.26 AWS - APJ', client_name: 'AWS <APJ>', event_date: '2026-11-30' }, { packets: [packet], proposals: [proposal({ status: 'draft' })] })],
    });
    const digest = buildDeadlineDigest(TODAY, plan)!;
    expect(digest.subject).toBe('Soleia · 1 to act on now · 0 this week');
    expect(digest.html).toContain('Proposal still a draft — not sent');
    expect(digest.html).toContain('Content due Wed, Oct 28 · 3 business days');
    expect(digest.html).toContain('Nothing from the client yet');
    expect(digest.html).toContain('AWS &lt;APJ&gt;');
    expect(digest.html).not.toContain('overdue');
  });
});
