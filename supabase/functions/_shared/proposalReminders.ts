// Reminders about a sent proposal's 72-hour signing window, for the studio only — never the client (owner,
// 2026-10-25: "record when a proposal is sent, set its 72-hour sign-by date, and remind me (internal only) before
// and after it lapses").
//
// proposal-reminders runs hourly. A proposal gets at most two emails per send: one in the last 24 hours before the
// window closes, one once it has closed unsigned. The stamps on proposals record which have gone; the trigger
// proposals_stamp_sent clears them whenever the proposal is sent again.
//
// Plain TypeScript with no Deno APIs, so src/lib/proposalReminders.test.ts can run it under vitest.

const APP_ORIGIN = 'https://soleiacreative.app';
const GOLD = '#c49a3c';
const HOUR = 3_600_000;

/** The client's window to sign, from the packet email: "Please make your selections and sign within 72 hours." */
export const SIGNING_WINDOW_HOURS = 72;
/** How long before the window closes the first reminder goes. */
export const DUE_SOON_HOURS = 24;
/**
 * A lapse older than this is history, not news. Without it, the first run after a missed week would mail every
 * proposal that lapsed in it.
 */
export const STALE_AFTER_HOURS = 7 * 24;

export interface ReminderProposal {
  id: string;
  event_name: string;
  client_name: string | null;
  status: string | null;
  signed_at: string | null;
  is_active: boolean;
  sent_at: string | null;
  reminder_due_sent_at: string | null;
  reminder_lapsed_sent_at: string | null;
  job_id: string | null;
  event_date: string | null;
}

export type ReminderKind = 'due_soon' | 'lapsed';

/** The exact moment the signing window closes, or null when the proposal has no recorded send. */
export function windowClosesAt(p: Pick<ReminderProposal, 'sent_at'>): Date | null {
  if (!p.sent_at) return null;
  return new Date(new Date(p.sent_at).getTime() + SIGNING_WINDOW_HOURS * HOUR);
}

/**
 * Which reminder, if any, this proposal is owed now.
 *
 * Only a live, sent, unsigned proposal is chased, and only when its job is still on (a postponed or cancelled job
 * is never chased). When a run was missed and both are owed, only the lapse goes — "closes in 3 hours" sent after
 * it closed would be wrong.
 */
export function reminderFor(p: ReminderProposal, now: Date, jobActive = true): ReminderKind | null {
  if (!jobActive || !p.is_active || p.signed_at || p.status !== 'sent') return null;
  const closes = windowClosesAt(p);
  if (!closes) return null;
  const msLeft = closes.getTime() - now.getTime();
  if (msLeft <= 0) {
    if (p.reminder_lapsed_sent_at) return null;
    if (-msLeft > STALE_AFTER_HOURS * HOUR) return null;
    return 'lapsed';
  }
  if (msLeft <= DUE_SOON_HOURS * HOUR && !p.reminder_due_sent_at) return 'due_soon';
  return null;
}

// --- the email ---------------------------------------------------------------

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** "Tue, Oct 27, 3:15 PM" on the Strip. */
export function vegasTime(d: Date): string {
  return d.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function hoursPhrase(ms: number): string {
  const hours = Math.max(1, Math.round(Math.abs(ms) / HOUR));
  return hours >= 48 ? `${Math.round(hours / 24)} days` : `${hours} hour${hours === 1 ? '' : 's'}`;
}

export interface ReminderEmail {
  subject: string;
  html: string;
}

export function buildReminderEmail(p: ReminderProposal, kind: ReminderKind, now: Date): ReminderEmail {
  const closes = windowClosesAt(p)!;
  const name = p.event_name;
  const client = p.client_name ?? '';
  const left = closes.getTime() - now.getTime();

  const subject = kind === 'due_soon'
    ? `Proposal unsigned · ${name} · window closes in ${hoursPhrase(left)}`
    : `Proposal window lapsed · ${name} · unsigned`;
  const headline = kind === 'due_soon' ? 'Signing window closes soon' : 'Signing window has lapsed';
  const lead = kind === 'due_soon'
    ? `${client ? `${escapeHtml(client)} has` : 'The client has'} not signed yet. Their 72 hours run out ${escapeHtml(vegasTime(closes))} (Las Vegas).`
    : `${client ? `${escapeHtml(client)} did` : 'The client did'} not sign within 72 hours. The window closed ${escapeHtml(vegasTime(closes))} (Las Vegas), ${hoursPhrase(left)} ago.`;
  const next = kind === 'due_soon'
    ? 'A nudge today is the last one inside the window.'
    : 'The link still works and they can still sign. Chase them, or reopen the conversation about scope.';
  const color = kind === 'due_soon' ? '#d97706' : '#dc2626';

  const show = p.event_date
    ? new Date(`${p.event_date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'no event date';

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0f0f0f;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
        <tr><td style="padding:28px 24px 20px;border-bottom:2px solid ${color};">
          <div style="font-size:11px;color:${GOLD};text-transform:uppercase;letter-spacing:2px;font-weight:700;">Soleia Creative · internal</div>
          <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;font-weight:700;">${headline}</h1>
        </td></tr>
        <tr><td style="padding:24px;">
          <div style="font-size:16px;color:#ffffff;font-weight:600;">${escapeHtml(name)}</div>
          <div style="font-size:13px;color:#9ca3af;margin:2px 0 16px;">${client ? `${escapeHtml(client)} · ` : ''}show ${escapeHtml(show)}</div>
          <p style="font-size:14px;line-height:1.6;color:#e5e7eb;margin:0 0 8px;">${lead}</p>
          <p style="font-size:14px;line-height:1.6;color:#9ca3af;margin:0;">${next}</p>
        </td></tr>
        <tr><td style="padding:0 24px 28px;">
          <a href="${APP_ORIGIN}/admin/proposals" style="display:inline-block;padding:12px 22px;background:${GOLD};color:#0a0a0a;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Open Proposals</a>
        </td></tr>
        <tr><td style="padding:14px 24px;background:#0a0a0a;font-size:11px;color:#6b7280;text-align:center;">
          Sent to the studio only. The client receives nothing from this reminder.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, html };
}
