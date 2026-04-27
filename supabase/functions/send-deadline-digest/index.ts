import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RECIPIENT = 'luisdreamslv@gmail.com';
const APP_ORIGIN = 'https://soleiacreative.app';
const GOLD = '#c49a3c';

interface DeadlineRow {
  module: 'Proposal' | 'Creative Session' | 'Content Previz';
  title: string;
  client: string;
  eventDate: string;
  href: string;
  days: number;
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function fmtDate(s: string): string {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function row(item: DeadlineRow): string {
  const label = item.days < 0 ? `${Math.abs(item.days)}d overdue`
    : item.days === 0 ? 'Due today'
    : `${item.days}d left`;
  const color = item.days <= 0 ? '#dc2626' : item.days <= 7 ? '#d97706' : GOLD;
  return `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #2a2a2a;">
        <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${item.module}</div>
        <div style="font-size:15px;color:#ffffff;font-weight:600;margin-bottom:2px;">${item.title}</div>
        <div style="font-size:13px;color:#cbd5e1;">${item.client} · ${fmtDate(item.eventDate)}</div>
      </td>
      <td align="right" style="padding:14px 16px;border-bottom:1px solid #2a2a2a;white-space:nowrap;">
        <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${color}22;color:${color};font-size:12px;font-weight:700;border:1px solid ${color}55;">${label}</span>
      </td>
    </tr>`;
}

function section(title: string, color: string, items: DeadlineRow[]): string {
  if (items.length === 0) return '';
  return `
    <tr><td style="padding:24px 24px 8px;">
      <div style="font-size:13px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;">${title} · ${items.length}</div>
    </td></tr>
    <tr><td style="padding:0 24px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#1a1a1a;border-radius:8px;overflow:hidden;">
        ${items.map(row).join('')}
      </table>
    </td></tr>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch items within next 21 days OR overdue
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 21);
    const horizonStr = horizon.toISOString().slice(0, 10);

    const [proposals, sessions, links] = await Promise.all([
      supabase.from('proposals')
        .select('id, token, event_name, client_name, event_date')
        .eq('is_active', true).not('event_date', 'is', null).lte('event_date', horizonStr),
      supabase.from('creative_sessions')
        .select('id, token, project_name, client_name, event_date')
        .eq('is_active', true).not('event_date', 'is', null).lte('event_date', horizonStr),
      supabase.from('client_links')
        .select('id, token, event_name, client_name, event_date')
        .eq('is_active', true).not('event_date', 'is', null).lte('event_date', horizonStr),
    ]);

    const all: DeadlineRow[] = [];

    (proposals.data || []).forEach((p: any) => {
      all.push({
        module: 'Proposal', title: p.event_name, client: p.client_name,
        eventDate: p.event_date, href: `${APP_ORIGIN}/admin/proposals`,
        days: daysUntil(p.event_date),
      });
    });
    (sessions.data || []).forEach((s: any) => {
      all.push({
        module: 'Creative Session', title: s.project_name, client: s.client_name,
        eventDate: s.event_date, href: `${APP_ORIGIN}/admin/creative`,
        days: daysUntil(s.event_date),
      });
    });
    (links.data || []).forEach((l: any) => {
      all.push({
        module: 'Content Previz', title: l.event_name, client: l.client_name,
        eventDate: l.event_date, href: `${APP_ORIGIN}/admin/looks`,
        days: daysUntil(l.event_date),
      });
    });

    if (all.length === 0) {
      return new Response(JSON.stringify({ success: true, skipped: 'no items' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const overdue = all.filter(i => i.days < 0).sort((a, b) => a.days - b.days);
    const dueWeek = all.filter(i => i.days >= 0 && i.days <= 7).sort((a, b) => a.days - b.days);
    const upcoming = all.filter(i => i.days > 7 && i.days <= 21).sort((a, b) => a.days - b.days);

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0f0f0f;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
        <tr><td style="padding:32px 24px 24px;border-bottom:2px solid ${GOLD};">
          <div style="font-size:11px;color:${GOLD};text-transform:uppercase;letter-spacing:2px;font-weight:700;">Soleia Creative</div>
          <h1 style="margin:8px 0 4px;font-size:24px;color:#ffffff;font-weight:700;">Deadlines Digest</h1>
          <div style="font-size:13px;color:#9ca3af;">${today}</div>
        </td></tr>
        ${section('🔴 Overdue', '#dc2626', overdue)}
        ${section('🟡 Due This Week', '#d97706', dueWeek)}
        ${section('🟢 Upcoming (8–21 days)', GOLD, upcoming)}
        <tr><td style="padding:24px;text-align:center;border-top:1px solid #2a2a2a;">
          <a href="${APP_ORIGIN}/admin" style="display:inline-block;padding:12px 24px;background:${GOLD};color:#0a0a0a;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Open Admin Portal</a>
        </td></tr>
        <tr><td style="padding:16px 24px;text-align:center;background:#0a0a0a;">
          <div style="font-size:11px;color:#6b7280;">Soleia Creative Management · Daily 9:00 AM ET</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const subject = `Soleia · ${overdue.length} overdue · ${dueWeek.length} this week`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Soleia Deadlines <onboarding@resend.dev>',
        to: [RECIPIENT],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    const result = await res.json();
    return new Response(JSON.stringify({ success: true, counts: { overdue: overdue.length, dueWeek: dueWeek.length, upcoming: upcoming.length }, resend: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('send-deadline-digest error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
