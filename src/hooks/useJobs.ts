import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  JobRecord, JobWithMembers, AttachedProposal, AttachedPacket, AttachedSession,
} from '@/lib/jobStage';

/**
 * Loads jobs with everything attached to them.
 *
 * One place, so the list and the detail page can never disagree about which
 * records belong to a job or how many assets have arrived.
 */
export function useJobs(jobId?: string) {
  const [jobs, setJobs] = useState<JobWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      let jobQuery = supabase.from('jobs').select('*').order('event_date', { nullsFirst: false });
      if (jobId) jobQuery = supabase.from('jobs').select('*').eq('id', jobId);

      const [jobRows, proposals, packets, sessions, assets, packageItems, assocs, meetings] = await Promise.all([
        jobQuery,
        supabase.from('proposals')
          .select('id, token, event_name, status, signed_at, is_active, signoff_due_on, drive_folder_id, job_id')
          .not('job_id', 'is', null),
        supabase.from('pre_call_packets')
          .select('id, token, title, kind, is_active, drive_folder_id, job_id')
          .not('job_id', 'is', null),
        supabase.from('creative_sessions')
          .select('id, token, project_name, is_active, job_id')
          .not('job_id', 'is', null),
        // Files the watcher has marked gone are not assets any more.
        supabase.from('drive_seen_files').select('drive_folder_id').is('missing_since', null),
        supabase.from('proposal_items')
          .select('proposal_id, category, title')
          .eq('client_selected', true),
        // A job's scheduled e-meetings, reached through its records' calendar
        // events — whether a creative call is even part of this job's timeline.
        supabase.from('calendar_event_associations').select('event_uid, entity_id'),
        supabase.from('calendar_event_meeting_links').select('event_uid'),
      ]);

      if (jobRows.error) throw jobRows.error;

      // Assets are counted by folder, because that is what the watcher records
      // and what "brand assets are in" actually means.
      const filesByFolder = new Map<string, number>();
      (assets.data ?? []).forEach((f) => {
        if (!f.drive_folder_id) return;
        filesByFolder.set(f.drive_folder_id, (filesByFolder.get(f.drive_folder_id) ?? 0) + 1);
      });

      const packageProposals = new Set(
        (packageItems.data ?? [])
          .filter((i) =>
            i.category === 'Soleia Creative Package' ||
            (i.title ?? '').toLowerCase().includes('creative package'))
          .map((i) => i.proposal_id),
      );

      const meetingsByEvent = new Map<string, number>();
      (meetings.data ?? []).forEach((m) => {
        meetingsByEvent.set(m.event_uid, (meetingsByEvent.get(m.event_uid) ?? 0) + 1);
      });
      const eventsByEntity = new Map<string, string[]>();
      (assocs.data ?? []).forEach((a) => {
        const held = eventsByEntity.get(a.entity_id) ?? [];
        held.push(a.event_uid);
        eventsByEntity.set(a.entity_id, held);
      });

      const built = (jobRows.data ?? []).map((row): JobWithMembers => {
        const job = row as unknown as JobRecord;
        const jobProposals = (proposals.data ?? []).filter((p) => p.job_id === job.id) as unknown as AttachedProposal[];
        const jobPackets = (packets.data ?? []).filter((p) => p.job_id === job.id) as unknown as AttachedPacket[];
        const jobSessions = (sessions.data ?? []).filter((s) => s.job_id === job.id) as unknown as AttachedSession[];

        const folders = new Set(
          [job.drive_folder_id,
           ...jobProposals.map((p) => p.drive_folder_id),
           ...jobPackets.map((p) => p.drive_folder_id)].filter(Boolean) as string[],
        );
        let assetCount = 0;
        folders.forEach((f) => { assetCount += filesByFolder.get(f) ?? 0; });

        const eventUids = new Set<string>();
        [...jobProposals, ...jobPackets, ...jobSessions].forEach((r) => {
          (eventsByEntity.get(r.id) ?? []).forEach((uid) => eventUids.add(uid));
        });
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

      setJobs(built);
    } catch (e) {
      console.error('useJobs load failed', e);
      setError(e instanceof Error ? e.message : 'Could not load jobs');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { void load(); }, [load]);

  return { jobs, loading, error, reload: load };
}
