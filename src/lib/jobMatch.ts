import { supabase } from '@/integrations/supabase/client';
import { cleanClientName } from '@/lib/clientName';

/**
 * Attaching a new record to the job it belongs to.
 *
 * The 24 jobs that exist were inferred once, in a backfill. Nothing since then
 * created one, so a packet or a proposal raised today would have landed with
 * `job_id` null — outside the spine, off the Jobs screen, unassignable. This is
 * what keeps that from happening.
 *
 * Attaching to the wrong job is worse than attaching to none or starting a new
 * one: `syncJobIdentity` then renames the wrong job, and its Drive folder, after
 * the new record. On 2026-11-11 a session named "11.19.26 F1 Las Vegas Grand
 * Prix – Caesars" landed on "07.04.26 4th of July" (client CAESARS
 * Entertainment) because the old rule took the first job sharing any one word —
 * "caesars" — whenever the record carried no date. So a match now has to be
 * earned, strongest first:
 *
 * - `exact`  — the same title, once dates and punctuation are set aside;
 * - `dated`  — both sides have a date, it is the same day, and they share at
 *              least one distinctive word (the "MRI" proposal finding the
 *              "CN - MRI Software" packet's job);
 * - `tokens` — no date on one side, but at least two distinctive words in
 *              common covering half of the shorter name, and the job is active.
 *
 * A date is read from the record's field, or from the "MM.DD.YY" prefix of its
 * name when the field is empty, and the same for the job. Two known dates that
 * differ are never the same job. Venue and brand words that many bookings share
 * — Caesars, Las Vegas, Soleia — do not count as distinctive.
 *
 * A `tokens` match attaches the record but is not trusted to rename the job:
 * see `shouldSyncJobIdentity`.
 */

const STOPWORDS = new Set([
  // Glue.
  'the', 'and', 'for', 'with', 'llc', 'inc', 'corp', 'company', 'group', 'presents',
  // Us, and the venue every booking shares.
  'soleia', 'las', 'vegas', 'caesars', 'entertainment', 'palace', 'forum', 'shops',
  'hotel', 'resort', 'casino',
  // What kind of record or event it is, rather than which one.
  'event', 'events', 'creative', 'session', 'package', 'pre', 'post', 'call', 'packet',
  'digital', 'branding', 'proposal', 'quote', 'show', 'party', 'night', 'annual',
  'conference', 'summit', 'meeting', 'dinner', 'reception', 'gala',
]);

/** Lowercase, punctuation to spaces, leading zeros dropped: 09.23.26 == 9.23.26. */
export const normalise = (value: string): string =>
  value.toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b0+(\d)/g, '$1')
    .trim()
    .replace(/\s+/g, ' ');

/** "11.19.26 …", "11/19/2026 …", "11-19-26 …" at the start of a name. */
const DATE_PREFIX = /^\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4}|\d{2})(?!\d)\s*[-–—:|]?\s*/;

/** The ISO day a name's "MM.DD.YY" prefix names, or null. */
export function dateFromName(value: string | null | undefined): string | null {
  const m = (value ?? '').match(DATE_PREFIX);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** The name with any "MM.DD.YY" prefix taken off. */
const withoutDate = (value: string | null | undefined) => (value ?? '').replace(DATE_PREFIX, '');

/** A title as compared for an exact match: no date prefix, no punctuation, no case. */
const titleKey = (value: string | null | undefined) => normalise(withoutDate(value));

/** Only the day: a timestamp and a date column name the same day the same way. */
const day = (value: string | null | undefined) => (value ? value.slice(0, 10) : null);

/** Words that tell one job from another. Dates, numbers and categories do not. */
export function distinctiveTokens(...values: (string | null | undefined)[]): Set<string> {
  const out = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    for (const token of normalise(withoutDate(value)).split(' ')) {
      if (!token || /^\d+$/.test(token)) continue;
      // "f1" and "4th" are short but distinctive; "of", "x" and "ny" are not.
      const short = token.length < 3;
      if (short && !(/\d/.test(token) && /[a-z]/.test(token))) continue;
      if (STOPWORDS.has(token)) continue;
      out.add(token);
    }
  }
  return out;
}

export interface JobIdentity {
  clientName: string;
  /** Event name, packet title or project name — whichever this record calls it. */
  eventName: string;
  eventDate: string | null;
}

export interface JobCandidate {
  id: string;
  title: string | null;
  client_name: string | null;
  event_date: string | null;
  is_active?: boolean | null;
}

export type MatchStrength = 'exact' | 'dated' | 'tokens';
export type AttachHow = MatchStrength | 'created';

export interface JobAttachment {
  jobId: string;
  how: AttachHow;
}

const RANK: Record<MatchStrength, number> = { exact: 3, dated: 2, tokens: 1 };

/** The record's date: its own field, else its name's prefix. */
export const identityDate = (identity: JobIdentity): string | null =>
  day(identity.eventDate) ?? dateFromName(identity.eventName);

/** How strongly one job matches this record, or null when it does not. */
export function matchStrength(identity: JobIdentity, job: JobCandidate): { strength: MatchStrength; shared: number } | null {
  const mineDate = identityDate(identity);
  const theirDate = day(job.event_date) ?? dateFromName(job.title);
  // Two known dates that differ are two jobs, whatever the names say.
  if (mineDate && theirDate && mineDate !== theirDate) return null;

  const mineKey = titleKey(identity.eventName);
  if (mineKey && mineKey === titleKey(job.title)) return { strength: 'exact', shared: Infinity };

  const mine = distinctiveTokens(identity.clientName, identity.eventName);
  const theirs = distinctiveTokens(job.title, job.client_name);
  let shared = 0;
  for (const t of mine) if (theirs.has(t)) shared += 1;
  if (shared === 0) return null;

  if (mineDate && theirDate) return { strength: 'dated', shared };

  const shorter = Math.min(mine.size, theirs.size);
  if (shared >= 2 && shared * 2 >= shorter && job.is_active !== false) {
    return { strength: 'tokens', shared };
  }
  return null;
}

/**
 * The job this record belongs to among `jobs`, or null to start a new one.
 *
 * Strongest match first, then an active job over a closed one, then the most
 * words in common. Two equally good `tokens` matches are a guess, not a match,
 * so they start a new job instead.
 */
export function pickJob(identity: JobIdentity, jobs: JobCandidate[]): { job: JobCandidate; strength: MatchStrength } | null {
  const scored = jobs
    .map((job) => ({ job, m: matchStrength(identity, job) }))
    .filter((s): s is { job: JobCandidate; m: { strength: MatchStrength; shared: number } } => s.m !== null)
    .sort((a, b) =>
      RANK[b.m.strength] - RANK[a.m.strength]
      || Number(b.job.is_active !== false) - Number(a.job.is_active !== false)
      || b.m.shared - a.m.shared
      || (a.job.id < b.job.id ? -1 : a.job.id > b.job.id ? 1 : 0));

  const [best, next] = scored;
  if (!best) return null;
  if (best.m.strength === 'tokens' && next
      && next.m.strength === 'tokens'
      && next.m.shared === best.m.shared
      && (next.job.is_active !== false) === (best.job.is_active !== false)) {
    return null;
  }
  return { job: best.job, strength: best.m.strength };
}

/**
 * Whether the record that was just attached may rename its job.
 *
 * `syncJobIdentity` renames the job and its Drive folder from its records, so
 * it runs only where the match is certain — a job just created, an exact title
 * or a same-day match. A `tokens` match attaches the record and leaves the
 * job's name to whoever looks at it next.
 */
export const shouldSyncJobIdentity = (attachment: JobAttachment | null): attachment is JobAttachment =>
  !!attachment && attachment.how !== 'tokens';

/**
 * The job this record belongs to, creating one if it is the first of its kind.
 *
 * Returns null only if the job could not be read or written, in which case the
 * caller should still save its own record — a record with no job is
 * recoverable, a lost packet is not.
 */
export async function findOrCreateJob(identity: JobIdentity): Promise<JobAttachment | null> {
  const { clientName, eventName } = identity;
  if (!(clientName ?? '').trim() && !(eventName ?? '').trim()) return null;

  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, client_name, event_date, is_active');
    if (error) throw error;

    const picked = pickJob(identity, jobs ?? []);
    if (picked) return { jobId: picked.job.id, how: picked.strength };

    // The job takes the name of the record raising it — the packet title, the
    // proposal's event name — so the Jobs screen reads the same as the screen
    // the work was started on. `syncJobIdentity` keeps it that way afterwards.
    const title = [eventName, clientName]
      .map((n) => (n ?? '').trim())
      .find((n) => n.length > 0) ?? eventName ?? clientName;

    const { data: created, error: createErr } = await supabase
      .from('jobs')
      .insert({ title, client_name: cleanClientName(clientName), event_date: identityDate(identity) })
      .select('id')
      .single();
    if (createErr) throw createErr;
    return created?.id ? { jobId: created.id, how: 'created' } : null;
  } catch (e) {
    // Never block the save. A record without a job shows up on the Jobs screen
    // as needing one; a packet that failed to save is gone.
    console.error('Could not attach this record to a job', e);
    return null;
  }
}
