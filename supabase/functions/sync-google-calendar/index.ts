/**
 * Soleia's confirmed bookings, written into the studio's Google Calendar (owner, 2026-09-14):
 * "soleia booked events - gets added to google account", and "SOLEIA calendar is the only
 * calendar adding to google". Until now Google carried the raw Tripleseat feed as a
 * subscription, under Tripleseat's names ("[D] CR - Travcon 2026") and on a calendar the
 * studio's other apps could not read. That subscription is removed once this runs.
 *
 * What is written, and how:
 * - Definite bookings only: the ones Soleia's calendar marks DEFINITE -- a status override,
 *   else the [D] tag, else the feed's own STATUS, as `getEventStatus` in AdminCalendar.tsx.
 * - Named as Soleia names them, "MM.DD.YY Client - Event" (`_shared/eventName.ts`, the Deno
 *   copy of src/lib/eventName.ts), from the booking's job title and Tripleseat's event date.
 * - On the connected Google account's own calendar ("primary"), through Lovable's Google
 *   Calendar connector. Each booking has a fixed event id made from its feed UID, so a run
 *   updates what an earlier run wrote instead of adding a second copy.
 * - A booking that stops being definite, or leaves the feed, is taken off Google again -- but
 *   only when the feed was read whole, and never for a show already past.
 *
 * `?dry=1` reports what a run would do and writes nothing.
 *
 * (No backslash escapes in this file: line breaks and backslashes are built from char codes.)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { eventDisplayName } from "../_shared/eventName.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_calendar";
const CALENDAR = "primary";
/** Tripleseat writes Soleia's bookings in Las Vegas time. */
const VENUE_ZONE = "America/Los_Angeles";
/** Private properties on every event this function writes: a marker to list them by, and the booking. */
const MARK_KEY = "soleiaSync";
const UID_KEY = "soleiaBookingUid";
const DAY_MS = 24 * 60 * 60 * 1000;
/** Bookings that started more than this long ago are left as they are on Google. */
const HISTORY_DAYS = 30;

const CR = String.fromCharCode(13);
const LF = String.fromCharCode(10);
const TAB = String.fromCharCode(9);
const BACKSLASH = String.fromCharCode(92);

interface FeedTime { wall: string; zone: string | null; allDay: boolean; utc: boolean }
interface Booking {
  uid: string;
  summary: string;
  description: string;
  location: string;
  status: string;
  start: FeedTime | null;
  end: FeedTime | null;
}

// --- The Tripleseat feed, read as fetch-ical reads it, keeping each time's zone -------------

function unfoldedLines(text: string): string[] {
  const lines: string[] = [];
  for (const line of text.split(CR).join("").split(LF)) {
    if ((line.startsWith(" ") || line.startsWith(TAB)) && lines.length) lines[lines.length - 1] += line.slice(1);
    else lines.push(line);
  }
  return lines;
}

function unescapeText(value: string): string {
  return value
    .split(BACKSLASH + "n").join(LF)
    .split(BACKSLASH + "N").join(LF)
    .split(BACKSLASH + ",").join(",")
    .split(BACKSLASH + ";").join(";")
    .split(BACKSLASH + BACKSLASH).join(BACKSLASH);
}

function feedTime(params: string, value: string): FeedTime | null {
  const zone = /(?:^|;)TZID=([^;:]+)/i.exec(params)?.[1] ?? null;
  const hit = /^([0-9]{4})([0-9]{2})([0-9]{2})(?:T([0-9]{2})([0-9]{2})([0-9]{2})(Z)?)?$/.exec(value.trim());
  if (!hit) return null;
  const date = `${hit[1]}-${hit[2]}-${hit[3]}`;
  if (!hit[4]) return { wall: date, zone: null, allDay: true, utc: false };
  return { wall: `${date}T${hit[4]}:${hit[5]}:${hit[6]}`, zone, allDay: false, utc: Boolean(hit[7]) };
}

function parseFeed(text: string): Booking[] {
  const bookings: Booking[] = [];
  let current: Booking | null = null;
  for (const line of unfoldedLines(text)) {
    if (line === "BEGIN:VEVENT") {
      current = { uid: "", summary: "Untitled Event", description: "", location: "", status: "", start: null, end: null };
      continue;
    }
    if (line === "END:VEVENT") {
      if (current?.uid) bookings.push(current);
      current = null;
      continue;
    }
    if (!current) continue;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const head = line.slice(0, colon);
    const value = line.slice(colon + 1);
    const semi = head.indexOf(";");
    const name = (semi === -1 ? head : head.slice(0, semi)).toUpperCase();
    const params = semi === -1 ? "" : head.slice(semi + 1);
    if (name === "UID") current.uid = value.trim();
    else if (name === "SUMMARY") current.summary = unescapeText(value);
    else if (name === "DESCRIPTION") current.description = unescapeText(value);
    else if (name === "LOCATION") current.location = unescapeText(value);
    else if (name === "STATUS") current.status = value.trim();
    else if (name === "DTSTART") current.start = feedTime(params, value);
    else if (name === "DTEND") current.end = feedTime(params, value);
  }
  return bookings;
}

/** `getEventStatus` in src/pages/AdminCalendar.tsx, over the same inputs. */
function statusOf(booking: Booking, override: string | undefined): string {
  if (override) return override;
  const tag = booking.summary.slice(0, 3).toUpperCase();
  if (tag === "[D]") return "definite";
  if (tag === "[T]") return "tentative";
  if (tag === "[P]") return "prospect";
  if (tag === "[C]") return "cancelled";
  const status = booking.status.toLowerCase();
  if (status.includes("confirm") || status.includes("definite")) return "definite";
  if (status.includes("tentative")) return "tentative";
  if (status.includes("cancel")) return "cancelled";
  return "prospect";
}

/** The start the way fetch-ical hands it to the calendar screen, so the name's day matches Soleia's. */
function namingStart(time: FeedTime): string {
  return time.allDay ? `${time.wall}T00:00:00` : time.wall;
}

// --- What Soleia knows about each booking ------------------------------------------------------

const VIA_RECORD = ["proposal", "packet", "creative_session"];

/** The job titles each booking is linked to, reached as `loadEventLinks` in src/lib/eventJobs.ts reaches them. */
async function jobTitlesByEvent(supabase: SupabaseClient): Promise<Map<string, string[]>> {
  const { data: assocs, error } = await supabase.from("calendar_event_associations").select("event_uid, entity_type, entity_id");
  if (error) throw new Error(`calendar_event_associations: ${error.message}`);
  const links = (assocs ?? []) as { event_uid: string; entity_type: string; entity_id: string }[];
  const idsOf = (type: string) => [...new Set(links.filter((a) => a.entity_type === type).map((a) => a.entity_id))];
  const tables: Record<string, string> = { proposal: "proposals", packet: "pre_call_packets", creative_session: "creative_sessions" };
  const jobOfRecord = new Map<string, string>();
  for (const type of VIA_RECORD) {
    const ids = idsOf(type);
    if (!ids.length) continue;
    const { data, error: readError } = await supabase.from(tables[type]).select("id, job_id").in("id", ids);
    if (readError) throw new Error(`${tables[type]}: ${readError.message}`);
    ((data ?? []) as { id: string; job_id: string | null }[]).forEach((row) => { if (row.job_id) jobOfRecord.set(row.id, row.job_id); });
  }
  const jobIdsByEvent = new Map<string, Set<string>>();
  for (const link of links) {
    const jobId = link.entity_type === "job" ? link.entity_id : VIA_RECORD.includes(link.entity_type) ? jobOfRecord.get(link.entity_id) : undefined;
    if (!jobId) continue;
    const held = jobIdsByEvent.get(link.event_uid) ?? new Set<string>();
    held.add(jobId);
    jobIdsByEvent.set(link.event_uid, held);
  }
  const allJobIds = [...new Set([...jobIdsByEvent.values()].flatMap((ids) => [...ids]))];
  const titles = new Map<string, string>();
  if (allJobIds.length) {
    const { data, error: jobError } = await supabase.from("jobs").select("id, title").in("id", allJobIds);
    if (jobError) throw new Error(`jobs: ${jobError.message}`);
    ((data ?? []) as { id: string; title: string }[]).forEach((job) => titles.set(job.id, job.title));
  }
  const result = new Map<string, string[]>();
  jobIdsByEvent.forEach((ids, uid) => result.set(uid, [...ids].filter((id) => titles.has(id)).map((id) => titles.get(id)!)));
  return result;
}

async function tripleseatDates(supabase: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await supabase.from("calendar_event_tripleseat_cache").select("event_uid, scraped_data");
  if (error) throw new Error(`calendar_event_tripleseat_cache: ${error.message}`);
  const days = new Map<string, string>();
  ((data ?? []) as { event_uid: string; scraped_data: { event_date?: string } | null }[]).forEach((row) => {
    if (row.scraped_data?.event_date) days.set(row.event_uid, row.scraped_data.event_date);
  });
  return days;
}

async function statusOverrides(supabase: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await supabase.from("calendar_event_metadata").select("event_uid, status_override");
  if (error) throw new Error(`calendar_event_metadata: ${error.message}`);
  const map = new Map<string, string>();
  ((data ?? []) as { event_uid: string; status_override: string | null }[]).forEach((row) => {
    if (row.status_override) map.set(row.event_uid, row.status_override);
  });
  return map;
}

// --- Google Calendar, through Lovable's connector ---------------------------------------------

function connectorKeys() {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY")?.trim() ?? "";
  const calendarKey = Deno.env.get("GOOGLE_CALENDAR_API_KEY")?.trim() ?? "";
  if (!lovableKey || !calendarKey) {
    throw new Error("Google Calendar is not connected: LOVABLE_API_KEY and GOOGLE_CALENDAR_API_KEY are both required");
  }
  return { lovableKey, calendarKey };
}

async function calendarFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { lovableKey, calendarKey } = connectorKeys();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${lovableKey}`);
  headers.set("X-Connection-Api-Key", calendarKey);
  if (init.body) headers.set("Content-Type", "application/json");
  return fetch(`${GATEWAY}/calendar/v3${path}`, { ...init, headers });
}

async function calendarJson(path: string, init: RequestInit = {}): Promise<any> {
  const response = await calendarFetch(path, init);
  const text = await response.text();
  if (!response.ok) throw Object.assign(new Error(`Google Calendar ${init.method ?? "GET"} ${path.split("?")[0]} [${response.status}]: ${text.slice(0, 300)}`), { status: response.status });
  return text ? JSON.parse(text) : null;
}

/**
 * Every event an earlier run wrote, keyed by booking UID, and the calendar they sit on. Google
 * titles a primary calendar with its account's address, so the report says which account the
 * connector writes to -- read before any write, not assumed.
 */
async function eventsWritten(): Promise<{ found: Map<string, any>; calendar: string }> {
  const found = new Map<string, any>();
  let calendar = "";
  let pageToken = "";
  do {
    const query = new URLSearchParams({ privateExtendedProperty: `${MARK_KEY}=1`, maxResults: "2500", singleEvents: "true", showDeleted: "false" });
    if (pageToken) query.set("pageToken", pageToken);
    const page = await calendarJson(`/calendars/${CALENDAR}/events?${query}`);
    calendar ||= String(page?.summary ?? "");
    for (const event of page?.items ?? []) {
      const uid = event.extendedProperties?.private?.[UID_KEY];
      if (uid) found.set(uid, event);
    }
    pageToken = page?.nextPageToken ?? "";
  } while (pageToken);
  return { found, calendar };
}

/** A Google event id may use 0-9 and a-v only; hex qualifies, and so does "soleia". */
async function eventIdFor(uid: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(uid)));
  return "soleia" + [...digest.slice(0, 20)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function googleTime(time: FeedTime) {
  if (time.allDay) return { date: time.wall };
  if (time.utc) return { dateTime: `${time.wall}Z`, timeZone: VENUE_ZONE };
  return { dateTime: time.wall, timeZone: time.zone ?? VENUE_ZONE };
}

function dayAfter(date: string): string {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

const FOOTER = "From Soleia Creative's calendar. Change the booking in Soleia or Tripleseat: an edit made here is replaced on the next sync.";

function desiredEvent(booking: Booking, name: string) {
  const start = booking.start!;
  const end = booking.end ?? start;
  return {
    summary: name,
    location: booking.location,
    description: booking.description.trim() ? `${booking.description.trim()}${LF}${LF}${FOOTER}` : FOOTER,
    start: googleTime(start),
    end: start.allDay && (!booking.end || end.wall <= start.wall) ? { date: dayAfter(start.wall) } : googleTime(end),
    status: "confirmed",
    extendedProperties: { private: { [MARK_KEY]: "1", [UID_KEY]: booking.uid } },
  };
}

/** Compare the parts this function writes; Google adds offsets and fields of its own. */
function sameEvent(existing: any, wanted: ReturnType<typeof desiredEvent>): boolean {
  const time = (value: any) => value?.date ?? String(value?.dateTime ?? "").slice(0, 19);
  const wantTime = (value: any) => value?.date ?? String(value?.dateTime ?? "").slice(0, 19);
  return existing.summary === wanted.summary
    && (existing.location ?? "") === wanted.location
    && (existing.description ?? "") === wanted.description
    && time(existing.start) === wantTime(wanted.start)
    && time(existing.end) === wantTime(wanted.end)
    && (existing.start?.timeZone ?? null) === ((wanted.start as { timeZone?: string }).timeZone ?? null);
}

function startMs(time: FeedTime): number {
  return Date.parse(time.allDay ? `${time.wall}T00:00:00Z` : time.utc ? `${time.wall}Z` : `${time.wall}Z`) || 0;
}

// --- The run ------------------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const report = {
    dry, calendar: "", feed: 0, definite: 0, inWindow: 0, olderLeftAlone: 0,
    created: [] as string[], updated: [] as string[], unchanged: 0, removed: [] as string[], failed: [] as string[],
  };
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: setting } = await supabase.from("site_settings").select("value").eq("key", "tripleseat_ical_url").maybeSingle();
    if (!setting?.value) throw new Error("No iCal URL configured");
    const feedResponse = await fetch(setting.value);
    if (!feedResponse.ok) throw new Error(`Failed to fetch iCal feed: ${feedResponse.status}`);
    const bookings = parseFeed(await feedResponse.text());
    report.feed = bookings.length;
    // An empty or unreadable feed is not "no bookings": nothing is written or removed on it.
    if (!bookings.length) throw new Error("The feed returned no bookings; nothing was changed");

    const [titles, dates, overrides, onGoogle] = await Promise.all([
      jobTitlesByEvent(supabase), tripleseatDates(supabase), statusOverrides(supabase), eventsWritten(),
    ]);
    const written = onGoogle.found;
    report.calendar = onGoogle.calendar;

    const since = Date.now() - HISTORY_DAYS * DAY_MS;
    const now = Date.now();
    const wanted = new Set<string>();
    for (const booking of bookings) {
      if (!booking.start || statusOf(booking, overrides.get(booking.uid)) !== "definite") continue;
      report.definite += 1;
      if (startMs(booking.start) < since) { report.olderLeftAlone += 1; continue; }
      report.inWindow += 1;
      wanted.add(booking.uid);
      const name = eventDisplayName({
        summary: booking.summary,
        dtstart: namingStart(booking.start),
        tripleseatDate: dates.get(booking.uid),
        jobTitles: titles.get(booking.uid),
      });
      const event = desiredEvent(booking, name);
      const existing = written.get(booking.uid);
      if (existing && sameEvent(existing, event)) { report.unchanged += 1; continue; }
      if (dry) { (existing ? report.updated : report.created).push(name); continue; }
      const id = existing?.id ?? await eventIdFor(booking.uid);
      try {
        if (existing) {
          await calendarJson(`/calendars/${CALENDAR}/events/${encodeURIComponent(id)}?sendUpdates=none`, { method: "PUT", body: JSON.stringify(event) });
          report.updated.push(name);
        } else {
          try {
            await calendarJson(`/calendars/${CALENDAR}/events?sendUpdates=none`, { method: "POST", body: JSON.stringify({ id, ...event }) });
          } catch (error) {
            // 409: the id exists but was not listed -- an event deleted on Google. Writing it again restores it.
            if ((error as { status?: number }).status !== 409) throw error;
            await calendarJson(`/calendars/${CALENDAR}/events/${encodeURIComponent(id)}?sendUpdates=none`, { method: "PUT", body: JSON.stringify(event) });
          }
          report.created.push(name);
        }
      } catch (error) {
        report.failed.push(`${name}: ${(error as Error).message}`);
      }
    }

    // Taken off Google: an upcoming booking this function wrote that is no longer a definite booking in the feed.
    for (const [uid, event] of written) {
      if (wanted.has(uid)) continue;
      const start = Date.parse(event.start?.dateTime ?? `${event.start?.date}T00:00:00Z`) || 0;
      if (start < now) continue;
      if (dry) { report.removed.push(event.summary); continue; }
      try {
        await calendarJson(`/calendars/${CALENDAR}/events/${encodeURIComponent(event.id)}?sendUpdates=none`, { method: "DELETE" });
        report.removed.push(event.summary);
      } catch (error) {
        report.failed.push(`remove ${event.summary}: ${(error as Error).message}`);
      }
    }

    return new Response(JSON.stringify(report), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("sync-google-calendar:", (error as Error).message);
    return new Response(JSON.stringify({ ...report, error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
