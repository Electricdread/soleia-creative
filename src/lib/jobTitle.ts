import { supabase } from '@/integrations/supabase/client';

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
 * Bring a job's stored title back in line with its records.
 *
 * Returns the title the job now carries, or null when there was nothing to do.
 * Like `findOrCreateJob`, it never throws: a record that saved correctly must
 * not be reported as failed because the job's name could not be tidied.
 */
export async function syncJobTitle(jobId: string | null | undefined): Promise<string | null> {
  if (!jobId) return null;

  try {
    const [job, packets, proposals, sessions] = await Promise.all([
      supabase.from('jobs').select('id, title').eq('id', jobId).maybeSingle(),
      supabase.from('pre_call_packets').select('title, updated_at').eq('job_id', jobId),
      supabase.from('proposals').select('event_name, updated_at').eq('job_id', jobId),
      supabase.from('creative_sessions').select('project_name, updated_at').eq('job_id', jobId),
    ]);

    const current = job.data?.title;
    if (!job.data || typeof current !== 'string') return null;

    const candidates: TitleCandidate[] = [
      ...(packets.data ?? []).map((p) => ({ kind: 'packet' as const, name: p.title, updatedAt: p.updated_at })),
      ...(proposals.data ?? []).map((p) => ({ kind: 'proposal' as const, name: p.event_name, updatedAt: p.updated_at })),
      ...(sessions.data ?? []).map((s) => ({ kind: 'session' as const, name: s.project_name, updatedAt: s.updated_at })),
    ];

    const title = canonicalJobTitle(candidates, current);
    if (title === current) return current;

    const { error } = await supabase.from('jobs').update({ title }).eq('id', jobId);
    if (error) throw error;
    return title;
  } catch (e) {
    console.error('Could not sync the job title', e);
    return null;
  }
}
