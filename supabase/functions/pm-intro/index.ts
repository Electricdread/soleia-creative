// Introduces the pipeline notifications to each assigned PM, and hears back.
//
// POST sends every assigned PM one email: a short introduction, the schedule
// of their active jobs, and a Confirm button. The button is a plain GET link
// back to this function carrying a per-send token — clicked from any mail
// client, no login — which stamps pm_intro_confirmations.confirmed_at and
// shows a small thanks page. So "did they receive it" is answered by a row,
// not by asking around.
//
// verify_jwt is false because the confirm click arrives bare from an email.
// The POST side is triggered by the studio and simply re-sends intros; the
// worst an abuser could do is re-mail the team their own schedule.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendEach } from '../_shared/notify.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_ORIGIN = 'https://soleiacreative.app';
const GOLD = '#c49a3c';

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fmtDate = (iso: string | null): string =>
  iso
    ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Date TBD';

/**
 * The page the email's button opens. Confirmation itself happens only when the
 * person presses the button HERE, which sends a POST — link-scanning mail
 * gateways prefetch GET links, and a prefetch must never read as a human
 * saying "I've got this".
 */
function confirmPage(name: string | null, jobCount: number, token: string, already: boolean): string {
  const projects = jobCount === 1 ? 'project' : `${jobCount} projects`;
  const who = name ? `, ${esc(name)}` : '';
  return `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Soleia Creative</title></head>
<body style="margin:0;background:#14161A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e8e6e1;">
  <div style="max-width:520px;margin:18vh auto 0;padding:40px 32px;background:#1D2027;border:1px solid #2a2d35;border-radius:16px;text-align:center;">
    <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${GOLD};margin-bottom:14px;">Soleia Creative</div>
    ${already
      ? `<h1 style="font-size:22px;margin:0 0 10px;color:#fff;">Already confirmed — thank you${who}</h1>
         <p style="font-size:14px;line-height:1.6;color:#9ca3af;margin:0;">Pipeline notifications for your ${projects} are reaching you. You can close this tab.</p>`
      : `<h1 style="font-size:22px;margin:0 0 10px;color:#fff;">One press to confirm${who}</h1>
         <p style="font-size:14px;line-height:1.6;color:#9ca3af;margin:0 0 24px;">This tells the studio the pipeline emails for your ${projects} are reaching your inbox.</p>
         <button id="go" style="background:${GOLD};color:#14161A;border:0;border-radius:8px;padding:13px 30px;font-size:15px;font-weight:700;cursor:pointer;">Confirm — I've got this</button>
         <p id="done" style="display:none;font-size:14px;line-height:1.6;color:#9ca3af;margin:24px 0 0;">Confirmed — thank you. You can close this tab.</p>
         <script>
           document.getElementById('go').addEventListener('click', async () => {
             const btn = document.getElementById('go');
             btn.disabled = true; btn.textContent = 'Confirming…';
             try {
               const res = await fetch(location.pathname, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ confirm: ${JSON.stringify(token)} }),
               });
               if (!res.ok) throw new Error('bad status');
               btn.style.display = 'none';
               document.getElementById('done').style.display = 'block';
             } catch {
               btn.disabled = false; btn.textContent = 'Try again';
             }
           });
         </script>`}
  </div>
</body></html>`;
}

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
    const supabase = createClient(supabaseUrl, serviceKey);

    // ── The email's link: render the confirm page (a GET never confirms) ─────
    if (req.method === 'GET') {
      const token = new URL(req.url).searchParams.get('confirm');
      if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
        return new Response('Not found', { status: 404, headers: corsHeaders });
      }
      const { data: row } = await supabase
        .from('pm_intro_confirmations')
        .select('token, display_name, job_count, confirmed_at')
        .eq('token', token)
        .maybeSingle();
      if (!row) return new Response('Not found', { status: 404, headers: corsHeaders });

      const first = (row.display_name ?? '').trim().split(/\s+/)[0] || null;
      return new Response(confirmPage(first, row.job_count, token, !!row.confirmed_at), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // ── The button's press: the POST that actually confirms ──────────────────
    const body = await req.clone().json().catch(() => ({}));
    if (typeof body?.confirm === 'string') {
      if (!/^[0-9a-f-]{36}$/i.test(body.confirm)) return json(404, { error: 'not found' });
      const { data: row } = await supabase
        .from('pm_intro_confirmations')
        .select('token, confirmed_at')
        .eq('token', body.confirm)
        .maybeSingle();
      if (!row) return json(404, { error: 'not found' });
      if (!row.confirmed_at) {
        await supabase
          .from('pm_intro_confirmations')
          .update({ confirmed_at: new Date().toISOString() })
          .eq('token', body.confirm);
      }
      return json(200, { confirmed: true });
    }

    // ── The send: one intro per assigned PM, and only on an explicit ask ─────
    if (body?.send !== true) return json(400, { error: 'pass {"send":true} to send the intros' });

    // Optional cc, so the studio can watch a send arrive in its own inbox.
    const cc = Array.isArray(body?.cc)
      ? (body.cc as unknown[]).filter((c): c is string => typeof c === 'string' && c.includes('@'))
      : [];

    const [jobsRes, assigneesRes] = await Promise.all([
      supabase.from('jobs').select('id, title, client_name, event_date').eq('is_active', true),
      supabase.from('job_assignees').select('job_id, email, display_name'),
    ]);
    if (jobsRes.error) throw new Error(`jobs: ${jobsRes.error.message}`);
    if (assigneesRes.error) throw new Error(`job_assignees: ${assigneesRes.error.message}`);

    const jobById = new Map((jobsRes.data ?? []).map((j) => [j.id, j]));

    interface PmEntry { email: string; name: string | null; jobs: { title: string; client: string; date: string | null }[] }
    const byEmail = new Map<string, PmEntry>();
    for (const a of assigneesRes.data ?? []) {
      const email = (a.email ?? '').trim();
      const job = jobById.get(a.job_id);
      if (!email || !job) continue;
      const key = email.toLowerCase();
      const entry = byEmail.get(key) ?? { email, name: (a.display_name ?? '').trim() || null, jobs: [] };
      entry.jobs.push({ title: job.title, client: job.client_name, date: job.event_date ?? null });
      byEmail.set(key, entry);
    }

    const sent: string[] = [];
    const failed: { to: string; error: string }[] = [];

    for (const entry of byEmail.values()) {
      // Soonest show first; a job with no date sits at the bottom, never the top.
      entry.jobs.sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));

      // A resend reuses the person's outstanding token instead of minting a
      // second one, so the table stays one row per PM and a confirmation from
      // either copy of the email counts. A token already confirmed is left
      // alone — a fresh one would ask someone to confirm twice.
      const { data: open } = await supabase
        .from('pm_intro_confirmations')
        .select('token')
        .eq('email', entry.email)
        .is('confirmed_at', null)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let token = open?.token as string | undefined;
      if (token) {
        await supabase
          .from('pm_intro_confirmations')
          .update({
            display_name: entry.name,
            job_count: entry.jobs.length,
            sent_at: new Date().toISOString(),
          })
          .eq('token', token);
      } else {
        const { data: row, error: insErr } = await supabase
          .from('pm_intro_confirmations')
          .insert({ email: entry.email, display_name: entry.name, job_count: entry.jobs.length })
          .select('token')
          .single();
        if (insErr || !row) {
          failed.push({ to: entry.email, error: insErr?.message ?? 'could not create confirmation token' });
          continue;
        }
        token = row.token as string;
      }

      const confirmUrl = `${supabaseUrl}/functions/v1/pm-intro?confirm=${token}`;
      const first = (entry.name ?? '').trim().split(/\s+/)[0] || null;
      const rows = entry.jobs.map((j) => `
        <tr>
          <td style="padding:10px 16px 10px 0;color:#8a8f98;font-size:13px;white-space:nowrap;vertical-align:top;">${esc(fmtDate(j.date))}</td>
          <td style="padding:10px 0;vertical-align:top;">
            <div style="color:#1a1d23;font-size:14px;font-weight:600;">${esc(j.title)}</div>
            <div style="color:#8a8f98;font-size:13px;">${esc(j.client)}</div>
          </td>
        </tr>`).join('');

      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;color:#1a1d23;">
          <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#b0762a;margin:0 0 6px;">
            Soleia Creative &middot; pipeline notifications
          </p>
          <h1 style="font-size:22px;margin:0 0 12px;">${first ? `${esc(first)}, your` : 'Your'} projects now come to you</h1>
          <p style="font-size:14px;line-height:1.6;margin:0 0 18px;">
            Soleia Creative emails you directly as your assigned projects move —
            when a packet goes live, when client files and briefs land, when a
            proposal is signed, and a daily deadlines digest for what's coming up.
            Here is what's currently on your plate:
          </p>
          <table style="border-collapse:collapse;width:100%;font-size:14px;border-top:1px solid #ecf0f1;">${rows}</table>
          <p style="margin:26px 0 8px;">
            <a href="${confirmUrl}" style="display:inline-block;background:#1a1d23;color:#fff;padding:12px 26px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
              Confirm — I've got this
            </a>
          </p>
          <p style="color:#8a8f98;font-size:13px;line-height:1.5;margin:0 0 20px;">
            One click, just so we know these are reaching your inbox.
          </p>
          <p style="margin:0;">
            <a href="${APP_ORIGIN}/admin/jobs" style="color:#8a8f98;font-size:13px;">Open the jobs board</a>
          </p>
        </div>`;

      const report = await sendEach({
        template: 'pm-intro',
        to: [entry.email],
        cc,
        subject: `Your Soleia projects — ${entry.jobs.length} on your plate, please confirm`,
        html,
      });
      sent.push(...report.delivered);
      failed.push(...report.failed);
    }

    return json(200, { success: failed.length === 0 && sent.length > 0, sent, failed });
  } catch (e) {
    console.error('pm-intro error:', e);
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
