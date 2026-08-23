/**
 * Pull the useful parts out of a pasted meeting invite.
 *
 * A PM pastes whatever the client sent — a Zoom block, a Teams footer, a line
 * from an email — and what the calendar needs from it is three things: the
 * link, when it starts, and how long it runs. Typing those back in by hand is
 * the step this removes.
 *
 * Everything here is best-effort and every field it returns is editable in the
 * form, so a miss costs a correction, never a wrong entry saved silently.
 */

export interface ParsedInvite {
  url: string | null;
  startsAt: Date | null;
  durationMinutes: number | null;
  /** The zone the invite stated, when it stated one. Null means read as local. */
  timeZone: string | null;
  /** How that zone was written in the paste, for showing back to the reader. */
  timeZoneLabel: string | null;
}

/**
 * Zones an invite actually names, and how they are written.
 *
 * A Zoom invite from a Pacific host says "Pacific Time (US and Canada)", and
 * reading its 5:00 pm as local is right in Las Vegas. A client in New York
 * sending "5:00 PM Eastern" is three hours out if the zone is ignored — the
 * meeting would land at the wrong end of the afternoon. Two-letter forms must
 * be uppercase and standalone so a "CT" inside a sentence is not a timezone.
 */
const ZONES: { zone: string; label: string; test: RegExp }[] = [
  { zone: 'America/Los_Angeles', label: 'Pacific', test: /\bpacific\b|\bP[SD]T\b|\bPT\b/ },
  { zone: 'America/Denver', label: 'Mountain', test: /\bmountain\b|\bM[SD]T\b|\bMT\b/ },
  { zone: 'America/Chicago', label: 'Central', test: /\bcentral\b|\bC[SD]T\b|\bCT\b/ },
  { zone: 'America/New_York', label: 'Eastern', test: /\beastern\b|\bE[SD]T\b|\bET\b/ },
  { zone: 'America/Anchorage', label: 'Alaska', test: /\balaska\b|\bAK[SD]T\b/ },
  { zone: 'Pacific/Honolulu', label: 'Hawaii', test: /\bhawaii\b|\bH[SA]T\b/ },
  { zone: 'Europe/London', label: 'UK', test: /\blondon\b|\bBST\b|\bGMT\b/ },
  { zone: 'Europe/Paris', label: 'Central European', test: /\bparis\b|\bCE[SD]?T\b/ },
  { zone: 'UTC', label: 'UTC', test: /\bUTC\b|\bZulu\b/ },
];

/** The zone an invite names, if any. Case matters only for the abbreviations. */
export function findTimeZone(text: string): { zone: string; label: string } | null {
  const lower = text.toLowerCase();
  for (const candidate of ZONES) {
    // Word forms are matched case-insensitively; abbreviations are not, so a
    // lowercase "ct" in prose cannot pass for Central Time.
    if (candidate.test.test(text) || candidate.test.test(lower)) {
      return { zone: candidate.zone, label: candidate.label };
    }
  }
  return null;
}

/** How far `timeZone` is from UTC at a given instant, in milliseconds. */
function offsetAt(timestamp: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(timestamp));

  const read: Record<string, string> = {};
  for (const part of parts) read[part.type] = part.value;
  const hour = read.hour === '24' ? '0' : read.hour;
  const asUtc = Date.UTC(
    Number(read.year), Number(read.month) - 1, Number(read.day),
    Number(hour), Number(read.minute), Number(read.second),
  );
  return asUtc - timestamp;
}

/**
 * The instant at which a wall-clock time in `timeZone` occurs.
 *
 * Resolved twice because the first offset is read at the wrong instant when the
 * conversion crosses a daylight-saving change; the second pass settles it.
 */
export function wallTimeInZone(
  year: number, month: number, day: number, hours: number, minutes: number, timeZone: string,
): Date {
  const naive = Date.UTC(year, month, day, hours, minutes);
  const first = offsetAt(naive, timeZone);
  const candidate = naive - first;
  const second = offsetAt(candidate, timeZone);
  return new Date(second === first ? candidate : naive - second);
}

/** Hosts worth preferring when a paste contains several links. */
const MEETING_HOSTS = [
  /zoom\.us\/j\//i,
  /zoom\.us\/my\//i,
  /teams\.microsoft\.com\/l\/meetup-join/i,
  // Teams' current share link, which is not the /l/meetup-join/ form the
  // desktop client used to hand out.
  /teams\.microsoft\.com\/meet\//i,
  /teams\.microsoft\.com\/dl\/launcher/i,
  /teams\.live\.com\/meet/i,
  /meet\.google\.com\//i,
  /webex\.com\/(meet|join)/i,
  /whereby\.com\//i,
  /gotomeet(ing)?\./i,
  /chime\.aws\//i,
  /riverside\.fm\//i,
];

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/** Trailing punctuation an email client leaves stuck to a URL. */
const trimUrl = (raw: string) => raw.replace(/[).,;>\]]+$/, '');

export function extractMeetingUrl(text: string): string | null {
  const urls = (text.match(/https?:\/\/[^\s<>"')]+/gi) ?? []).map(trimUrl);
  if (urls.length === 0) return null;
  const preferred = urls.find((u) => MEETING_HOSTS.some((h) => h.test(u)));
  return preferred ?? urls[0];
}

interface DateHit { year: number; month: number; day: number; index: number }

function findDate(text: string): DateHit | null {
  const named = new RegExp(
    `\\b(${MONTHS.map((m) => `${m.slice(0, 3)}[a-z]*`).join('|')})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`,
    'i',
  );
  const namedHit = named.exec(text);
  if (namedHit) {
    const month = MONTHS.findIndex((m) => m.startsWith(namedHit[1].slice(0, 3).toLowerCase()));
    if (month >= 0) {
      return { year: Number(namedHit[3]), month, day: Number(namedHit[2]), index: namedHit.index };
    }
  }

  // "5 October 2026" — Google Calendar writes this for a non-US locale, and it
  // must not be read as May.
  const dayFirst = new RegExp(
    `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTHS.map((m) => `${m.slice(0, 3)}[a-z]*`).join('|')})\\.?,?\\s+(\\d{4})`,
    'i',
  );
  const dayFirstHit = dayFirst.exec(text);
  if (dayFirstHit) {
    const month = MONTHS.findIndex((m) => m.startsWith(dayFirstHit[2].slice(0, 3).toLowerCase()));
    if (month >= 0) {
      return { year: Number(dayFirstHit[3]), month, day: Number(dayFirstHit[1]), index: dayFirstHit.index };
    }
  }

  const isoHit = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(text);
  if (isoHit) {
    return { year: Number(isoHit[1]), month: Number(isoHit[2]) - 1, day: Number(isoHit[3]), index: isoHit.index };
  }

  // US order, which is what every invite reaching this office uses.
  const slashHit = /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/.exec(text);
  if (slashHit) {
    const year = Number(slashHit[3]);
    return {
      year: year < 100 ? 2000 + year : year,
      month: Number(slashHit[1]) - 1,
      day: Number(slashHit[2]),
      index: slashHit.index,
    };
  }

  return null;
}

interface TimeHit { hours: number; minutes: number; index: number; end: number }

function findTimes(text: string, from: number): TimeHit[] {
  const re = /\b(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?/gi;
  const hits: TimeHit[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index < from) continue;
    let hours = Number(match[1]) % 12;
    if (match[3].toLowerCase() === 'p') hours += 12;
    hits.push({ hours, minutes: Number(match[2] ?? 0), index: match.index, end: re.lastIndex });
  }
  if (hits.length) return hits;

  // 24-hour fallback: "17:00", but not a URL fragment or a date.
  const re24 = /\b([01]?\d|2[0-3]):([0-5]\d)\b/g;
  while ((match = re24.exec(text)) !== null) {
    if (match.index < from) continue;
    hits.push({ hours: Number(match[1]), minutes: Number(match[2]), index: match.index, end: re24.lastIndex });
  }
  return hits;
}

export function parseInvite(text: string): ParsedInvite {
  const url = extractMeetingUrl(text);
  const zone = findTimeZone(text);
  const empty = {
    url,
    startsAt: null,
    durationMinutes: null,
    timeZone: zone?.zone ?? null,
    timeZoneLabel: zone?.label ?? null,
  };

  const date = findDate(text);
  if (!date) return empty;

  // Prefer a time written after the date — "October 5, 2026 5:00 PM" — and
  // fall back to any time in the paste, which covers "5:00 PM on Oct 5".
  const after = findTimes(text, date.index);
  const times = after.length ? after : findTimes(text, 0);
  if (times.length === 0) return empty;

  // An invite that names its zone is read in that zone; one that does not is
  // read as local, which is what a Vegas-hosted call looks like.
  const start = zone
    ? wallTimeInZone(date.year, date.month, date.day, times[0].hours, times[0].minutes, zone.zone)
    : new Date(date.year, date.month, date.day, times[0].hours, times[0].minutes, 0, 0);

  let durationMinutes: number | null = null;
  if (times.length > 1) {
    // Only treat the next time as an end time when it reads as a range: the
    // two are separated by a dash or the word "to" and little else.
    const between = text.slice(times[0].end, times[1].index);
    if (/^[\s–—-]*(to|until|till|-|–|—)?[\s]*$/i.test(between)) {
      const end = zone
        ? wallTimeInZone(date.year, date.month, date.day, times[1].hours, times[1].minutes, zone.zone)
        : new Date(date.year, date.month, date.day, times[1].hours, times[1].minutes, 0, 0);
      const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
      if (minutes > 0 && minutes <= 12 * 60) durationMinutes = minutes;
    }
  }

  if (durationMinutes === null) {
    // "60 minutes", "1 hour", "1.5 hrs" — the other way invites state length.
    const mins = /\b(\d{1,3})\s*(?:minutes|minute|mins|min)\b/i.exec(text);
    const hours = /\b(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr)\b/i.exec(text);
    if (mins) durationMinutes = Number(mins[1]);
    else if (hours) durationMinutes = Math.round(Number(hours[1]) * 60);
  }

  return { ...empty, startsAt: start, durationMinutes };
}

/**
 * A name for a meeting nobody has labelled, taken from where it is held. The
 * label is the row's heading on the event and on the dashboard, so "Zoom
 * meeting" beats an empty string and beats refusing to save.
 */
export function labelForUrl(url: string): string {
  const host = url.toLowerCase();
  if (host.includes('zoom.us')) return 'Zoom meeting';
  if (host.includes('teams.microsoft.com') || host.includes('teams.live.com')) return 'Teams meeting';
  if (host.includes('meet.google.com')) return 'Google Meet';
  if (host.includes('webex.com')) return 'Webex meeting';
  if (host.includes('whereby.com')) return 'Whereby meeting';
  if (host.includes('gotomeet')) return 'GoToMeeting';
  if (host.includes('chime.aws')) return 'Chime meeting';
  return 'Meeting';
}
