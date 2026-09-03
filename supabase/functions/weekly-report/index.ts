// The Monday report: where every project stands, to the people who carry them.
//
// Two audiences, one set of facts. An executive sees the whole book — what was
// signed, what is out and unanswered, what landed, what is waiting on us, what
// is coming. A PM sees that same report narrowed to their own jobs, so the
// shape they read on Monday is the shape they already know.
//
// The stage and next-action rules come from _shared/jobStage.ts — the same copy
// studio-sync publishes and the Jobs screen renders — so this report cannot
// quietly disagree with the app about what a job is waiting on.
//
// pg_cron fires it on Monday morning. POST {"dry_run": true} renders without
// sending; {"only": ["someone@..."]} narrows a real send to named people.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { adminRecipients, firstNameOf, sendEach } from '../_shared/notify.ts';
import { calcProposalTotal, type ProposalLineItem } from '../_shared/proposalTotals.ts';
import {
  nextAction, stageFor, STAGE_LABEL,
  type AttachedPacket, type AttachedProposal, type AttachedSession,
  type JobRecord, type JobWithMembers,
} from '../_shared/jobStage.ts';

// A stale build cannot emit a stamp that did not exist in it, which is how
// "did the deploy take?" gets answered without asking Lovable. Bump on change.
const BUILD = 'weekly-report-2026-09-01a';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_ORIGIN = 'https://soleiacreative.app';
const GOLD = '#b0762a';
const INK = '#1a1d23';
const QUIET = '#8a8f98';
const PAGE = 1000;

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const money = (n: number | null): string =>
  n == null ? '—' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const shortDate = (iso: string | null): string =>
  iso ? new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD';

const longDate = (iso: string | null): string =>
  iso ? new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date TBD';

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const then = new Date(iso.slice(0, 10) + 'T00:00:00').getTime();
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((then - now.getTime()) / 86_400_000);
}

/** Read a table past PostgREST's 1000-row page cap. */
async function readAll<T>(client: any, table: string, columns: string, shape: (q: any) => any): Promise<T[]> {
  const out: T[] = [];
  for (let page = 0; page < 40; page++) {
    const from = page * PAGE;
    const { data, error } = await shape(client.from(table).select(columns)).range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

// ── the report's own shape ───────────────────────────────────────────────────

interface Line { title: string; client: string; detail: string; right: string; href: string }
interface Block { heading: string; note: string; tone: string; lines: Line[] }

const block = (heading: string, note: string, tone: string, lines: Line[]): Block =>
  ({ heading, note, tone, lines });

/** A section, or nothing at all — an empty heading is noise on a Monday. */
function renderBlock(b: Block): string {
  if (b.lines.length === 0) return '';
  const rows = b.lines.map((l) => `
    <tr>
      <td style="padding:9px 14px 9px 0;vertical-align:top;">
        <a href="${l.href}" style="color:${INK};font-size:14px;font-weight:600;text-decoration:none;">${esc(l.title)}</a>
        <div style="color:${QUIET};font-size:12.5px;margin-top:1px;">${esc(l.client)}${l.detail ? ` &middot; ${esc(l.detail)}` : ''}</div>
      </td>
      <td align="right" style="padding:9px 0;vertical-align:top;white-space:nowrap;color:${INK};font-size:13px;font-weight:600;">
        ${esc(l.right)}
      </td>
    </tr>`).join('');
  return `
    <tr><td style="padding:26px 0 6px;">
      <span style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${b.tone};">
        ${esc(b.heading)} &middot; ${b.lines.length}
      </span>
      <div style="color:${QUIET};font-size:12.5px;margin-top:3px;">${esc(b.note)}</div>
    </td></tr>
    <tr><td style="border-top:1px solid #ecf0f1;">
      <table style="border-collapse:collapse;width:100%;">${rows}</table>
    </td></tr>`;
}

function renderReport(opts: {
  title: string; subtitle: string; stats: { label: string; value: string }[]; blocks: Block[];
}): string {
  const stats = opts.stats.map((s) => `
    <td align="center" style="padding:12px 6px;border:1px solid #ecf0f1;">
      <div style="font-size:22px;font-weight:700;color:${INK};">${esc(s.value)}</div>
      <div style="font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:${QUIET};margin-top:3px;">${esc(s.label)}</div>
    </td>`).join('');
  const body = opts.blocks.map(renderBlock).join('');
  const quiet = opts.blocks.every((b) => b.lines.length === 0);
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:660px;color:${INK};">
    <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${GOLD};margin:0 0 6px;">
      Soleia Creative &middot; Monday report
    </p>
    <h1 style="font-size:23px;margin:0 0 4px;">${esc(opts.title)}</h1>
    <p style="color:${QUIET};margin:0 0 20px;font-size:14px;">${esc(opts.subtitle)}</p>
    <table style="border-collapse:collapse;width:100%;"><tr>${stats}</tr></table>
    <table style="border-collapse:collapse;width:100%;">${body}</table>
    ${quiet ? `<p style="color:${QUIET};font-size:14px;margin:26px 0 0;">Nothing moved last week and nothing is waiting — a quiet board.</p>` : ''}
    <p style="margin:30px 0 0;">
      <a href="${APP_ORIGIN}/admin/jobs" style="display:inline-block;background:${INK};color:#fff;padding:11px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
        Open the jobs board
      </a>
    </p>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (status: number, payload: unknown) =>
    new Response(JSON.stringify(payload), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new Error('Supabase env not configured');
    const client = createClient(url, key);

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run === true;
    const only: string[] = Array.isArray(body?.only)
      ? body.only.filter((v: unknown): v is string => typeof v === 'string').map((v: string) => v.trim().toLowerCase())
      : [];

    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const [jobRows, proposalRows, packetRows, sessionRows, assignRows, subRows] = await Promise.all([
      client.from('jobs').select('*').eq('is_active', true),
      client.from('proposals')
        .select('id, token, event_name, client_name, status, signed_at, is_active, signoff_due_on, drive_folder_id, job_id, event_date, discount_type, discount_value, discount_label')
        .not('job_id', 'is', null),
      client.from('pre_call_packets').select('id, token, title, kind, is_active, drive_folder_id, job_id').not('job_id', 'is', null),
      client.from('creative_sessions').select('id, token, project_name, is_active, job_id').not('job_id', 'is', null),
      client.from('job_assignees').select('job_id, email, display_name'),
      client.from('report_subscriptions').select('email, display_name, scope'),
    ]);
    for (const [name, res] of [
      ['jobs', jobRows], ['proposals', proposalRows], ['pre_call_packets', packetRows],
      ['creative_sessions', sessionRows], ['job_assignees', assignRows], ['report_subscriptions', subRows],
    ] as const) {
      if (res.error) throw new Error(`${name}: ${res.error.message}`);
    }

    type FileRow = { drive_folder_id: string; file_name: string; seen_at: string; final_slot: string | null };
    const files = await readAll<FileRow>(
      client, 'drive_seen_files', 'drive_folder_id, file_name, seen_at, final_slot',
      (q) => q.is('missing_since', null),
    );
    const items = await readAll<ProposalLineItem & { proposal_id: string }>(
      client, 'proposal_items', 'id, proposal_id, price, quantity, is_flat_fee, client_selected', (q) => q,
    );

    const itemsByProposal = new Map<string, ProposalLineItem[]>();
    for (const row of items) {
      const held = itemsByProposal.get(row.proposal_id) ?? [];
      held.push(row);
      itemsByProposal.set(row.proposal_id, held);
    }

    const filesByFolder = new Map<string, FileRow[]>();
    for (const f of files) {
      if (!f.drive_folder_id) continue;
      const held = filesByFolder.get(f.drive_folder_id) ?? [];
      held.push(f);
      filesByFolder.set(f.drive_folder_id, held);
    }

    const jobs = (jobRows.data ?? []) as unknown as JobRecord[];
    const proposals = (proposalRows.data ?? []) as any[];
    const packets = (packetRows.data ?? []) as any[];
    const sessions = (sessionRows.data ?? []) as any[];
    const assignments = (assignRows.data ?? []) as any[];

    interface Built {
      job: JobRecord; members: JobWithMembers; proposals: any[];
      assignees: string[]; recentFiles: FileRow[];
    }

    const built: Built[] = jobs.map((job) => {
      const jp = proposals.filter((p) => p.job_id === job.id);
      const jk = packets.filter((p) => p.job_id === job.id);
      const js = sessions.filter((s) => s.job_id === job.id);
      // A job's folder is shared with its proposal and packet, so assets are
      // counted over the union — the same rule the Jobs screen uses.
      const folders = Array.from(new Set([
        job.drive_folder_id, ...jp.map((p) => p.drive_folder_id), ...jk.map((p) => p.drive_folder_id),
      ].filter(Boolean) as string[]));
      let assetCount = 0;
      const recentFiles: FileRow[] = [];
      for (const folder of folders) {
        const held = filesByFolder.get(folder) ?? [];
        assetCount += held.length;
        for (const f of held) if (f.seen_at >= since) recentFiles.push(f);
      }
      return {
        job,
        proposals: jp,
        recentFiles,
        members: {
          job,
          proposals: jp as unknown as AttachedProposal[],
          packets: jk as unknown as AttachedPacket[],
          sessions: js as unknown as AttachedSession[],
          assetCount,
          hasCreativePackage: false,
          meetingCount: 0,
        },
        assignees: assignments
          .filter((a) => a.job_id === job.id)
          .map((a) => String(a.email ?? '').trim().toLowerCase())
          .filter(Boolean),
      };
    });

    const jobHref = (id: string) => `${APP_ORIGIN}/admin/jobs/${id}`;

    /** One audience's report: the same blocks, over the jobs they carry. */
    function buildFor(scope: 'executive' | 'pm', mine: Built[], name: string | null): string {
      const signed: Line[] = [];
      const out: Line[] = [];
      const landed: Line[] = [];
      const waiting: Line[] = [];
      const coming: Line[] = [];

      for (const b of mine) {
        for (const p of b.proposals) {
          // A signed proposal's total is its accepted scope; an unsigned one has
          // no knowable total, so it is reported by its dates instead of a
          // figure nobody agreed to.
          if (p.signed_at && p.signed_at >= since) {
            const total = calcProposalTotal(itemsByProposal.get(p.id) ?? [], {
              signed: true,
              discount: p.discount_type && p.discount_value
                ? { type: p.discount_type, value: Number(p.discount_value), label: p.discount_label ?? null }
                : null,
            });
            signed.push({
              title: b.job.title, client: b.job.client_name,
              detail: `signed ${shortDate(p.signed_at)}`,
              right: total > 0 ? money(total) : '—',
              href: jobHref(b.job.id),
            });
          } else if (!p.signed_at && p.status === 'sent' && p.is_active) {
            out.push({
              title: b.job.title, client: b.job.client_name,
              detail: p.signoff_due_on ? `sign-off due ${shortDate(p.signoff_due_on)}` : 'no sign-off date set',
              right: longDate(b.job.event_date),
              href: jobHref(b.job.id),
            });
          }
        }

        if (b.recentFiles.length) {
          const finals = b.recentFiles.filter((f) => f.final_slot).length;
          landed.push({
            title: b.job.title, client: b.job.client_name,
            detail: finals ? `${finals} final${finals === 1 ? '' : 's'} among them` : 'client uploads',
            right: `${b.recentFiles.length} file${b.recentFiles.length === 1 ? '' : 's'}`,
            href: jobHref(b.job.id),
          });
        }

        const action = nextAction(b.members);
        if (action) {
          waiting.push({
            title: b.job.title, client: b.job.client_name,
            detail: action.label, right: action.verb, href: jobHref(b.job.id),
          });
        }

        const days = daysUntil(b.job.event_date);
        if (days !== null && days >= 0 && days <= 21) {
          coming.push({
            title: b.job.title, client: b.job.client_name,
            detail: STAGE_LABEL[stageFor(b.members).stage],
            right: days === 0 ? 'today' : `${days}d`,
            href: jobHref(b.job.id),
          });
        }
      }

      coming.sort((a, z) => (parseInt(a.right) || 0) - (parseInt(z.right) || 0));

      const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return renderReport({
        title: scope === 'executive' ? 'The whole board' : `${name ? `${name}, your` : 'Your'} week`,
        subtitle: scope === 'executive'
          ? `Every live project, week beginning ${today}.`
          : `The ${mine.length} project${mine.length === 1 ? '' : 's'} assigned to you, week beginning ${today}.`,
        stats: [
          { label: 'Live jobs', value: String(mine.length) },
          { label: 'Signed', value: String(signed.length) },
          { label: 'Out', value: String(out.length) },
          { label: 'Waiting', value: String(waiting.length) },
        ],
        blocks: [
          block('Signed this week', 'Accepted in the last seven days.', '#0f9d58', signed),
          block('Out and unanswered', 'Sent, not yet signed.', '#d97706', out),
          block('Landed this week', 'What clients sent us.', '#2563eb', landed),
          block('Waiting on us', 'The one thing that moves each job on.', '#dc2626', waiting),
          block('The next three weeks', 'Shows coming up.', GOLD, coming),
        ],
      });
    }

    // ── who receives what ────────────────────────────────────────────────────
    // Executives are named in report_subscriptions; the studio inbox is one by
    // definition. Everyone else who is on a job gets the same report narrowed
    // to their own — and nobody receives both, because an executive's copy
    // already contains every job theirs would.
    const execs = ((subRows.data ?? []) as any[])
      .filter((r) => r.scope === 'executive')
      .map((r) => ({ email: String(r.email ?? '').trim(), name: (r.display_name ?? '').trim() || null }))
      .filter((r) => r.email);
    for (const admin of adminRecipients()) {
      if (!execs.some((e) => e.email.toLowerCase() === admin.toLowerCase())) {
        execs.push({ email: admin, name: null });
      }
    }
    const execSet = new Set(execs.map((e) => e.email.toLowerCase()));

    const pms = new Map<string, string | null>();
    for (const a of assignments) {
      const email = String(a.email ?? '').trim();
      const keyed = email.toLowerCase();
      if (!email || execSet.has(keyed) || pms.has(keyed)) continue;
      pms.set(keyed, (a.display_name ?? '').trim() || null);
    }

    const sends: { to: string; subject: string; html: string; scope: string }[] = [];

    const wholeBoard = buildFor('executive', built, null);
    for (const exec of execs) {
      sends.push({
        to: exec.email, scope: 'executive',
        subject: `Soleia Monday report — ${built.length} live project${built.length === 1 ? '' : 's'}`,
        html: wholeBoard,
      });
    }

    for (const [email, name] of pms) {
      const mine = built.filter((b) => b.assignees.includes(email));
      // Nobody is sent an empty report; being on no live job is not news.
      if (mine.length === 0) continue;
      sends.push({
        to: email, scope: 'pm',
        subject: `Your Soleia week — ${mine.length} project${mine.length === 1 ? '' : 's'}`,
        html: buildFor('pm', mine, firstNameOf(name)),
      });
    }

    const chosen = only.length ? sends.filter((s) => only.includes(s.to.toLowerCase())) : sends;

    if (dryRun) {
      const divider = '<hr style="margin:44px 0;border:0;border-top:1px solid #ecf0f1;">';
      return new Response(chosen.map((s) => s.html).join(divider), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const delivered: string[] = [];
    const failed: { to: string; error: string }[] = [];
    for (const s of chosen) {
      const report = await sendEach({
        template: `weekly-report-${s.scope}`, to: [s.to], subject: s.subject, html: s.html,
      });
      delivered.push(...report.delivered);
      failed.push(...report.failed);
    }
    if (failed.length) console.error('weekly-report failures:', JSON.stringify(failed));

    return json(200, {
      build: BUILD,
      success: failed.length === 0 && delivered.length > 0,
      live_jobs: built.length,
      executives: execs.length,
      pms: pms.size,
      delivered,
      failed,
    });
  } catch (e) {
    console.error('weekly-report error:', e);
    return json(500, { build: BUILD, error: e instanceof Error ? e.message : String(e) });
  }
});
