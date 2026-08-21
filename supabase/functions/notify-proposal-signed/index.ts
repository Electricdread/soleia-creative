import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { adminRecipients, sendEach } from "../_shared/notify.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_name, client_name, client_signature, venue_name, event_date, proposal_url, token } =
      await req.json();

    // Everyone on the job, not just the studio inbox.
    //
    // This has always sent to ADMIN_NOTIFY_EMAILS alone, so the PM named on a
    // proposal was never told their own proposal had been signed — which is
    // exactly what arodriguez@soleialv.com experienced. send-signed-proposal
    // did include them, but that is the manual "Send PDF" action, not this.
    const team: { email: string; name: string | null }[] = [];
    if (token) {
      try {
        const url = Deno.env.get('SUPABASE_URL');
        const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (url && key) {
          const headers = { apikey: key, Authorization: `Bearer ${key}` };
          const pRes = await fetch(
            `${url}/rest/v1/proposals?token=eq.${encodeURIComponent(token)}&select=job_id,assigned_pm_email,assigned_pm_name`,
            { headers },
          );
          const [proposal] = (await pRes.json()) as {
            job_id: string | null; assigned_pm_email: string | null; assigned_pm_name: string | null;
          }[];

          if (proposal?.assigned_pm_email) {
            team.push({ email: proposal.assigned_pm_email, name: proposal.assigned_pm_name });
          }
          if (proposal?.job_id) {
            const aRes = await fetch(
              `${url}/rest/v1/job_assignees?job_id=eq.${proposal.job_id}&select=email,display_name&order=created_at`,
              { headers },
            );
            for (const a of (await aRes.json()) as { email: string; display_name: string | null }[]) {
              if (a.email && !team.some((t) => t.email === a.email)) {
                team.push({ email: a.email, name: a.display_name });
              }
            }
          }
        }
      } catch (e) {
        // A lookup failure must not stop the studio being told.
        console.error('Could not resolve the job team; sending to admins only', e);
      }
    }

    const recipients = Array.from(new Set([
      ...adminRecipients(),
      ...team.map((t) => t.email.trim()).filter(Boolean),
    ]));

    const dateStr = event_date ? new Date(event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #2c3e50; margin-bottom: 4px;">Proposal Signed ✓</h2>
        <p style="color: #7f8c8d; font-size: 14px; margin-top: 0;">A client has accepted a proposal.</p>
        <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;" />
        <table style="font-size: 14px; color: #2c3e50; line-height: 1.8;">
          <tr><td style="color: #95a5a6; padding-right: 16px;">Event</td><td><strong>${event_name}</strong></td></tr>
          <tr><td style="color: #95a5a6; padding-right: 16px;">Client</td><td>${client_name}</td></tr>
          ${venue_name ? `<tr><td style="color: #95a5a6; padding-right: 16px;">Venue</td><td>${venue_name}</td></tr>` : ''}
          <tr><td style="color: #95a5a6; padding-right: 16px;">Date</td><td>${dateStr}</td></tr>
          <tr><td style="color: #95a5a6; padding-right: 16px;">Signed by</td><td><strong>${client_signature}</strong></td></tr>
        </table>
        <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;" />
        <a href="${proposal_url}" style="display: inline-block; background: #2c3e50; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px;">View Proposal</a>
      </div>
    `;

    const report = await sendEach({
      to: recipients,
      template: 'proposal-signed',
      subject: `Proposal Signed: ${event_name} — ${client_name}`,
      html,
    });

    // A rejected recipient is reported rather than thrown: the caller signs
    // regardless, and a swallowed 500 tells nobody which address failed.
    return new Response(JSON.stringify({ success: report.delivered.length > 0, ...report }), {
      status: report.delivered.length > 0 ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('Error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
