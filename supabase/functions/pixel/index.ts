// Soleia Creative — pixel
// Private, READ-ONLY machine API for the PIXEL assistant (server-to-server).
// Auth: Authorization: Bearer <key>; sha256(key) must match an unrevoked
// row in public.pixel_access. No CORS, GET only, no writes except last_used_at.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { secretEquals } from "../_shared/constantTimeEqual.ts";
import {
  calcLineTotal,
  calcSubtotal,
  calcDiscountAmount,
  type ProposalDiscount,
} from "../_shared/proposalTotals.ts";

const BUILD = "pixel-2026-11-10a";
const BASE_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: BASE_HEADERS });
const unauthorized = () => json(401, { error: "Unauthorized" });
const bad = (msg: string) => json(400, { error: msg });

class ApiError extends Error {}
// Never leak backend error text.
function must<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw new ApiError("Query failed");
  return (res.data ?? ([] as unknown)) as T;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const VIEWS = ["summary", "jobs", "job", "proposals", "proposal", "sessions", "session", "contacts", "calendar", "templates"];
const ALLOWED = new Set(["view", "id", "q", "from", "to", "status", "limit"]);

type Params = { view: string; id?: string; q?: string; from?: string; to?: string; status?: string; limit: number };

function parseParams(url: URL): Params | string {
  const seen = new Set<string>();
  for (const k of url.searchParams.keys()) {
    if (!ALLOWED.has(k)) return `Unknown parameter: ${k.slice(0, 40)}`;
    if (seen.has(k)) return `Duplicate parameter: ${k}`;
    seen.add(k);
  }
  const g = (k: string) => url.searchParams.get(k) ?? undefined;
  const view = g("view");
  if (!view) return "view is required";
  if (!VIEWS.includes(view)) return "Unknown view";
  const id = g("id");
  if (id !== undefined && !UUID.test(id)) return "id must be a uuid";
  if ((view === "job" || view === "proposal" || view === "session") && !id) return "id is required for this view";
  const q = g("q");
  if (q !== undefined && q.length > 200) return "q must be at most 200 characters";
  for (const k of ["from", "to"]) {
    const v = g(k);
    if (v !== undefined && (!DATE.test(v) || isNaN(Date.parse(v + "T00:00:00Z")))) return `${k} must be YYYY-MM-DD`;
  }
  const status = g("status");
  if (status !== undefined && status.length > 40) return "status must be at most 40 characters";
  let limit = 50;
  const l = g("limit");
  if (l !== undefined) {
    if (!/^\d+$/.test(l)) return "limit must be an integer 1-200";
    limit = Number(l);
    if (limit < 1 || limit > 200) return "limit must be an integer 1-200";
  }
  return { view, id, q, from: g("from"), to: g("to"), status, limit };
}

// PostgREST or-filter safe term: strip characters with filter meaning.
const ilikeTerm = (q: string) => `%${q.replace(/[%_,().*\\:"']/g, " ").trim()}%`;

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function authenticate(req: Request, db: SupabaseClient): Promise<boolean> {
  const h = req.headers.get("Authorization") ?? "";
  const m = /^Bearer (.+)$/.exec(h);
  if (!m) return false;
  const key = m[1].trim();
  if (key.length < 16 || key.length > 512) return false;
  const hash = await sha256Hex(key);
  const { data, error } = await db
    .from("pixel_access")
    .select("id, key_sha256")
    .eq("key_sha256", hash)
    .is("revoked_at", null)
    .maybeSingle();
  if (error || !data) return false;
  if (!(await secretEquals(hash, data.key_sha256))) return false;
  await db.from("pixel_access").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return true;
}

const countBy = (rows: { [k: string]: unknown }[], key: string) => {
  const m = new Map<string, number>();
  for (const r of rows) { const v = r[key] as string | null; if (v) m.set(v, (m.get(v) ?? 0) + 1); }
  return m;
};
const today = () => new Date().toISOString().slice(0, 10);

// ---------- proposals ----------
const PROPOSAL_COLS =
  "id, event_name, client_name, venue_name, event_date, quote_date, validity_days, contact_email, client_email, status, signed_at, sent_at, notes, created_by, created_at, updated_at, is_active, drive_folder_url, drive_folder_id, creative_call_url, is_pre_call_packet, proposal_scenario, assigned_pm_id, assigned_pm_name, assigned_pm_email, job_id, signoff_due_on, discount_type, discount_value, discount_label, reminder_due_sent_at, reminder_lapsed_sent_at";
const ITEM_COLS = "id, proposal_id, title, description, category, unit, quantity, price, is_flat_fee, client_selected, sort_order";

type Item = { id: string; proposal_id: string; price: number; quantity: number; is_flat_fee: boolean; client_selected: boolean; [k: string]: unknown };
type Prop = { id: string; discount_type: string | null; discount_value: number | null; discount_label: string | null; [k: string]: unknown };

function discountOf(p: Prop): ProposalDiscount | null {
  return p.discount_type && p.discount_value
    ? { type: p.discount_type as "percent" | "amount", value: Number(p.discount_value), label: p.discount_label }
    : null;
}
const r2 = (n: number) => Math.round(n * 100) / 100;
function totals(p: Prop, items: Item[]) {
  const discount = discountOf(p);
  const subtotal = r2(items.reduce((s, i) => s + calcLineTotal(i), 0));
  const discount_amount = r2(calcDiscountAmount(subtotal, discount));
  const selSub = r2(calcSubtotal(items, { signed: true }));
  const selDisc = r2(calcDiscountAmount(selSub, discount));
  return {
    subtotal, discount_amount, total: r2(subtotal - discount_amount),
    selected_subtotal: selSub, selected_discount_amount: selDisc, selected_total: r2(selSub - selDisc),
  };
}

async function proposalDetails(db: SupabaseClient, props: Prop[]) {
  if (props.length === 0) return [];
  const ids = props.map((p) => p.id);
  const [items, timeline, gallery, history] = await Promise.all([
    db.from("proposal_items").select(ITEM_COLS).in("proposal_id", ids).order("sort_order", { ascending: true, nullsFirst: false }),
    db.from("proposal_timeline").select("proposal_id, phase, duration, details, sort_order").in("proposal_id", ids).order("sort_order", { ascending: true, nullsFirst: false }),
    db.from("proposal_gallery").select("proposal_id, image_url, caption, sort_order").in("proposal_id", ids).order("sort_order", { ascending: true, nullsFirst: false }),
    db.from("proposal_signature_history").select("proposal_id, signed_at, total, selected_item_ids").in("proposal_id", ids).order("signed_at", { ascending: false }),
  ]).then((rs) => rs.map((r) => must<Record<string, unknown>[]>(r)));
  const strip = (rows: Record<string, unknown>[], pid: string) =>
    rows.filter((r) => r.proposal_id === pid).map(({ proposal_id: _p, ...rest }) => rest);
  return props.map((p) => {
    const its = (items as Item[]).filter((i) => i.proposal_id === p.id);
    return {
      ...p,
      discount: discountOf(p),
      line_items: its.map(({ proposal_id: _p, id: _id, ...i }) => ({ ...i, line_total: r2(calcLineTotal(i as Item)) })),
      totals: totals(p, its),
      timeline: strip(timeline, p.id),
      gallery: strip(gallery, p.id),
      signature_history: history.filter((h) => h.proposal_id === p.id).map((h) => ({
        signed_at: h.signed_at, total: h.total, selected_items: Array.isArray(h.selected_item_ids) ? h.selected_item_ids.length : 0,
      })),
    };
  });
}

// ---------- sessions ----------
const SESSION_COLS =
  "id, project_name, client_name, circleback_url, circleback_summary, technical_notes, creative_notes, created_by, created_at, updated_at, is_active, cover_images, cover_themes, cover_generated_at, featured_images, is_public, dropbox_url, event_date, proposal_id, show_previz, brief_enabled, job_id";

async function sessionDetails(db: SupabaseClient, sessions: Record<string, unknown>[]) {
  if (sessions.length === 0) return [];
  const ids = sessions.map((s) => s.id as string);
  const [scenes, briefs, signoffs, items] = await Promise.all([
    db.from("session_scenes").select("id, session_id, title, description, sort_order").in("session_id", ids).order("sort_order", { ascending: true, nullsFirst: false }),
    db.from("creative_briefs").select("creative_session_id, mood, vibe, color_scheme, avoid, elevator_mode, elevator_up, elevator_down, transforms_to_party, looks_count, notes, submitted_at, reviewed_at, created_at, updated_at").in("creative_session_id", ids),
    db.from("creative_session_signoffs").select("session_id, signer_name, created_at, approved_item_ids").in("session_id", ids).order("created_at", { ascending: false }),
    db.from("mood_board_items").select("id, session_id, title, item_type, url, thumbnail_url, description, scene_id, sort_order").in("session_id", ids).order("sort_order", { ascending: true, nullsFirst: false }),
  ]).then((rs) => rs.map((r) => must<Record<string, unknown>[]>(r)));
  const itemIds = items.map((i) => i.id as string);
  let comments: Record<string, unknown>[] = [];
  let reactions: Record<string, unknown>[] = [];
  if (itemIds.length) {
    [comments, reactions] = await Promise.all([
      db.from("mood_board_comments").select("item_id, commenter_name, content, created_at").in("item_id", itemIds).order("created_at"),
      db.from("mood_board_reactions").select("item_id").in("item_id", itemIds),
    ]).then((rs) => rs.map((r) => must<Record<string, unknown>[]>(r)));
  }
  const sceneTitle = new Map(scenes.map((s) => [s.id as string, s.title as string]));
  const cCount = countBy(comments, "item_id");
  const rCount = countBy(reactions, "item_id");
  return sessions.map((s) => ({
    ...s,
    scenes: scenes.filter((x) => x.session_id === s.id).map(({ session_id: _s, ...r }) => r),
    creative_briefs: briefs.filter((b) => b.creative_session_id === s.id).map(({ creative_session_id: _c, ...r }) => r),
    signoffs: signoffs.filter((x) => x.session_id === s.id).map((x) => ({
      signer_name: x.signer_name, created_at: x.created_at, approved_items: Array.isArray(x.approved_item_ids) ? x.approved_item_ids.length : 0,
    })),
    mood_board_items: items.filter((i) => i.session_id === s.id).map((i) => ({
      title: i.title, item_type: i.item_type, url: i.url, thumbnail_url: i.thumbnail_url, description: i.description,
      scene: i.scene_id ? sceneTitle.get(i.scene_id as string) ?? null : null,
      comment_count: cCount.get(i.id as string) ?? 0,
      reaction_count: rCount.get(i.id as string) ?? 0,
      comments: comments.filter((c) => c.item_id === i.id).map(({ item_id: _i, ...c }) => c),
    })),
  }));
}

// ---------- calendar ----------
async function calendarForUids(db: SupabaseClient, uids: string[]) {
  if (uids.length === 0) return [];
  const sel = (t: string, cols: string) => db.from(t).select(cols).in(t === "calendar_local_events" ? "uid" : "event_uid", uids);
  const [local, brief, notes, tasks, client, links, meta, assoc] = await Promise.all([
    sel("calendar_local_events", "uid, summary, description, location, dtstart, dtend, status, created_at, updated_at"),
    sel("calendar_event_brief", "event_uid, group_name, event_date_text, event_time_text, guest_count, location, deadline_on, additional_notes, updated_at"),
    sel("calendar_event_notes", "event_uid, content, created_at, updated_at"),
    sel("calendar_event_tasks", "event_uid, title, is_completed, sort_order, updated_at"),
    sel("calendar_event_client_info", "event_uid, client_contact_name, client_contact_email, client_contact_phone, loading_fee_notes, content_deadline, deadline_notes, reminder_days, updated_at"),
    sel("calendar_event_meeting_links", "event_uid, label, url, link_type, meeting_at, duration_minutes, attendees"),
    sel("calendar_event_metadata", "event_uid, status_override, color_label, custom_notes, updated_at"),
    sel("calendar_event_associations", "event_uid, entity_type, entity_id, created_at"),
  ]).then((rs) => rs.map((r) => must<Record<string, unknown>[]>(r)));
  const pick = (rows: Record<string, unknown>[], uid: string) =>
    rows.filter((r) => r.event_uid === uid).map(({ event_uid: _e, ...r }) => r);
  return uids.map((uid) => ({
    event_uid: uid,
    local_event: local.find((l) => l.uid === uid) ?? null,
    brief: pick(brief, uid)[0] ?? null,
    notes: pick(notes, uid),
    tasks: pick(tasks, uid).sort((a, b) => Number(a.sort_order ?? 1e9) - Number(b.sort_order ?? 1e9)),
    client_info: pick(client, uid)[0] ?? null,
    meeting_links: pick(links, uid),
    metadata: pick(meta, uid)[0] ?? null,
    associations: pick(assoc, uid),
  }));
}

// ---------- views ----------
async function viewSummary(db: SupabaseClient) {
  const [jobs, props, sessions, packets, next] = await Promise.all([
    db.from("jobs").select("id", { count: "exact", head: true }).eq("is_active", true),
    db.from("proposals").select("status"),
    db.from("creative_sessions").select("is_active"),
    db.from("pre_call_packets").select("is_active"),
    db.from("jobs").select("id, title, client_name, event_date, track, status, is_active").gte("event_date", today()).order("event_date").limit(10),
  ]);
  if (jobs.error) throw new ApiError("Query failed");
  const p = must<{ status: string }[]>(props);
  const s = must<{ is_active: boolean }[]>(sessions);
  const k = must<{ is_active: boolean }[]>(packets);
  return {
    active_jobs: jobs.count ?? 0,
    proposals_by_status: Object.fromEntries(countBy(p, "status")),
    sessions: { total: s.length, active: s.filter((x) => x.is_active).length },
    packets: { total: k.length, active: k.filter((x) => x.is_active).length },
    next_jobs: must(next),
  };
}

async function linkCounts(db: SupabaseClient, jobIds: string[]) {
  if (!jobIds.length) return { p: new Map(), s: new Map(), k: new Map() };
  const [p, s, k] = await Promise.all([
    db.from("proposals").select("job_id").in("job_id", jobIds),
    db.from("creative_sessions").select("job_id").in("job_id", jobIds),
    db.from("pre_call_packets").select("job_id").in("job_id", jobIds),
  ]).then((rs) => rs.map((r) => countBy(must<Record<string, unknown>[]>(r), "job_id")));
  return { p, s, k };
}

async function viewJobs(db: SupabaseClient, P: Params) {
  let q = db.from("jobs").select("id, title, client_name, event_date, track, status, is_active, call_held_on, drive_folder_url, updated_at");
  if (P.q) { const t = ilikeTerm(P.q); q = q.or(`title.ilike.${t},client_name.ilike.${t}`); }
  if (P.from) q = q.gte("event_date", P.from);
  if (P.to) q = q.lte("event_date", P.to);
  if (P.status) q = q.eq("status", P.status);
  const rows = must<Record<string, unknown>[]>(await q.order("event_date", { ascending: true, nullsFirst: false }).limit(P.limit));
  const c = await linkCounts(db, rows.map((r) => r.id as string));
  return rows.map((r) => ({
    ...r,
    proposal_count: c.p.get(r.id) ?? 0, session_count: c.s.get(r.id) ?? 0, packet_count: c.k.get(r.id) ?? 0,
  }));
}

async function viewJob(db: SupabaseClient, id: string) {
  const job = must<Record<string, unknown> | null>(await db.from("jobs")
    .select("id, title, client_name, event_date, track, status, status_changed_at, is_active, call_held_on, drive_folder_id, drive_folder_url, notes, created_at, updated_at")
    .eq("id", id).maybeSingle());
  if (!job) return null;
  const [assignees, props, sessions, packets, assoc] = await Promise.all([
    db.from("job_assignees").select("display_name, email").eq("job_id", id),
    db.from("proposals").select(PROPOSAL_COLS).eq("job_id", id).order("created_at"),
    db.from("creative_sessions").select(SESSION_COLS).eq("job_id", id).order("created_at"),
    db.from("pre_call_packets").select("id, title, kind, event_date, intro, inclusions, scope, notes, is_active, drive_folder_url, creative_guide_url, deploy_notified_at, created_at, updated_at").eq("job_id", id).order("created_at"),
    db.from("calendar_event_associations").select("event_uid").eq("entity_id", id),
  ]);
  const uids = [...new Set(must<{ event_uid: string }[]>(assoc).map((a) => a.event_uid))];
  return {
    ...job,
    assignees: must(assignees),
    proposals: await proposalDetails(db, must<Prop[]>(props)),
    creative_sessions: await sessionDetails(db, must<Record<string, unknown>[]>(sessions)),
    pre_call_packets: must(packets),
    calendar_events: await calendarForUids(db, uids),
  };
}

async function viewProposals(db: SupabaseClient, P: Params) {
  let q = db.from("proposals").select("id, event_name, client_name, venue_name, event_date, quote_date, status, sent_at, signed_at, job_id, assigned_pm_name, discount_type, discount_value, discount_label");
  if (P.q) { const t = ilikeTerm(P.q); q = q.or(`event_name.ilike.${t},client_name.ilike.${t},venue_name.ilike.${t}`); }
  if (P.from) q = q.gte("event_date", P.from);
  if (P.to) q = q.lte("event_date", P.to);
  if (P.status) q = q.eq("status", P.status);
  const rows = must<Prop[]>(await q.order("event_date", { ascending: true, nullsFirst: false }).limit(P.limit));
  const ids = rows.map((r) => r.id);
  const items = ids.length
    ? must<Item[]>(await db.from("proposal_items").select("proposal_id, price, quantity, is_flat_fee, client_selected").in("proposal_id", ids))
    : [];
  return rows.map(({ discount_type: _t, discount_value: _v, discount_label: _l, ...r }) => {
    const t = totals(rows.find((x) => x.id === r.id)!, items.filter((i) => i.proposal_id === r.id));
    // Signed proposals: what the client agreed to. Unsigned: full quote.
    return { ...r, total: r.signed_at ? t.selected_total : t.total };
  });
}

async function viewSessions(db: SupabaseClient, P: Params) {
  let q = db.from("creative_sessions").select("id, project_name, client_name, event_date, job_id, proposal_id, is_active, updated_at");
  if (P.q) { const t = ilikeTerm(P.q); q = q.or(`project_name.ilike.${t},client_name.ilike.${t}`); }
  return must(await q.order("event_date", { ascending: true, nullsFirst: false }).limit(P.limit));
}

async function viewContacts(db: SupabaseClient, P: Params) {
  const [props, assignees, info, assoc, jobs] = await Promise.all([
    db.from("proposals").select("id, event_name, job_id, client_name, client_email, contact_email, assigned_pm_name, assigned_pm_email"),
    db.from("job_assignees").select("job_id, display_name, email"),
    db.from("calendar_event_client_info").select("event_uid, client_contact_name, client_contact_email, client_contact_phone"),
    db.from("calendar_event_associations").select("event_uid, entity_type, entity_id"),
    db.from("jobs").select("id, title, client_name"),
  ]).then((rs) => rs.map((r) => must<Record<string, unknown>[]>(r)));
  const jobTitle = new Map(jobs.map((j) => [j.id as string, j.title as string]));
  type C = { name: string | null; company: string | null; email: string | null; phone: string | null; role: string; sources: Record<string, unknown>[] };
  const map = new Map<string, C>();
  const add = (role: string, name: unknown, company: unknown, email: unknown, phone: unknown, source: Record<string, unknown>) => {
    const e = typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;
    const n = typeof name === "string" && name.trim() ? name.trim() : null;
    if (!e && !n && !phone) return;
    const key = `${role}|${e ?? ""}|${e ? "" : (n ?? "").toLowerCase()}`;
    const c = map.get(key) ?? { name: n, company: (company as string) ?? null, email: e, phone: (phone as string) ?? null, role, sources: [] };
    c.name ??= n; c.phone ??= (phone as string) ?? null; c.company ??= (company as string) ?? null;
    c.sources.push(source);
    map.set(key, c);
  };
  for (const p of props) {
    const src = { proposal_id: p.id, event_name: p.event_name, job_id: p.job_id, job_title: p.job_id ? jobTitle.get(p.job_id as string) ?? null : null };
    if (p.client_email) add("client", null, p.client_name, p.client_email, null, src);
    if (p.contact_email) add("client", null, p.client_name, p.contact_email, null, src);
    if (!p.client_email && !p.contact_email && p.client_name) add("company", null, p.client_name, null, null, src);
    if (p.assigned_pm_name || p.assigned_pm_email) add("project_manager", p.assigned_pm_name, null, p.assigned_pm_email, null, src);
  }
  for (const a of assignees) add("job_assignee", a.display_name, null, a.email, null, { job_id: a.job_id, job_title: jobTitle.get(a.job_id as string) ?? null });
  for (const i of info) {
    const linked = assoc.filter((a) => a.event_uid === i.event_uid).map((a) => ({ entity_type: a.entity_type, entity_id: a.entity_id }));
    add("event_client_contact", i.client_contact_name, null, i.client_contact_email, i.client_contact_phone, { event_uid: i.event_uid, linked });
  }
  let out = [...map.values()];
  if (P.q) {
    const t = P.q.toLowerCase();
    out = out.filter((c) => [c.name, c.company, c.email, c.phone].some((v) => v?.toLowerCase().includes(t)));
  }
  return out.slice(0, P.limit);
}

async function viewCalendar(db: SupabaseClient, P: Params) {
  let q = db.from("calendar_local_events").select("uid");
  if (P.from) q = q.gte("dtstart", P.from);
  if (P.to) q = q.lte("dtstart", P.to + "T23:59:59");
  const [local, meta, assoc] = await Promise.all([
    q.order("dtstart").limit(P.limit),
    db.from("calendar_event_metadata").select("event_uid"),
    db.from("calendar_event_associations").select("event_uid"),
  ]).then((rs) => rs.map((r) => must<Record<string, string>[]>(r)));
  const localUids = local.map((l) => l.uid);
  const others = [...new Set([...meta, ...assoc].map((r) => r.event_uid))].filter((u) => !localUids.includes(u));
  return {
    local_events: await calendarForUids(db, localUids),
    tracked_events: await calendarForUids(db, others),
  };
}

async function viewTemplates(db: SupabaseClient) {
  return must(await db.from("line_item_templates")
    .select("id, title, description, long_description, price, category, deliverables, ideal_for, sort_order, created_at")
    .order("category").order("sort_order", { ascending: true, nullsFirst: false }));
}

Deno.serve(async (req) => {
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    if (!(await authenticate(req, db))) return unauthorized();
  } catch {
    return unauthorized();
  }
  const P = parseParams(new URL(req.url));
  if (typeof P === "string") return bad(P);
  try {
    let data: unknown;
    switch (P.view) {
      case "summary": data = await viewSummary(db); break;
      case "jobs": data = await viewJobs(db, P); break;
      case "job": data = await viewJob(db, P.id!); break;
      case "proposals": data = await viewProposals(db, P); break;
      case "proposal": {
        const row = must<Prop | null>(await db.from("proposals").select(PROPOSAL_COLS).eq("id", P.id!).maybeSingle());
        data = row ? (await proposalDetails(db, [row]))[0] : null; break;
      }
      case "sessions": data = await viewSessions(db, P); break;
      case "session": {
        const row = must<Record<string, unknown> | null>(await db.from("creative_sessions").select(SESSION_COLS).eq("id", P.id!).maybeSingle());
        data = row ? (await sessionDetails(db, [row]))[0] : null; break;
      }
      case "contacts": data = await viewContacts(db, P); break;
      case "calendar": data = await viewCalendar(db, P); break;
      case "templates": data = await viewTemplates(db); break;
    }
    if (data === null) return json(404, { error: "Not found" });
    return json(200, { build: BUILD, view: P.view, data });
  } catch (e) {
    console.error("pixel view failed", P.view, e instanceof Error ? e.message : "");
    return bad("Request failed");
  }
});
