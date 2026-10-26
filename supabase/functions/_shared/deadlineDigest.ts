// The daily deadline digest, built around the dates the workflow actually runs on (owner, 2026-10-25: "alert
// dates, proposal reminders, overall notifications workflow needs attention").
//
// The digest it replaces counted down to each record's show date. A signed proposal for a show that had already
// played read "33d overdue" in red, while the date that matters — client content is due 21 business days before
// the show — appeared nowhere. On 2026-10-25 its subject said "10 overdue": all ten were past shows, and the seven
// jobs that had really missed their content deadline were not named.
//
// This one reads jobs. Each upcoming job gets one row: the thing it is waiting on (nextAction, the same rule as
// the dashboard's Needs you card), its content deadline, and whether the client has sent anything. Shows already
// played are left out.
//
// Plain TypeScript with no Deno APIs, so src/lib/deadlineDigest.test.ts can run it under vitest.

import { assetDeadlineFor, isBusinessDay } from './businessDays.ts';
import {
  nextAction,
  type AttachedPacket, type AttachedProposal, type AttachedSession, type JobRecord, type JobWithMembers, type NextAction,
} from './jobStage.ts';

const APP_ORIGIN = 'https://soleiacreative.app';
const GOLD = '#c49a3c';
const RED = '#dc2626';
const AMBER = '#d97706';
const GREEN = '#16a34a';

/** How far ahead the digest looks. A content deadline sits about a month before its show. */
export const HORIZON_DAYS = 60;

export interface SeenFile {
  file_name: string | null;
  parent_folder_name: string | null;
  final_slot: string | null;
}

/**
 * Whether a file in a job's Drive folder is something the client sent.
 *
 * The folder holds Soleia's own material too: a full pre-call folder is seeded with the Creative Guide ZIP in
 * `01_`, the Pixel Map in `02_` and a READ ME in `04_Finals`, and finished files land under `04_Finals/<surface>`.
 * Counting every file — as the Jobs screen does — reports "3 files" for a client who has sent nothing.
 *
 * What counts: a file in the asset drop (`03_Client Asset Collect`, or plain `Client Asset Collect` on older
 * jobs), or at the top of the folder, which is where a post-call drop-only folder keeps them. Never a final, and
 * never a file named like Soleia's own.
 */
export function isClientAsset(file: SeenFile): boolean {
  if (file.final_slot) return false;
  const name = (file.file_name ?? '').trim().toLowerCase();
  if (name.startsWith('soleia') || name.startsWith('read me')) return false;
  const parent = (file.parent_folder_name ?? '').trim().toLowerCase();
  return parent === '' || parent.endsWith('client asset collect');
}

// --- jobs --------------------------------------------------------------------

export interface RollupInput {
  jobs: JobRecord[];
  proposals: (AttachedProposal & { job_id: string })[];
  packets: (AttachedPacket & { job_id: string })[];
  sessions: (AttachedSession & { job_id: string })[];
  /** Client-selected proposal items, for the Creative Package flag. */
  packageItems: { proposal_id: string; category: string | null; title: string | null }[];
  assocs: { event_uid: string; entity_id: string }[];
  meetings: { event_uid: string }[];
  files: (SeenFile & { drive_folder_id: string | null })[];
}

/**
 * Jobs with their records, put together as src/hooks/useJobs.ts does, with one deliberate difference:
 * `assetCount` is client files only (isClientAsset), not every file in the folder.
 */
export function rollupJobs(input: RollupInput): JobWithMembers[] {
  const filesByFolder = new Map<string, number>();
  for (const f of input.files) {
    if (!f.drive_folder_id || !isClientAsset(f)) continue;
    filesByFolder.set(f.drive_folder_id, (filesByFolder.get(f.drive_folder_id) ?? 0) + 1);
  }

  const packageProposals = new Set(input.packageItems
    .filter((i) => i.category === 'Soleia Creative Package' || String(i.title ?? '').toLowerCase().includes('creative package'))
    .map((i) => i.proposal_id));

  const meetingsByEvent = new Map<string, number>();
  for (const m of input.meetings) {
    meetingsByEvent.set(m.event_uid, (meetingsByEvent.get(m.event_uid) ?? 0) + 1);
  }
  const eventsByEntity = new Map<string, string[]>();
  for (const a of input.assocs) {
    eventsByEntity.set(a.entity_id, [...(eventsByEntity.get(a.entity_id) ?? []), a.event_uid]);
  }

  return input.jobs.map((job) => {
    const jobProposals = input.proposals.filter((p) => p.job_id === job.id);
    const jobPackets = input.packets.filter((p) => p.job_id === job.id);
    const jobSessions = input.sessions.filter((s) => s.job_id === job.id);

    const folders = new Set(
      [job.drive_folder_id, ...jobProposals.map((p) => p.drive_folder_id), ...jobPackets.map((p) => p.drive_folder_id)]
        .filter(Boolean) as string[],
    );
    let assetCount = 0;
    folders.forEach((f) => { assetCount += filesByFolder.get(f) ?? 0; });

    const eventUids = new Set<string>();
    for (const r of [...jobProposals, ...jobPackets, ...jobSessions]) {
      for (const uid of eventsByEntity.get(r.id) ?? []) eventUids.add(uid);
    }
    let meetingCount = 0;
    eventUids.forEach((uid) => { meetingCount += meetingsByEvent.get(uid) ?? 0; });

    return {
      job,
      proposals: jobProposals,
      packets: jobPackets,
      sessions: jobSessions,
      assetCount,
      hasCreativePackage: jobProposals.some((p) => packageProposals.has(p.id)),
      meetingCount,
    };
  });
}

// --- dates -------------------------------------------------------------------

/** `YYYY-MM-DD` as a local-midnight Date, which is what businessDays.ts works in. */
export function parseDay(day: string): Date {
  const [y, m, d] = day.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dayKey(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function calendarDaysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/**
 * Business days left to do the work, `from` exclusive and `to` inclusive: 0 when it is due today, negative once it
 * has passed. Negative values count calendar days, because "19 days late" is how a person reads lateness.
 */
export function businessDaysUntil(from: Date, to: Date): number {
  if (to.getTime() <= from.getTime()) return calendarDaysBetween(from, to);
  let count = 0;
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (cursor.getTime() < to.getTime()) {
    cursor.setDate(cursor.getDate() + 1);
    if (isBusinessDay(cursor)) count++;
  }
  return count;
}

const fmtShort = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fmtLong = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

// --- rows --------------------------------------------------------------------

export type Bucket = 'now' | 'week' | 'later' | 'undated';

export interface DigestRow {
  jobId: string;
  title: string;
  client: string;
  eventDate: string | null;
  /** Calendar days to the show. */
  daysToShow: number | null;
  /** The 21-business-day content deadline, `YYYY-MM-DD`; null for an in-house or undated job. */
  contentDue: string | null;
  /** Business days to the content deadline; negative is calendar days late. */
  contentDays: number | null;
  clientFiles: number;
  action: NextAction;
  /** A sent, unsigned proposal's sign-by date (72 hours after it was sent). */
  signBy: string | null;
  /** The same date, once it has passed. */
  signByPassed: string | null;
  bucket: Bucket;
}

/**
 * The one thing a job is waiting on. nextAction, plus the case it does not cover: a proposal that exists but was
 * never sent. nextAction treats any proposal as "quoted", so a draft sitting unsent three weeks from the show
 * asks for nothing.
 */
export function digestAction(j: JobWithMembers): NextAction | null {
  const action = nextAction(j);
  if (action) return action;
  if (j.job.track === 'creative' && j.proposals.length > 0
    && !j.proposals.some((p) => !!p.signed_at || p.status === 'sent')) {
    return { label: 'Proposal still a draft — not sent', verb: 'Send', href: '/admin/proposals', weight: 11, kind: 'sign' };
  }
  return null;
}

/**
 * Where a job goes in the email.
 *
 * Act now: the show is a week out, the content deadline is within three business days or gone, or a sent
 * proposal is past its sign-by date. This week: the deadline is within seven business days or the show within a
 * fortnight. Everything else with something waiting is coming up.
 */
export function bucketFor(row: Omit<DigestRow, 'bucket'> & { tomorrow: string }): Bucket {
  if (row.daysToShow === null) return 'undated';
  if (row.daysToShow <= 7 || row.signByPassed) return 'now';
  // Due today or tomorrow: the window is closing, whatever the show date.
  if (row.signBy && row.signBy <= row.tomorrow) return 'now';
  if (row.contentDays !== null && row.contentDays <= 3) return 'now';
  if (row.daysToShow <= 14 || (row.contentDays !== null && row.contentDays <= 7)) return 'week';
  return 'later';
}

export interface DigestInput {
  /** Today in Las Vegas, `YYYY-MM-DD`. */
  today: string;
  /** Active jobs with their records. `assetCount` must already be client files only — see isClientAsset. */
  jobs: JobWithMembers[];
}

export interface DigestPlan {
  rows: DigestRow[];
  /** Upcoming jobs with nothing waiting. */
  onTrack: number;
  /** Active jobs whose show has already played, left out of the email. */
  played: number;
}

export function planDigest({ today, jobs }: DigestInput): DigestPlan {
  const now = parseDay(today);
  const tomorrow = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const rows: DigestRow[] = [];
  let onTrack = 0;
  let played = 0;

  for (const j of jobs) {
    if (!j.job.is_active) continue;
    const show = j.job.event_date ? parseDay(j.job.event_date) : null;
    const daysToShow = show ? calendarDaysBetween(now, show) : null;
    if (daysToShow !== null && daysToShow < 0) { played++; continue; }

    const sent = j.proposals.find((p) => !p.signed_at && p.status === 'sent');
    const signBy = sent?.signoff_due_on ?? null;
    const signByPassed = signBy && signBy < today ? signBy : null;
    // A lapsed sign-by date is chased however far off the show is.
    if (daysToShow !== null && daysToShow > HORIZON_DAYS && !signByPassed) continue;

    const action = digestAction(j);
    if (!action) { onTrack++; continue; }

    const due = show && j.job.track === 'creative' ? assetDeadlineFor(show) : null;

    const base = {
      jobId: j.job.id,
      title: j.job.title,
      client: j.job.client_name,
      eventDate: j.job.event_date,
      daysToShow,
      contentDue: due ? dayKey(due) : null,
      contentDays: due ? businessDaysUntil(now, due) : null,
      clientFiles: j.assetCount,
      action,
      signBy,
      signByPassed,
    };
    rows.push({ ...base, bucket: bucketFor({ ...base, tomorrow }) });
  }

  // Soonest show first, then the more urgent action, then the name, so the order never depends on query order.
  rows.sort((a, b) =>
    (a.daysToShow ?? Infinity) - (b.daysToShow ?? Infinity)
    || a.action.weight - b.action.weight
    || a.title.localeCompare(b.title));

  return { rows, onTrack, played };
}

// --- the email ---------------------------------------------------------------

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function chip(text: string, color: string): string {
  return `<span style="display:inline-block;margin:6px 6px 0 0;padding:3px 9px;border-radius:999px;background:${color}22;color:${color};font-size:11px;font-weight:600;border:1px solid ${color}55;">${escapeHtml(text)}</span>`;
}

function contentChip(row: DigestRow): string {
  if (!row.contentDue || row.contentDays === null) return '';
  const when = fmtShort(parseDay(row.contentDue));
  const has = row.clientFiles > 0;
  if (row.contentDays < 0) {
    const late = Math.abs(row.contentDays);
    return chip(`Content was due ${when} · ${late} day${late === 1 ? '' : 's'} ago`, has ? AMBER : RED);
  }
  if (row.contentDays === 0) return chip(`Content due today`, has ? AMBER : RED);
  const n = row.contentDays;
  return chip(`Content due ${when} · ${n} business day${n === 1 ? '' : 's'}`, n <= 3 ? RED : n <= 7 ? AMBER : GOLD);
}

function assetsChip(row: DigestRow): string {
  if (row.contentDue === null) return '';
  return row.clientFiles > 0
    ? chip(`${row.clientFiles} client file${row.clientFiles === 1 ? '' : 's'} in`, GREEN)
    : chip('Nothing from the client yet', row.contentDays !== null && row.contentDays <= 7 ? RED : '#9ca3af');
}

function showLabel(row: DigestRow): string {
  if (!row.eventDate || row.daysToShow === null) return 'No event date';
  const when = fmtShort(parseDay(row.eventDate));
  if (row.daysToShow === 0) return `${when} · show is today`;
  return `${when} · show in ${row.daysToShow} day${row.daysToShow === 1 ? '' : 's'}`;
}

function rowHtml(row: DigestRow): string {
  const signBy = row.signByPassed
    ? chip(`Sign-by date passed · ${fmtShort(parseDay(row.signByPassed))}`, RED)
    : row.signBy ? chip(`Client signs by ${fmtShort(parseDay(row.signBy))}`, AMBER) : '';
  return `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #2a2a2a;">
        <div style="font-size:15px;color:#ffffff;font-weight:600;margin-bottom:2px;">${escapeHtml(row.title)}</div>
        <div style="font-size:12px;color:#9ca3af;margin-bottom:8px;">${escapeHtml(row.client)} · ${showLabel(row)}</div>
        <div style="font-size:14px;color:#e5e7eb;">${escapeHtml(row.action.label)}</div>
        <div>${contentChip(row)}${assetsChip(row)}${signBy}</div>
      </td>
      <td align="right" valign="middle" style="padding:14px 16px;border-bottom:1px solid #2a2a2a;white-space:nowrap;">
        <a href="${APP_ORIGIN}${row.action.href}" style="display:inline-block;padding:7px 14px;border-radius:8px;background:${GOLD};color:#0a0a0a;font-size:12px;font-weight:700;text-decoration:none;">${escapeHtml(row.action.verb)}</a>
      </td>
    </tr>`;
}

function section(title: string, color: string, rows: DigestRow[]): string {
  if (rows.length === 0) return '';
  return `
    <tr><td style="padding:24px 24px 8px;">
      <div style="font-size:13px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;">${title} · ${rows.length}</div>
    </td></tr>
    <tr><td style="padding:0 24px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#1a1a1a;border-radius:8px;overflow:hidden;">
        ${rows.map(rowHtml).join('')}
      </table>
    </td></tr>`;
}

export interface DeadlineDigest {
  subject: string;
  html: string;
  counts: Record<Bucket, number> & { onTrack: number; played: number };
}

/** null when there is nothing to act on — no email is better than an empty one every morning. */
export function buildDeadlineDigest(today: string, plan: DigestPlan): DeadlineDigest | null {
  const by = (b: Bucket) => plan.rows.filter((r) => r.bucket === b);
  const now = by('now');
  const week = by('week');
  const later = by('later');
  const undated = by('undated');
  if (plan.rows.length === 0) return null;

  const subject = now.length || week.length
    ? `Soleia · ${now.length} to act on now · ${week.length} this week`
    : `Soleia · ${later.length + undated.length} coming up · nothing urgent`;

  const footnotes = [
    plan.onTrack ? `${plan.onTrack} upcoming job${plan.onTrack === 1 ? ' is' : 's are'} on track and not listed.` : '',
    plan.played ? `${plan.played} job${plan.played === 1 ? '' : 's'} whose show has already played ${plan.played === 1 ? 'is' : 'are'} left out.` : '',
    'Content is due 21 business days before the show, skipping weekends and federal holidays.',
  ].filter(Boolean).map((t) => `<div style="margin-top:4px;">${t}</div>`).join('');

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0f0f0f;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
        <tr><td style="padding:32px 24px 24px;border-bottom:2px solid ${GOLD};">
          <div style="font-size:11px;color:${GOLD};text-transform:uppercase;letter-spacing:2px;font-weight:700;">Soleia Creative</div>
          <h1 style="margin:8px 0 4px;font-size:24px;color:#ffffff;font-weight:700;">Deadlines</h1>
          <div style="font-size:13px;color:#9ca3af;">${fmtLong(parseDay(today))}</div>
        </td></tr>
        ${section('Act now', RED, now)}
        ${section('This week', AMBER, week)}
        ${section('Coming up', GOLD, later)}
        ${section('No event date', '#9ca3af', undated)}
        <tr><td style="padding:24px;text-align:center;border-top:1px solid #2a2a2a;">
          <a href="${APP_ORIGIN}/admin" style="display:inline-block;padding:12px 24px;background:${GOLD};color:#0a0a0a;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Open Admin Portal</a>
        </td></tr>
        <tr><td style="padding:16px 24px;text-align:center;background:#0a0a0a;font-size:11px;color:#6b7280;">
          ${footnotes}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return {
    subject,
    html,
    counts: { now: now.length, week: week.length, later: later.length, undated: undated.length, onTrack: plan.onTrack, played: plan.played },
  };
}
