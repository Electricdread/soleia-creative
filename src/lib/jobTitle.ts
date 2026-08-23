import { supabase } from '@/integrations/supabase/client';
import { cleanClientName } from '@/lib/clientName';

/**
 * One name for a job, everywhere it appears.
 *
 * A job's title was chosen once, when its first record was saved, and never
 * looked at again — so the Jobs screen said "MRI" while the packet said
 * "CN - MRI Software" and the session said "10.19.26 MRI Software", and three
 * screens described one booking three ways. Reading across them meant knowing
 * which alias was which.
 *
 * The job does not get to invent a name. It takes the one its records already
 * use, in the order those records are raised: the packet first, because a
 * packet is raised at the start and is named for the calendar event it came
 * from, then the proposal, then the creative session. Rename the packet and
 * the job follows on the next save.
 *
 * The client is carried the same way. It used to be left alone because the
 * records genuinely disagreed — one job read `Ascend`, `CN` and `MRI` across
 * three tables — but those were settled by hand, so the same precedence now
 * keeps the client aligned too rather than letting a new one drift.
 */

export type TitleKind = 'packet' | 'proposal' | 'session';

export interface TitleCandidate {
  kind: TitleKind;
  name: string | null | undefined;
  updatedAt?: string | null;
}

/** Packet, then proposal, then session. Nothing else names a job. */
const KIND_RANK: Record<TitleKind, number> = { packet: 0, proposal: 1, session: 2 };

/**
 * The name this job should carry. Falls back to what it is called now, so a
 * job with nothing attached keeps the name a human gave it rather than being
 * blanked.
 */
export function canonicalJobTitle(candidates: TitleCandidate[], fallback: string): string {
  const usable = candidates
    .map((c) => ({ ...c, clean: (c.name ?? '').trim() }))
    .filter((c) => c.clean.length > 0);

  if (usable.length === 0) return fallback;

  usable.sort((a, b) => {
    const byKind = KIND_RANK[a.kind] - KIND_RANK[b.kind];
    if (byKind !== 0) return byKind;
    // Within one kind the newest edit wins, so a correction propagates rather
    // than being outvoted by whichever row happens to be older.
    return (Date.parse(b.updatedAt ?? '') || 0) - (Date.parse(a.updatedAt ?? '') || 0);
  });

  return usable[0].clean;
}

/**
 * Bring a job's stored title and client back in line with its records.
 *
 * Returns what the job now carries, or null when there was nothing to do. Like
 * `findOrCreateJob`, it never throws: a record that saved correctly must not be
 * reported as failed because the job's name could not be tidied.
 */
export async function syncJobIdentity(
  jobId: string | null | undefined,
): Promise<{ title: string; clientName: string } | null> {
  if (!jobId) return null;

  try {
    const [job, packets, proposals, sessions] = await Promise.all([
      supabase.from('jobs').select('id, title, client_name').eq('id', jobId).maybeSingle(),
      supabase.from('pre_call_packets').select('title, client_name, updated_at').eq('job_id', jobId),
      supabase.from('proposals').select('event_name, client_name, updated_at').eq('job_id', jobId),
      supabase.from('creative_sessions').select('project_name, client_name, updated_at').eq('job_id', jobId),
    ]);

    const current = job.data?.title;
    if (!job.data || typeof current !== 'string') return null;
    const currentClient = job.data.client_name ?? '';

    const named = <T,>(rows: T[] | null, kind: TitleKind, name: (row: T) => string | null, updated: (row: T) => string | null) =>
      (rows ?? []).map((row) => ({ kind, name: name(row), updatedAt: updated(row) }));

    const titles: TitleCandidate[] = [
      ...named(packets.data, 'packet', (p) => p.title, (p) => p.updated_at),
      ...named(proposals.data, 'proposal', (p) => p.event_name, (p) => p.updated_at),
      ...named(sessions.data, 'session', (s) => s.project_name, (s) => s.updated_at),
    ];
    const clients: TitleCandidate[] = [
      ...named(packets.data, 'packet', (p) => p.client_name, (p) => p.updated_at),
      ...named(proposals.data, 'proposal', (p) => p.client_name, (p) => p.updated_at),
      ...named(sessions.data, 'session', (s) => s.client_name, (s) => s.updated_at),
    ];

    const title = canonicalJobTitle(titles, current);
    const clientName = cleanClientName(canonicalJobTitle(clients, currentClient));

    if (title === current && clientName === currentClient) {
      return { title, clientName };
    }

    const { error } = await supabase
      .from('jobs')
      .update({ title, client_name: clientName })
      .eq('id', jobId);
    if (error) throw error;
    return { title, clientName };
  } catch (e) {
    console.error('Could not sync the job identity', e);
    return null;
  }
}
