import { describe, expect, it } from 'vitest';
import {
  buildReminderEmail,
  reminderFor,
  windowClosesAt,
  type ReminderProposal,
} from '../../supabase/functions/_shared/proposalReminders';

/** Proposal reminders (owner, 2026-10-25: "remind me (internal only) before and after it lapses"). */
const SENT = '2026-10-25T17:00:00Z'; // 10 AM in Las Vegas
const at = (iso: string) => new Date(iso);

const proposal = (over: Partial<ReminderProposal> = {}): ReminderProposal => ({
  id: 'p1', event_name: '11.30.26 AWS - APJ', client_name: 'AWS <APJ>', status: 'sent', signed_at: null,
  is_active: true, sent_at: SENT, reminder_due_sent_at: null, reminder_lapsed_sent_at: null,
  job_id: 'j1', event_date: '2026-11-30', ...over,
});

describe('windowClosesAt', () => {
  it('is 72 hours after the send', () => {
    expect(windowClosesAt(proposal())?.toISOString()).toBe('2026-10-28T17:00:00.000Z');
  });
  it('is unknown without a recorded send', () => {
    expect(windowClosesAt(proposal({ sent_at: null }))).toBeNull();
  });
});

describe('reminderFor', () => {
  it('stays quiet for the first two days', () => {
    expect(reminderFor(proposal(), at('2026-10-27T16:00:00Z'))).toBeNull();
  });

  it('warns in the last 24 hours, once', () => {
    expect(reminderFor(proposal(), at('2026-10-27T17:30:00Z'))).toBe('due_soon');
    expect(reminderFor(proposal({ reminder_due_sent_at: '2026-10-27T17:30:00Z' }), at('2026-10-28T10:00:00Z'))).toBeNull();
  });

  it('reports the lapse, once', () => {
    const due = { reminder_due_sent_at: '2026-10-27T17:30:00Z' };
    expect(reminderFor(proposal(due), at('2026-10-28T17:05:00Z'))).toBe('lapsed');
    expect(reminderFor(proposal({ ...due, reminder_lapsed_sent_at: '2026-10-28T17:05:00Z' }), at('2026-10-28T18:05:00Z'))).toBeNull();
  });

  it('sends only the lapse when a run was missed', () => {
    expect(reminderFor(proposal(), at('2026-10-28T20:00:00Z'))).toBe('lapsed');
  });

  it('lets a lapse older than a week go', () => {
    expect(reminderFor(proposal(), at('2026-11-05T18:00:00Z'))).toBeNull();
  });

  it('never chases a signed, withdrawn, draft or held proposal', () => {
    const late = at('2026-10-28T20:00:00Z');
    expect(reminderFor(proposal({ signed_at: '2026-10-26T00:00:00Z', status: 'accepted' }), late)).toBeNull();
    expect(reminderFor(proposal({ is_active: false }), late)).toBeNull();
    expect(reminderFor(proposal({ status: 'draft' }), late)).toBeNull();
    expect(reminderFor(proposal(), late, false)).toBeNull();
  });
});

describe('buildReminderEmail', () => {
  it('says when the window closes, on the Strip, and escapes the client', () => {
    const email = buildReminderEmail(proposal(), 'due_soon', at('2026-10-27T21:00:00Z'));
    expect(email.subject).toBe('Proposal unsigned · 11.30.26 AWS - APJ · window closes in 20 hours');
    expect(email.html).toContain('Wed, Oct 28, 10:00 AM');
    expect(email.html).toContain('AWS &lt;APJ&gt;');
    expect(email.html).toContain('The client receives nothing from this reminder.');
  });

  it('names a lapse as one', () => {
    const email = buildReminderEmail(proposal(), 'lapsed', at('2026-10-28T20:00:00Z'));
    expect(email.subject).toBe('Proposal window lapsed · 11.30.26 AWS - APJ · unsigned');
    expect(email.html).toContain('3 hours ago');
  });
});
