// Tells a person they have been put on a job.
//
// The browser fires this after saving a job's assignees; the function reads the
// job and its not-yet-notified assignees server-side and emails each of them
// their own copy. notified_at stamps a row once its mail actually left, so a
// repeat save re-tries only the people a failure skipped and never re-emails
// anyone. Existing rows were backfilled as notified when the column landed.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendEach } from '../_shared/notify.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_ORIGIN = 'https://soleiacreative.app';

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) throw new Error('Supabase env not configured');

    const { job_id } = await req.json().catch(() => ({ job_id: undefined }));
    if (!job_id || typeof job_id !== 'string') return json(400, { error: 'job_id required' });

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, title, client_name, event_date')
      .eq('id', job_id)
      .maybeSingle();
    if (jobErr) throw new Error(`Job lookup failed: ${jobErr.message}`);
    if (!job) return json(404, { error: 'job not found' });

    const { data: pending, error: pendErr } = await supabase
      .from('job_assignees')
      .select('user_id, email, display_name')
      .eq('job_id', job_id)
      .is('notified_at', null)
      .order('created_at');
    if (pendErr) throw new Error(`Assignee lookup failed: ${pendErr.message}`);
    if (!pending?.length) return json(200, { skipped: 'nobody new to notify' });

    const dateStr = job.event_date
      ? new Date(job.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : null;
    const jobUrl = `${APP_ORIGIN}/admin/jobs/${job.id}`;

    const delivered: string[] = [];
    const failed: { to: string; error: string }[] = [];

    for (const person of pending) {
      const email = (person.email ?? '').trim();
      if (!email) continue;
      const firstName = ((person.display_name ?? '').trim().split(/\s+/)[0]) || null;

      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;color:#1a1d23;">
          <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#b0762a;margin:0 0 6px;">
            You're on this job
          </p>
          <h1 style="font-size:22px;margin:0 0 4px;">${esc(job.title)}</h1>
          <p style="color:#8a8f98;margin:0 0 20px;font-size:14px;">
            ${esc(job.client_name)}${dateStr ? ` &middot; ${esc(dateStr)}` : ''}
          </p>
          <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
            ${firstName ? `${esc(firstName)}, you` : 'You'} have been added to this job in Soleia Creative.
            From here on you'll be copied when its packet goes out, when the client's brief and
            assets come in, and when a proposal is signed.
          </p>
          <p style="margin:26px 0 0;">
            <a href="${jobUrl}" style="display:inline-block;background:#1a1d23;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:14px;">
              Open the job
            </a>
          </p>
        </div>`;

      const report = await sendEach({
        template: 'job-assigned',
        to: [email],
        subject: `You're on ${job.title} — ${job.client_name}`,
        html,
      });
      delivered.push(...report.delivered);
      failed.push(...report.failed);
    }

    // Stamp only the copies that actually arrived, so a failed send is retried
    // on the next assignee save rather than silently marked as handled.
    if (delivered.length > 0) {
      const { error: stampErr } = await supabase
        .from('job_assignees')
        .update({ notified_at: new Date().toISOString() })
        .eq('job_id', job_id)
        .in('email', delivered);
      if (stampErr) console.error('Failed to stamp notified_at:', stampErr.message);
    }

    return json(200, { success: delivered.length > 0, delivered, failed });
  } catch (e) {
    console.error('notify-job-assigned error:', e);
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
