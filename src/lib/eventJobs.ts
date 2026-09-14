import { supabase } from '@/integrations/supabase/client';

export interface EventJob { id: string; title: string }

export interface EventLinks {
  /** The jobs each booking belongs to. */
  jobs: Map<string, EventJob[]>;
  /** Bookings with a packet on them that is deployed (`is_active`, which Soleia's admin labels "Deployed"). */
  deployedPacket: Set<string>;
}

const VIA_RECORD = ['proposal', 'packet', 'creative_session'] as const;

/**
 * What each booking is linked to, reached the way the jobs list reaches it:
 * through what is linked to the event -- the job itself, or its proposal, packet
 * or creative session. Pass one event's uid to look up just that booking.
 */
export async function loadEventLinks(eventUid?: string): Promise<EventLinks> {
  let query = supabase.from('calendar_event_associations').select('event_uid, entity_type, entity_id');
  if (eventUid) query = query.eq('event_uid', eventUid);
  const { data: assocs } = await query;
  const links = assocs ?? [];
  const idsOf = (type: string) => [...new Set(links.filter((a) => a.entity_type === type).map((a) => a.entity_id))];

  const [proposals, packets, sessions] = await Promise.all([
    idsOf('proposal').length ? supabase.from('proposals').select('id, job_id').in('id', idsOf('proposal')) : null,
    idsOf('packet').length ? supabase.from('pre_call_packets').select('id, job_id, is_active').in('id', idsOf('packet')) : null,
    idsOf('creative_session').length ? supabase.from('creative_sessions').select('id, job_id').in('id', idsOf('creative_session')) : null,
  ]);
  const jobOfRecord = new Map<string, string>();
  for (const rows of [proposals?.data, packets?.data, sessions?.data]) {
    ((rows ?? []) as { id: string; job_id: string | null }[]).forEach((row) => {
      if (row.job_id) jobOfRecord.set(row.id, row.job_id);
    });
  }
  const deployedPackets = new Set(
    ((packets?.data ?? []) as { id: string; is_active: boolean | null }[]).filter((p) => p.is_active).map((p) => p.id),
  );

  const jobIdsByEvent = new Map<string, Set<string>>();
  const deployedPacket = new Set<string>();
  for (const link of links) {
    if (link.entity_type === 'packet' && deployedPackets.has(link.entity_id)) deployedPacket.add(link.event_uid);
    const jobId = link.entity_type === 'job' ? link.entity_id
      : (VIA_RECORD as readonly string[]).includes(link.entity_type) ? jobOfRecord.get(link.entity_id)
        : undefined;
    if (!jobId) continue;
    const held = jobIdsByEvent.get(link.event_uid) ?? new Set<string>();
    held.add(jobId);
    jobIdsByEvent.set(link.event_uid, held);
  }

  const allJobIds = [...new Set([...jobIdsByEvent.values()].flatMap((ids) => [...ids]))];
  const titles = new Map<string, string>();
  if (allJobIds.length) {
    const { data } = await supabase.from('jobs').select('id, title').in('id', allJobIds);
    (data ?? []).forEach((job) => titles.set(job.id, job.title));
  }

  const jobs = new Map<string, EventJob[]>();
  jobIdsByEvent.forEach((ids, uid) => {
    jobs.set(uid, [...ids].filter((id) => titles.has(id)).map((id) => ({ id, title: titles.get(id)! })));
  });
  return { jobs, deployedPacket };
}

/** The jobs each booking belongs to. */
export async function loadJobsByEvent(eventUid?: string): Promise<Map<string, EventJob[]>> {
  return (await loadEventLinks(eventUid)).jobs;
}
