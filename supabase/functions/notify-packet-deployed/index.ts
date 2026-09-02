// Emails the studio and the job's assigned team when a packet goes live.
//
// Deploying is the moment the client link starts working, so it is the pipeline
// event the assigned PM has to know about. The browser fires this after the
// deploy toggle succeeds; everything in the email is read server-side from the
// packet row — the caller supplies nothing but the id — and a packet announces
// itself once: deploy → unpublish → deploy again stays silent.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { adminRecipients, jobAssigneesFor, sendEach } from '../_shared/notify.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_ORIGIN = 'https://soleiacreative.app';

const KIND_LABEL: Record<string, string> = {
  pre_call: 'Pre-Call Packet',
  post_call: 'Post-Call Packet',
  custom: 'Custom Packet',
  // Retired kind, kept so old rows read as what they are treated as: custom.
  creative_pre_call: 'Custom Packet',
};

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

    const { packet_id } = await req.json().catch(() => ({ packet_id: undefined }));
    if (!packet_id || typeof packet_id !== 'string') return json(400, { error: 'packet_id required' });

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: packet, error } = await supabase
      .from('pre_call_packets')
      .select('id, title, client_name, event_date, kind, token, job_id, is_active, deploy_notified_at')
      .eq('id', packet_id)
      .maybeSingle();
    if (error) throw new Error(`Packet lookup failed: ${error.message}`);
    if (!packet) return json(404, { error: 'packet not found' });

    // Only a live packet is news; the unpublish side of the toggle is silent.
    if (!packet.is_active) return json(200, { skipped: 'packet is not deployed' });

    if (packet.deploy_notified_at) {
      return json(200, { skipped: 'already notified', notified_at: packet.deploy_notified_at });
    }

    const team = await jobAssigneesFor([packet.job_id]);
    const teamNames = team.map((m) => m.name || m.email);
    const recipients = Array.from(new Set([...adminRecipients(), ...team.map((m) => m.email)]));

    const kindLabel = KIND_LABEL[packet.kind] ?? 'Creative Packet';
    const dateStr = packet.event_date
      ? new Date(packet.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : null;
    const packetUrl = `${APP_ORIGIN}/packet/${packet.token}`;
    const adminUrl = packet.job_id
      ? `${APP_ORIGIN}/admin/jobs/${packet.job_id}`
      : `${APP_ORIGIN}/admin/packets`;

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;color:#1a1d23;">
        <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#b0762a;margin:0 0 6px;">
          Packet deployed
        </p>
        <h1 style="font-size:22px;margin:0 0 4px;">${esc(packet.title)}</h1>
        <p style="color:#8a8f98;margin:0 0 20px;font-size:14px;">
          ${esc(packet.client_name ?? 'Client')}${dateStr ? ` &middot; ${esc(dateStr)}` : ''}
          &middot; ${esc(kindLabel)}
        </p>
        ${teamNames.length > 0
          ? `<p style="color:#8a8f98;margin:-12px 0 20px;font-size:13px;">Also sent to ${esc(teamNames.join(', '))}</p>`
          : ''}
        <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
          The client link is live. Anyone with it can read the packet now.
        </p>
        <p style="margin:26px 0 0;">
          <a href="${adminUrl}" style="display:inline-block;background:#1a1d23;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:14px;">
            Open in Soleia
          </a>
          <a href="${packetUrl}" style="margin-left:12px;color:#8a8f98;font-size:13px;">
            the client's view
          </a>
        </p>
      </div>`;

    const report = await sendEach({
      template: 'packet-deployed',
      to: recipients,
      subject: `Packet deployed: ${packet.title}${packet.client_name ? ` — ${packet.client_name}` : ''}`,
      html,
    });

    // Stamp only once something actually arrived, so a total failure is retried
    // on the next deploy toggle rather than being silently marked as handled.
    if (report.delivered.length > 0) {
      const { error: stampErr } = await supabase
        .from('pre_call_packets')
        .update({ deploy_notified_at: new Date().toISOString() })
        .eq('id', packet.id);
      if (stampErr) console.error('Failed to stamp deploy_notified_at:', stampErr.message);
    }

    return json(200, {
      success: report.delivered.length > 0,
      delivered: report.delivered,
      failed: report.failed,
      sandbox: report.sandbox,
      sandboxFallback: report.sandboxFallback,
    });
  } catch (e) {
    console.error('notify-packet-deployed error:', e);
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
