// Hourly (pg_cron `soleia-proposal-reminders`): tells the studio when a sent proposal's 72-hour signing window is
// about to close, and when it has closed unsigned. Internal only; the client is never emailed from here. The rules
// and the email are in ../_shared/proposalReminders.ts.
//
// ?dry=1 reports what would be sent and stamps nothing. verify_jwt = true in config.toml.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { adminRecipients, jobAssigneesFor, sendEach } from "../_shared/notify.ts";
import { buildReminderEmail, reminderFor, type ReminderProposal } from "../_shared/proposalReminders.ts";

// The deploy proof: a stale build cannot report a stamp it never had. Bump it on every change.
const BUILD = 'proposal-reminders-2026-10-25a';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const dry = new URL(req.url).searchParams.get('dry') === '1';
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const now = new Date();

    const { data, error } = await supabase.from('proposals')
      .select('id, event_name, client_name, status, signed_at, is_active, sent_at, reminder_due_sent_at, reminder_lapsed_sent_at, job_id, event_date')
      .eq('status', 'sent')
      .eq('is_active', true)
      .is('signed_at', null)
      .not('sent_at', 'is', null);
    if (error) throw new Error(`proposals: ${error.message}`);
    const proposals = (data ?? []) as ReminderProposal[];

    // A postponed or cancelled job is switched off, and is never chased.
    const jobIds = [...new Set(proposals.map((p) => p.job_id).filter(Boolean))] as string[];
    const activeJobs = new Set<string>();
    if (jobIds.length) {
      const jobs = await supabase.from('jobs').select('id, is_active').in('id', jobIds);
      if (jobs.error) throw new Error(`jobs: ${jobs.error.message}`);
      for (const j of (jobs.data ?? []) as { id: string; is_active: boolean }[]) if (j.is_active) activeJobs.add(j.id);
    }

    const owed = proposals
      .map((p) => ({ p, kind: reminderFor(p, now, !p.job_id || activeJobs.has(p.job_id)) }))
      .filter((x): x is { p: ReminderProposal; kind: 'due_soon' | 'lapsed' } => x.kind !== null);

    if (dry) {
      return json({
        build: BUILD, dry: true, checked: proposals.length,
        owed: owed.map(({ p, kind }) => ({ id: p.id, event_name: p.event_name, kind })),
      });
    }

    const team = await jobAssigneesFor(owed.map(({ p }) => p.job_id));
    const results = [];
    for (const { p, kind } of owed) {
      const to = [...new Set([
        ...adminRecipients(),
        ...team.filter((t) => t.job_id === p.job_id).map((t) => t.email.trim()).filter(Boolean),
      ])];
      const email = buildReminderEmail(p, kind, now);
      const report = await sendEach({ template: `proposal-reminder-${kind}`, to, subject: email.subject, html: email.html });

      // Stamp only once it reached someone, so a failed send is retried next hour. A lapse stamps the
      // due-soon reminder too: it is no longer worth sending.
      if (report.delivered.length > 0) {
        const at = new Date().toISOString();
        const stamp = kind === 'lapsed'
          ? { reminder_lapsed_sent_at: at, reminder_due_sent_at: p.reminder_due_sent_at ?? at }
          : { reminder_due_sent_at: at };
        const { error: stampError } = await supabase.from('proposals').update(stamp).eq('id', p.id);
        if (stampError) console.error(`Could not stamp ${p.id}:`, stampError.message);
      }
      results.push({ id: p.id, kind, delivered: report.delivered, failed: report.failed });
    }

    return json({ build: BUILD, success: true, checked: proposals.length, sent: results });
  } catch (e) {
    console.error('proposal-reminders error:', e);
    return json({ build: BUILD, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
