// Emails the studio when a client submits their creative brief.
//
// The brief is the input the content is designed from, so its arrival is the
// point the work can start. Everything shown here is read server-side from the
// session token — a public page is not trusted to supply the contents of an
// email that goes to the studio.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { adminRecipients, sendEach, usingSandboxSender } from '../_shared/notify.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_ORIGIN = 'https://soleiacreative.app';

const ELEVATOR_LABEL: Record<string, string> = {
  messages: 'Greet guests — ride up / ride down messages',
  branding_loop: 'Branding loop',
  undecided: 'Undecided — bring a recommendation',
};

const PARTY_LABEL: Record<string, string> = {
  yes: 'Yes — turns over to a party',
  no: 'No — one tone throughout',
  unsure: 'Not sure yet',
};

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** One answer, or a visibly empty row — a blank is information too. */
function row(label: string, value: string | null): string {
  const filled = String(value ?? '').trim().length > 0;
  return `
    <tr>
      <td style="color:#8a8f98;padding:8px 16px 8px 0;vertical-align:top;white-space:nowrap;">${esc(label)}</td>
      <td style="padding:8px 0;vertical-align:top;color:${filled ? '#1a1d23' : '#b0b4bb'};">
        ${filled ? esc(value).replace(/\n/g, '<br>') : '<em>not answered</em>'}
      </td>
    </tr>`;
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

    const { token } = await req.json().catch(() => ({ token: undefined }));
    if (!token || typeof token !== 'string') return json(400, { error: 'token required' });

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: session, error: sessionErr } = await supabase
      .from('creative_sessions')
      .select('id, token, project_name, client_name, event_date, job_id')
      .eq('token', token)
      .maybeSingle();
    if (sessionErr) throw new Error(`Session lookup failed: ${sessionErr.message}`);
    if (!session) return json(404, { error: 'session not found' });

    const { data: brief, error: briefErr } = await supabase
      .from('creative_briefs')
      .select('*')
      .eq('creative_session_id', session.id)
      .maybeSingle();
    if (briefErr) throw new Error(`Brief lookup failed: ${briefErr.message}`);
    if (!brief) return json(404, { error: 'no brief for this session' });

    // Only a submitted brief is news.
    if (!brief.submitted_at) return json(200, { skipped: 'brief not submitted' });

    // The browser calls this, so a refresh or a double-click would call it
    // twice. One notification per submission.
    if (brief.notified_at) {
      return json(200, { skipped: 'already notified', notified_at: brief.notified_at });
    }

    // Everyone assigned to the job, not one PM on one proposal. job_assignees
    // carries a snapshot of the address, so this still works if a profile was
    // renamed or removed after the assignment.
    const teamEmails: string[] = [];
    const teamNames: string[] = [];
    if (session.job_id) {
      const { data: team } = await supabase
        .from('job_assignees')
        .select('email, display_name')
        .eq('job_id', session.job_id)
        .order('created_at');
      for (const member of team ?? []) {
        const email = (member.email ?? '').trim();
        if (email && !teamEmails.includes(email)) {
          teamEmails.push(email);
          teamNames.push((member.display_name ?? '').trim() || email);
        }
      }
    }

    const recipients = Array.from(new Set([...adminRecipients(), ...teamEmails]));

    const answered = [
      brief.mood, brief.vibe, brief.color_scheme, brief.avoid,
      brief.elevator_mode, brief.transforms_to_party,
      brief.looks_count ? String(brief.looks_count) : null,
    ].filter((v) => String(v ?? '').trim().length > 0).length;

    const sessionUrl = `${APP_ORIGIN}/creative/${session.token}`;
    const adminUrl = session.job_id
      ? `${APP_ORIGIN}/admin/jobs/${session.job_id}`
      : `${APP_ORIGIN}/admin/creative?focus=${session.id}`;

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;color:#1a1d23;">
        <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#b0762a;margin:0 0 6px;">
          Creative brief submitted
        </p>
        <h1 style="font-size:22px;margin:0 0 4px;">${esc(session.project_name)}</h1>
        <p style="color:#8a8f98;margin:0 0 20px;font-size:14px;">
          ${esc(session.client_name)}${session.event_date ? ` &middot; ${esc(session.event_date)}` : ''}
          &middot; ${answered} of 7 answered
        </p>
        ${teamNames.length > 0
          ? `<p style="color:#8a8f98;margin:-12px 0 20px;font-size:13px;">Also sent to ${esc(teamNames.join(', '))}</p>`
          : ''}

        <table style="border-collapse:collapse;font-size:14px;line-height:1.5;width:100%;">
          ${row('Mood', brief.mood)}
          ${row('Vibe', brief.vibe)}
          ${row('Colour', brief.color_scheme)}
          ${row('Avoid', brief.avoid)}
          ${row('Elevator', brief.elevator_mode ? (ELEVATOR_LABEL[brief.elevator_mode] ?? brief.elevator_mode) : null)}
          ${brief.elevator_up ? row('— ride up', brief.elevator_up) : ''}
          ${brief.elevator_down ? row('— ride down', brief.elevator_down) : ''}
          ${row('Turns to a party', brief.transforms_to_party ? (PARTY_LABEL[brief.transforms_to_party] ?? brief.transforms_to_party) : null)}
          ${row('Looks wanted', brief.looks_count ? String(brief.looks_count) : null)}
          ${row('Notes', brief.notes)}
        </table>

        <p style="margin:26px 0 0;">
          <a href="${adminUrl}" style="display:inline-block;background:#1a1d23;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:14px;">
            Open in Soleia
          </a>
          <a href="${sessionUrl}" style="margin-left:12px;color:#8a8f98;font-size:13px;">
            the client's view
          </a>
        </p>
      </div>`;

    const report = await sendEach({
      to: recipients,
      subject: `Creative brief in: ${session.project_name} — ${session.client_name}`,
      html,
    });

    // Stamp only once something actually arrived, so a total failure is retried
    // on the next submit rather than being silently marked as handled.
    if (report.delivered.length > 0) {
      const { error: stampErr } = await supabase
        .from('creative_briefs')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', brief.id);
      if (stampErr) console.error('Failed to stamp notified_at:', stampErr.message);
    }

    return json(200, {
      success: report.delivered.length > 0,
      answered,
      recipients,
      assignees: teamEmails,
      ...report,
      sandbox_sender: usingSandboxSender(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('notify-brief-submitted error:', message);
    return json(500, { error: message });
  }
});
