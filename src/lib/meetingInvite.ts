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
}

/** Hosts worth preferring when a paste contains several links. */
const MEETING_HOSTS = [
  /zoom\.us\/j\//i,
  /zoom\.us\/my\//i,
  /teams\.microsoft\.com\/l\/meetup-join/i,
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
  const date = findDate(text);
  if (!date) return { url, startsAt: null, durationMinutes: null };

  // Prefer a time written after the date — "October 5, 2026 5:00 PM" — and
  // fall back to any time in the paste, which covers "5:00 PM on Oct 5".
  const after = findTimes(text, date.index);
  const times = after.length ? after : findTimes(text, 0);
  if (times.length === 0) return { url, startsAt: null, durationMinutes: null };

  const start = new Date(date.year, date.month, date.day, times[0].hours, times[0].minutes, 0, 0);

  let durationMinutes: number | null = null;
  if (times.length > 1) {
    // Only treat the next time as an end time when it reads as a range: the
    // two are separated by a dash or the word "to" and little else.
    const between = text.slice(times[0].end, times[1].index);
    if (/^[\s–—-]*(to|until|till|-|–|—)?[\s]*$/i.test(between)) {
      const end = new Date(date.year, date.month, date.day, times[1].hours, times[1].minutes, 0, 0);
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

  return { url, startsAt: start, durationMinutes };
}
