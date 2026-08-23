import { supabase } from '@/integrations/supabase/client';

/**
 * Attaching a new record to the job it belongs to.
 *
 * The 24 jobs that exist were inferred once, in a backfill. Nothing since then
 * created one, so a packet or a proposal raised today would have landed with
 * `job_id` null — outside the spine, off the Jobs screen, unassignable. This is
 * what keeps that from happening.
 *
 * The matching is the same shape as the backfill's: two records are the same
 * job when they share a name that distinguishes them and do not contradict on
 * date. That is what pulls a new proposal onto the packet's job even when
 * somebody types "MRI" where the packet said "Ascend".
 */

const STOPWORDS = new Set([
  'the', 'and', 'event', 'events', 'soleia', 'las', 'vegas', 'llc', 'inc',
  'creative', 'package', 'pre', 'post', 'call', 'packet', 'digital', 'branding',
]);

/** Lowercase, punctuation to spaces, leading zeros dropped: 09.23.26 == 9.23.26. */
export const normalise = (value: string): string =>
  value.toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b0+(\d)/g, '$1')
    .trim()
    .replace(/\s+/g, ' ');

/** Words that tell one job from another. Dates and categories do not. */
function tokens(...values: (string | null | undefined)[]): Set<string> {
  const out = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    for (const token of normalise(value).split(' ')) {
      if (token.length < 3) continue;
      if (/^\d+$/.test(token)) continue;
      if (STOPWORDS.has(token)) continue;
      out.add(token);
    }
  }
  return out;
}

/** Dates cannot contradict. An unknown date is not a contradiction. */
const datesCompatible = (a: string | null, b: string | null) => !a || !b || a === b;

export interface JobIdentity {
  clientName: string;
  /** Event name, packet title or project name — whichever this record calls it. */
  eventName: string;
  eventDate: string | null;
}

/**
 * The job this record belongs to, creating one if it is the first of its kind.
 *
 * Returns null only if the job could not be written, in which case the caller
 * should still save its own record — a record with no job is recoverable, a
 * lost packet is not.
 */
export async function findOrCreateJob(identity: JobIdentity): Promise<string | null> {
  const { clientName, eventName, eventDate } = identity;
  const mine = tokens(clientName, eventName);
  if (mine.size === 0) return null;

  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, client_name, event_date');
    if (error) throw error;

    const match = (jobs ?? []).find((j) => {
      if (!datesCompatible(eventDate, j.event_date)) return false;
      const theirs = tokens(j.title, j.client_name);
      for (const t of mine) if (theirs.has(t)) return true;
      return false;
    });
    if (match) return match.id;

    // The job takes the name of the record raising it — the packet title, the
    // proposal's event name — so the Jobs screen reads the same as the screen
    // the work was started on. `syncJobTitle` keeps it that way afterwards.
    const title = [eventName, clientName]
      .map((n) => (n ?? '').trim())
      .find((n) => n.length > 0) ?? eventName ?? clientName;

    const { data: created, error: createErr } = await supabase
      .from('jobs')
      .insert({ title, client_name: clientName, event_date: eventDate })
      .select('id')
      .single();
    if (createErr) throw createErr;
    return created?.id ?? null;
  } catch (e) {
    // Never block the save. A record without a job shows up on the Jobs screen
    // as needing one; a packet that failed to save is gone.
    console.error('Could not attach this record to a job', e);
    return null;
  }
}
