// The morning deadline digest: every upcoming job that is waiting on something, with its content deadline.
// The rules and the email are in ../_shared/deadlineDigest.ts. pg_cron `soleia-deadline-digest` runs it daily.
//
// ?dry=1 sends nothing and reports the subject and counts. It does not return the email itself: this function
// is declared verify_jwt = false, and the email names clients.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { adminRecipients, jobAssigneesFor, mutedFor, sendEach } from "../_shared/notify.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { buildDeadlineDigest, planDigest, rollupJobs, type RollupInput, type SeenFile } from "../_shared/deadlineDigest.ts";
import type { JobRecord, JobWithMembers } from "../_shared/jobStage.ts";

// The deploy proof, as in studio-sync: a stale build cannot report a stamp it never had. Bump it on every change.
const BUILD = 'send-deadline-digest-2026-10-27a';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

/** Today on the Strip, not in UTC: at 14:00 UTC the two agree, but the digest should not depend on that. */
function lasVegasToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

const serviceClient = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
type Client = ReturnType<typeof serviceClient>;
type FileRow = SeenFile & { drive_folder_id: string | null };

/** drive_seen_files outgrows one PostgREST page; a short read would invent "nothing from the client yet". */
async function readSeenFiles(supabase: Client): Promise<FileRow[]> {
  const PAGE = 1000;
  const rows: FileRow[] = [];
  for (let from = 0; from < 40 * PAGE; from += PAGE) {
    const { data, error } = await supabase.from('drive_seen_files')
      .select('drive_folder_id, file_name, parent_folder_name, final_slot')
      .is('missing_since', null)
      .order('id')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`drive_seen_files: ${error.message}`);
    rows.push(...((data ?? []) as FileRow[]));
    if (!data || data.length < PAGE) return rows;
  }
  throw new Error('drive_seen_files: more than 40,000 rows; refusing to report a partial count');
}

/**
 * Active jobs with their records: the same queries as src/hooks/useJobs.ts, put together by rollupJobs.
 */
async function loadJobs(supabase: Client): Promise<JobWithMembers[]> {
  const [jobRows, proposals, packets, sessions, packageItems, assocs, meetings] = await Promise.all([
    supabase.from('jobs').select('*').eq('is_active', true),
    supabase.from('proposals')
      .select('id, token, event_name, status, signed_at, is_active, signoff_due_on, drive_folder_id, job_id')
      .not('job_id', 'is', null),
    supabase.from('pre_call_packets')
      .select('id, token, title, kind, is_active, drive_folder_id, job_id')
      .not('job_id', 'is', null),
    supabase.from('creative_sessions')
      .select('id, token, project_name, is_active, job_id')
      .not('job_id', 'is', null),
    supabase.from('proposal_items').select('proposal_id, category, title').eq('client_selected', true),
    supabase.from('calendar_event_associations').select('event_uid, entity_id'),
    supabase.from('calendar_event_meeting_links').select('event_uid'),
  ]);
  for (const [name, r] of [
    ['jobs', jobRows], ['proposals', proposals], ['pre_call_packets', packets], ['creative_sessions', sessions],
    ['proposal_items', packageItems], ['calendar_event_associations', assocs], ['calendar_event_meeting_links', meetings],
  ] as const) {
    if (r.error) throw new Error(`${name}: ${r.error.message}`);
  }

  return rollupJobs({
    jobs: (jobRows.data ?? []) as unknown as JobRecord[],
    proposals: (proposals.data ?? []) as unknown as RollupInput['proposals'],
    packets: (packets.data ?? []) as unknown as RollupInput['packets'],
    sessions: (sessions.data ?? []) as unknown as RollupInput['sessions'],
    packageItems: (packageItems.data ?? []) as unknown as RollupInput['packageItems'],
    assocs: (assocs.data ?? []) as unknown as RollupInput['assocs'],
    meetings: (meetings.data ?? []) as unknown as RollupInput['meetings'],
    files: await readSeenFiles(supabase),
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const dry = new URL(req.url).searchParams.get('dry') === '1';
    if (!dry && !Deno.env.get('RESEND_API_KEY')) throw new Error('RESEND_API_KEY not configured');

    const supabase = serviceClient();
    const today = lasVegasToday();
    const plan = planDigest({ today, jobs: await loadJobs(supabase) });
    const full = buildDeadlineDigest(today, plan);

    // Each assigned PM gets the same email holding only their own jobs' rows; a PM with nothing waiting gets none.
    // Nor anyone who asked not to get it (notification_mutes); the studio inbox itself is never muted.
    const adminSet = new Set(adminRecipients().map((a) => a.toLowerCase()));
    const [team, muted] = await Promise.all([jobAssigneesFor(plan.rows.map((r) => r.jobId)), mutedFor('deadline-digest')]);
    const jobsByAssignee = new Map<string, Set<string>>();
    for (const member of team) {
      if (adminSet.has(member.email.toLowerCase()) || muted.has(member.email.toLowerCase())) continue;
      jobsByAssignee.set(member.email, (jobsByAssignee.get(member.email) ?? new Set()).add(member.job_id));
    }

    if (dry) {
      return json({
        build: BUILD, dry: true, today, subject: full?.subject ?? null, counts: full?.counts ?? null,
        admin_recipients: adminRecipients().length, pm_copies: jobsByAssignee.size, muted: muted.size,
      });
    }
    if (!full) return json({ build: BUILD, success: true, today, skipped: 'nothing waiting' });

    const adminReport = await sendEach({ template: 'deadline-digest', to: adminRecipients(), subject: full.subject, html: full.html });

    const teamDelivered: string[] = [];
    const teamFailed: { to: string; error: string }[] = [];
    for (const [email, jobIds] of jobsByAssignee) {
      // The board-wide footnotes ("9 on track") would be about other people's jobs.
      const own = buildDeadlineDigest(today, { rows: plan.rows.filter((r) => jobIds.has(r.jobId)), onTrack: 0, played: 0 });
      if (!own) continue;
      const copy = await sendEach({ template: 'deadline-digest', to: [email], subject: own.subject, html: own.html });
      teamDelivered.push(...copy.delivered);
      teamFailed.push(...copy.failed);
    }
    if (teamFailed.length) console.error('PM digest copies failed:', JSON.stringify(teamFailed));

    return json({
      build: BUILD,
      success: adminReport.delivered.length > 0,
      today,
      delivered: adminReport.delivered,
      failed: adminReport.failed,
      team_delivered: teamDelivered,
      team_failed: teamFailed,
      counts: full.counts,
    });
  } catch (e) {
    console.error('send-deadline-digest error:', e);
    return json({ build: BUILD, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
