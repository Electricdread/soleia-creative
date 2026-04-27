import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_name, client_name, client_signature, venue_name, event_date, proposal_url } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

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

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: ['luisdreamslv@gmail.com'],
        subject: `Proposal Signed: ${event_name} — ${client_name}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    return new Response(JSON.stringify({ success: true }), {
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
