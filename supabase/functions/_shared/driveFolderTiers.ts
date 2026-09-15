/**
 * Where a client job folder sits in Drive and what colour it wears (owner, 2026-09-14): "in google drive can
 * there be a color coded for for next upcoming events? and archive event folders that have past?". They chose:
 * - three tiers: a show within 7 days is red, 8 to 30 days out is indiglo blue, anything later stays as it is;
 * - a folder moves into "Soleia Clients / Archive" 7 days after its show;
 * - organize-client-drive-folders applies this every morning.
 *
 * Days are Las Vegas calendar days. A bare `YYYY-MM-DD` is read as a calendar day, never with
 * `new Date(string)`, which reads it as midnight UTC: the day before, in Las Vegas.
 */

export const VENUE_ZONE = 'America/Los_Angeles';
export const HOT_WITHIN_DAYS = 7;
export const SOON_WITHIN_DAYS = 30;
export const ARCHIVE_AFTER_DAYS = 7;
export const ARCHIVE_FOLDER_NAME = 'Archive';

/**
 * The colour each coloured tier asks for. Drive only offers its own palette, so `nearestColour` snaps these
 * to it. Soon is indiglo, DreamlinkX OS's accent glow and the colour Soleia's calendar gives a booked job.
 */
export const TIER_COLOUR = { hot: '#E53935', soon: '#5AA9FF' } as const;

export type FolderTier = 'hot' | 'soon' | 'later' | 'past' | 'archive';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's date in Las Vegas, as YYYY-MM-DD. */
export function venueToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: VENUE_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function calendarDay(value: string | null | undefined): number | null {
  const hit = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? '').trim());
  return hit ? Date.UTC(Number(hit[1]), Number(hit[2]) - 1, Number(hit[3])) : null;
}

/** Whole days from `today` to the show: 0 on the day, negative once it has passed. */
export function daysUntil(eventDate: string | null | undefined, today: string): number | null {
  const show = calendarDay(eventDate);
  const now = calendarDay(today);
  return show === null || now === null ? null : Math.round((show - now) / DAY_MS);
}

export function folderTier(eventDate: string | null | undefined, today: string): FolderTier | null {
  const days = daysUntil(eventDate, today);
  if (days === null) return null;
  if (days <= -ARCHIVE_AFTER_DAYS) return 'archive';
  if (days < 0) return 'past';
  if (days <= HOT_WITHIN_DAYS) return 'hot';
  if (days <= SOON_WITHIN_DAYS) return 'soon';
  return 'later';
}

/**
 * The show a folder answers to. A job, its packet and its proposal can all point at one folder, now and then
 * with different dates. The folder follows the soonest show still to come, so it stays out of the archive
 * while any of them is ahead; when all are past, it follows the latest.
 */
export function folderShowDate(dates: (string | null | undefined)[], today: string): string | null {
  const known = dates
    .map((date) => String(date ?? '').trim().slice(0, 10))
    .filter((date) => daysUntil(date, today) !== null)
    .sort();
  if (!known.length) return null;
  const ahead = known.filter((date) => (daysUntil(date, today) as number) >= 0);
  return ahead.length ? ahead[0] : known[known.length - 1];
}

const HEX = /^#[0-9a-f]{6}$/i;
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** The palette colour closest to `want`, or `want` itself when there is no palette to choose from. */
export function nearestColour(want: string, palette: string[]): string {
  const [r, g, b] = rgb(want);
  let best = want;
  let bestDistance = Infinity;
  for (const colour of palette.filter((c) => HEX.test(c))) {
    const [pr, pg, pb] = rgb(colour);
    const distance = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (distance < bestDistance) {
      best = colour;
      bestDistance = distance;
    }
  }
  return best;
}
