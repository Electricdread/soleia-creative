import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Payload {
  event_name: string;
  client_name: string;
  client_signature: string;
  client_email?: string | null;
  venue_name?: string | null;
  event_date?: string | null;
  proposal_url: string;
  assigned_pm_name?: string | null;
  assigned_pm_email?: string | null;
  pdf_base64: string;
  pdf_filename: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const p: Payload = await req.json();
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const recipients = new Set<string>();
    if (p.client_email) recipients.add(p.client_email);
    if (p.assigned_pm_email) recipients.add(p.assigned_pm_email);
    recipients.add('luisdreamslv@gmail.com');

    if (recipients.size === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no recipients' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dateStr = p.event_date
      ? new Date(p.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'TBD';

    const pmLine = p.assigned_pm_name
      ? `<tr><td style="color:#95a5a6;padding-right:16px;">Project Manager</td><td><strong>${p.assigned_pm_name}</strong>${p.assigned_pm_email ? ` &lt;${p.assigned_pm_email}&gt;` : ''}</td></tr>`
      : '';

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#2c3e50;">
        <h2 style="margin:0 0 4px;">Proposal Signed ✓</h2>
        <p style="color:#7f8c8d;font-size:14px;margin:0 0 20px;">A signed copy of your proposal is attached as a PDF.</p>
        <table style="font-size:14px;line-height:1.8;">
          <tr><td style="color:#95a5a6;padding-right:16px;">Event</td><td><strong>${p.event_name}</strong></td></tr>
          <tr><td style="color:#95a5a6;padding-right:16px;">Client</td><td>${p.client_name}</td></tr>
          ${p.venue_name ? `<tr><td style="color:#95a5a6;padding-right:16px;">Venue</td><td>${p.venue_name}</td></tr>` : ''}
          <tr><td style="color:#95a5a6;padding-right:16px;">Date</td><td>${dateStr}</td></tr>
          <tr><td style="color:#95a5a6;padding-right:16px;">Signed by</td><td><strong>${p.client_signature}</strong></td></tr>
          ${pmLine}
        </table>
        <hr style="border:none;border-top:1px solid #ecf0f1;margin:20px 0;" />
        <a href="${p.proposal_url}" style="display:inline-block;background:#2c3e50;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;">View Proposal Online</a>
        <p style="color:#95a5a6;font-size:12px;margin-top:24px;">— Soleia Creative Team</p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Soleia Creative <onboarding@resend.dev>',
        to: Array.from(recipients),
        subject: `Signed Proposal — ${p.event_name}`,
        html,
        attachments: [
          { filename: p.pdf_filename, content: p.pdf_base64 },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    return new Response(JSON.stringify({ success: true, recipients: Array.from(recipients) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('send-signed-proposal error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
