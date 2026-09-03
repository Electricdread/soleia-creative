// Soleia Creative — studio-sync
//
// The contract Soleia publishes for DSX Studio OS.
//
// Studio OS used to sign in as the owner and issue raw PostgREST selects naming
// this database's internal columns. When those columns were renamed — which
// Soleia is entitled to do — every pull failed, silently, for weeks. This
// endpoint inverts that: Soleia decides what it publishes, Studio OS consumes
// only that, and a rename is a change to one TypeScript file rather than a
// broken consumer.
//
// Read-only. There is no write path here and there should never be one:
// Studio OS coordinates, Soleia is the system of record.
//
// NO CORS HEADERS, DELIBERATELY. Every other function in this directory sets
// them, so their absence here will look like an oversight — it is not. The only
// consumer is an Electron main process, which is not subject to CORS. Emitting
// `Access-Control-Allow-Origin: *` on a key-authenticated endpoint would invite
// someone to call it from a web page with a key that leaked into a bundle.
// OPTIONS is answered 405.
//
// The contract itself is documented in docs/studio-sync-contract.md.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { matchesAnySecret } from '../_shared/constantTimeEqual.ts';
import { calcProposalTotal, type ProposalLineItem } from '../_shared/proposalTotals.ts';
import {
  nextAction,
  stageFor,
  type AttachedPacket,
  type AttachedProposal,
  type AttachedSession,
  type JobRecord,
  type JobWithMembers,
} from '../_shared/jobStage.ts';

// The deploy proof. Lovable has reported a successful edge-function deploy that
// did not take, so "is the new code live?" cannot be answered by asking Lovable.
// A stale build physically cannot emit a stamp that did not exist in it.
//
// BUMP THIS ON EVERY CHANGE TO THIS FUNCTION. A date-and-letter label rather
// than a commit SHA, because a SHA cannot name the commit that contains it —
// all that is required is that the string be new.
const BUILD = 'studio-sync-2026-09-03a';
const CONTRACT_NAME = 'soleia.studio-sync';
const SUPPORTED_VERSIONS = [1];

// PostgREST caps a page at 1000 rows. drive_seen_files is the one table here
// that plausibly exceeds it, and a truncated read undercounts assets — which
// flips a job from in_production back to awaiting_assets and invents a "nudge
// the client" action. Paged, with the ceiling reported rather than inferred.
const PAGE = 1000;
const MAX_PAGES = 40;

// --- the rows this function reads -------------------------------------------
// Named here rather than inferred, because supabase-js has no generated types
// for this project and every field below is one Studio OS renders.

type ProposalRow = AttachedProposal & {
  job_id: string;
  discount_type?: 'percent' | 'amount' | null;
  discount_value?: number | string | null;
  discount_label?: string | null;
};
type PacketRow = AttachedPacket & { job_id: string; created_at: string | null };
type SessionRow = AttachedSession & { job_id: string };
type ItemRow = ProposalLineItem & { proposal_id: string };
interface AssetRow { drive_folder_id: string | null; file_name: string | null; seen_at: string; web_view_link: string | null }
interface HistoryRow { proposal_id: string; total: number | null; signed_at: string | null; created_at: string | null }
interface PackageItemRow { proposal_id: string; category: string | null; title: string | null }

/** The part of a PostgREST builder this function uses. */
interface Refinable {
  range(from: number, to: number): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });

type SupabaseClient = ReturnType<typeof createClient>;

/** A row set larger than one PostgREST page, read to the end or to the ceiling. */
async function readAll<T>(
  client: SupabaseClient,
  table: string,
  columns: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- supabase-js's builder is generic over a schema this project has no generated types for. The looseness stops here; every row out of it is typed above.
  refine: (query: any) => Refinable,
): Promise<{ rows: T[]; truncated: boolean }> {
  const rows: T[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE;
    const { data, error } = await refine(client.from(table).select(columns)).range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}

// A signing recorded before 2026-08-20 is a backfill: those rows captured state
// as of that day, not what the client actually ticked at the time. Comparing a
// live total against one of them would report a disagreement that means nothing.
const BACKFILL_SKEW_MS = 24 * 60 * 60 * 1000;
const isBackfilled = (signedAt: string | null, createdAt: string | null) => {
  if (!signedAt || !createdAt) return false;
  return new Date(createdAt).getTime() - new Date(signedAt).getTime() > BACKFILL_SKEW_MS;
};

/**
 * What a signed proposal is worth.
 *
 * Two implementations of this exist and they disagree:
 * `capture_proposal_signature` computes `sum(price * GREATEST(quantity,1))` and
 * does NOT honour `is_flat_fee`, so a flat-fee item with quantity 3 is counted
 * three times. `proposalTotals.ts` — which is what the proposal page, the signed
 * view, the PDF and the emails all render — does honour it.
 *
 * The published figure is the one the client actually saw. The stored figure is
 * reported beside it when the two differ, rather than one silently winning.
 *
 * An unsigned proposal has no total. What it is "worth" is whatever the client
 * currently has ticked in their browser — live UI state, not a committed
 * figure. Publishing a number for it would be inventing one.
 */
function proposalTotal(
  proposal: { id: string; signed_at: string | null },
  itemsByProposal: Map<string, ItemRow[]> | null,
  historyByProposal: Map<string, HistoryRow>,
) {
  if (itemsByProposal === null) {
    return { total: null, total_status: 'items_unreadable', signature_history_total: null, totals_disagree: false };
  }
  if (!proposal.signed_at) {
    return { total: null, total_status: 'not_signed', signature_history_total: null, totals_disagree: false };
  }

  const items = itemsByProposal.get(proposal.id) ?? [];
  if (items.length === 0) {
    return { total: null, total_status: 'no_line_items', signature_history_total: null, totals_disagree: false };
  }
  if (!items.some((item) => item.client_selected === true)) {
    // Arithmetically this is $0, but zero selected items on a signed proposal is
    // far more likely a data problem than a free job. Studio OS renders this as
    // "scope not recorded" — never as "$0", which is a claim.
    return { total: null, total_status: 'none_selected', signature_history_total: null, totals_disagree: false };
  }

  // The published figure is what the client owes, discount included — Studio
  // OS must never show a number above the agreement.
  const discount = proposal.discount_type && proposal.discount_value
    ? { type: proposal.discount_type as 'percent' | 'amount', value: Number(proposal.discount_value), label: proposal.discount_label ?? null }
    : null;
  const total = Math.round(calcProposalTotal(items, { signed: true, discount }) * 100) / 100;
  const history = historyByProposal.get(proposal.id);
  const stored = history?.total;
  const comparable = stored != null && !isBackfilled(history!.signed_at, history!.created_at);
  return {
    total,
    total_status: 'computed',
    signature_history_total: comparable ? Number(stored) : null,
    totals_disagree: comparable ? Math.abs(Number(stored) - total) > 0.01 : false,
  };
}

async function buildPayload(client: SupabaseClient) {
  // Mirrors src/hooks/useJobs.ts query for query. Any divergence and Studio OS
  // shows a different stage than Soleia's own Jobs screen for the same job,
  // which is worse than showing no stage at all.
  const [jobRows, proposalRows, packetRows, sessionRows, assocRows, meetingRows] = await Promise.all([
    client.from('jobs').select('*').order('event_date', { nullsFirst: false }),
    client.from('proposals')
      .select('id, token, event_name, status, signed_at, is_active, signoff_due_on, drive_folder_id, job_id, discount_type, discount_value, discount_label')
      .not('job_id', 'is', null),
    client.from('pre_call_packets')
      .select('id, token, title, kind, is_active, drive_folder_id, job_id, created_at')
      .not('job_id', 'is', null),
    client.from('creative_sessions')
      .select('id, token, project_name, is_active, job_id')
      .not('job_id', 'is', null),
    // A job's scheduled e-meetings, reached through its records' calendar
    // events — whether a creative call is even part of this job's timeline.
    client.from('calendar_event_associations').select('event_uid, entity_id'),
    client.from('calendar_event_meeting_links').select('event_uid'),
  ]);

  for (const [name, result] of [
    ['jobs', jobRows], ['proposals', proposalRows],
    ['pre_call_packets', packetRows], ['creative_sessions', sessionRows],
    ['calendar_event_associations', assocRows], ['calendar_event_meeting_links', meetingRows],
  ] as const) {
    if (result.error) throw new Error(`${name}: ${result.error.message}`);
  }

  const jobs = (jobRows.data ?? []) as unknown as JobRecord[];
  const proposals = (proposalRows.data ?? []) as unknown as ProposalRow[];
  const packets = (packetRows.data ?? []) as unknown as PacketRow[];
  const sessions = (sessionRows.data ?? []) as unknown as SessionRow[];

  // Files the watcher has marked gone are not assets any more.
  const assets = await readAll<AssetRow>(
    client, 'drive_seen_files', 'drive_folder_id, file_name, seen_at, web_view_link',
    (query) => query.is('missing_since', null).order('seen_at', { ascending: false }),
  );

  const packageItems = await client.from('proposal_items')
    .select('proposal_id, category, title')
    .eq('client_selected', true);
  if (packageItems.error) throw new Error(`proposal_items: ${packageItems.error.message}`);

  // Line items for the totals. A failure here degrades every total to
  // "items_unreadable" rather than taking the whole response down — a job's
  // stage and dates are still worth serving without its money.
  let itemsByProposal: Map<string, ItemRow[]> | null = new Map();
  try {
    const items = await readAll<ItemRow>(
      client, 'proposal_items', 'id, proposal_id, price, quantity, is_flat_fee, client_selected',
      (query) => query,
    );
    for (const row of items.rows) {
      const held = itemsByProposal.get(row.proposal_id) ?? [];
      held.push(row);
      itemsByProposal.set(row.proposal_id, held);
    }
  } catch {
    itemsByProposal = null;
  }

  const historyByProposal = new Map<string, HistoryRow>();
  const history = await client.from('proposal_signature_history')
    .select('proposal_id, total, signed_at, created_at')
    .order('signed_at', { ascending: false });
  if (!history.error) {
    // Ordered newest first, so the first row seen for a proposal is its latest signing.
    for (const row of (history.data ?? []) as unknown as HistoryRow[]) {
      if (!historyByProposal.has(row.proposal_id)) historyByProposal.set(row.proposal_id, row);
    }
  }

  const filesByFolder = new Map<string, { count: number; latest: AssetRow }>();
  for (const file of assets.rows) {
    if (!file.drive_folder_id) continue;
    const held = filesByFolder.get(file.drive_folder_id);
    // The rows arrive newest first, so the first one seen for a folder is its latest.
    if (held) held.count += 1;
    else filesByFolder.set(file.drive_folder_id, { count: 1, latest: file });
  }

  const packageProposals = new Set(
    ((packageItems.data ?? []) as unknown as PackageItemRow[])
      .filter((item) => item.category === 'Soleia Creative Package'
        || String(item.title ?? '').toLowerCase().includes('creative package'))
      .map((item) => item.proposal_id),
  );

  const meetingsByEvent = new Map<string, number>();
  for (const m of (meetingRows.data ?? []) as { event_uid: string }[]) {
    meetingsByEvent.set(m.event_uid, (meetingsByEvent.get(m.event_uid) ?? 0) + 1);
  }
  const eventsByEntity = new Map<string, string[]>();
  for (const a of (assocRows.data ?? []) as { event_uid: string; entity_id: string }[]) {
    const held = eventsByEntity.get(a.entity_id) ?? [];
    held.push(a.event_uid);
    eventsByEntity.set(a.entity_id, held);
  }

  const published = jobs.map((job) => {
    const jobProposals = proposals.filter((p) => p.job_id === job.id);
    const jobPackets = packets.filter((p) => p.job_id === job.id);
    const jobSessions = sessions.filter((s) => s.job_id === job.id);

    // Assets are counted over the union of the job's own folder and every
    // attached proposal's and packet's, because a job folder is shared and that
    // is what "the brand assets are in" actually means here.
    const folders = new Set(
      [job.drive_folder_id, ...jobProposals.map((p) => p.drive_folder_id), ...jobPackets.map((p) => p.drive_folder_id)]
        .filter(Boolean) as string[],
    );
    let assetCount = 0;
    let latestAsset: AssetRow | null = null;
    for (const folder of folders) {
      const held = filesByFolder.get(folder);
      if (!held) continue;
      assetCount += held.count;
      if (!latestAsset || new Date(held.latest.seen_at) > new Date(latestAsset.seen_at)) latestAsset = held.latest;
    }

    const eventUids = new Set<string>();
    for (const r of [...jobProposals, ...jobPackets, ...jobSessions]) {
      for (const uid of eventsByEntity.get(r.id) ?? []) eventUids.add(uid);
    }
    let meetingCount = 0;
    for (const uid of eventUids) meetingCount += meetingsByEvent.get(uid) ?? 0;

    const members: JobWithMembers = {
      job,
      proposals: jobProposals,
      packets: jobPackets,
      sessions: jobSessions,
      assetCount,
      hasCreativePackage: jobProposals.some((p) => packageProposals.has(p.id)),
      meetingCount,
    };

    const stage = stageFor(members);
    const action = nextAction(members);

    const proposal = jobProposals.find((p) => !!p.signed_at) ?? jobProposals.find((p) => p.is_active) ?? null;
    const packet = jobPackets.slice()
      .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))[0] ?? null;
    const session = jobSessions.find((s) => s.is_active) ?? null;

    return {
      id: job.id,
      title: job.title,
      client_name: job.client_name,
      event_date: job.event_date,
      track: job.track,
      is_active: job.is_active,
      notes: job.notes,
      call_held_on: job.call_held_on,
      drive_folder_id: job.drive_folder_id,
      drive_folder_url: job.drive_folder_url,

      stage: { value: stage.stage, reason: stage.reason, done: stage.done },
      // `href` and `weight` are Soleia's own routing table and the sort order of
      // its triage screen. Publishing them means a route rename breaks a
      // consumer, and hands Studio OS an order tuned for a screen it lacks.
      next_action: action ? { kind: action.kind, label: action.label, verb: action.verb } : null,

      proposal: proposal
        ? {
            id: proposal.id,
            status: proposal.status,
            signed_at: proposal.signed_at,
            signoff_due_on: proposal.signoff_due_on,
            is_active: proposal.is_active,
            ...proposalTotal(proposal, itemsByProposal, historyByProposal),
          }
        : null,

      packet: packet
        ? {
            id: packet.id,
            title: packet.title,
            kind: packet.kind,
            // `is_active` is the deploy flag — Soleia's own admin UI labels this
            // field "Deployed". `created_at` is a creation time and nothing else.
            deployed: Boolean(packet.is_active),
            created_at: packet.created_at ?? null,
          }
        : null,

      creative_session: session ? { id: session.id, project_name: session.project_name, live: true } : null,

      assets: {
        count: assetCount,
        folders_scanned: folders.size,
        latest: latestAsset
          ? { name: latestAsset.file_name, seen_at: latestAsset.seen_at, link: latestAsset.web_view_link ?? null }
          : null,
      },
    };
  });

  return {
    jobs: published,
    counts: {
      jobs: jobs.length,
      proposals: proposals.length,
      packets: packets.length,
      sessions: sessions.length,
      drive_files_scanned: assets.rows.length,
    },
    truncated: assets.truncated,
  };
}

const weakEtag = async (body: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
  const hex = [...new Uint8Array(digest)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `W/"${hex}"`;
};

Deno.serve(async (req) => {
  if (req.method !== 'GET') return json(405, { error: 'method_not_allowed' });

  // Checked before the request's key is even read. An unset secret must never
  // let `undefined === undefined` authorise anyone, and 503 tells the owner
  // "Soleia is not set up yet", which is a different problem from a wrong key.
  const current = Deno.env.get('STUDIO_OS_SYNC_KEY');
  const previous = Deno.env.get('STUDIO_OS_SYNC_KEY_PREVIOUS');
  if (!current && !previous) return json(503, { error: 'sync_not_configured' });

  const provided = req.headers.get('x-api-key') ?? '';
  if (!provided || !(await matchesAnySecret(provided, [current, previous]))) {
    return json(401, { error: 'unauthorized' });
  }

  const requested = new URL(req.url).searchParams.get('v');
  const version = requested === null ? 1 : Number(requested);
  if (!SUPPORTED_VERSIONS.includes(version)) {
    return json(400, { error: 'unsupported_contract_version', supported: SUPPORTED_VERSIONS });
  }

  try {
    const client = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );
    const { jobs, counts, truncated } = await buildPayload(client);

    // The ETag covers the data only. Including `generated_at` would make every
    // response a miss, which is the whole point of not having it.
    const etag = await weakEtag(JSON.stringify({ jobs, counts, truncated }));
    if (req.headers.get('if-none-match') === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag, 'Cache-Control': 'no-store' } });
    }

    return json(200, {
      contract: { name: CONTRACT_NAME, version, build: BUILD },
      generated_at: new Date().toISOString(),
      source: 'soleia',
      counts,
      truncated,
      jobs,
    }, { ETag: etag });
  } catch (error) {
    // The message names the table that refused, because "Soleia is unreachable"
    // is exactly the unhelpful report this endpoint exists to replace.
    const message = error instanceof Error ? error.message : 'The sync could not be built.';
    console.error('studio-sync failed:', message);
    return json(502, { error: 'sync_failed', detail: message.slice(0, 300) });
  }
});
