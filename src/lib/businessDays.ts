/**
 * Business days, the way the deadline on every packet is counted.
 *
 * "Final assets are due 21 business days before your event" appears in the
 * packet copy, the proposal terms and the PM's brief, and it has always been
 * counted by hand. Counting it by hand is where it goes wrong: the answer is
 * not the event date minus 29 calendar days, because a federal holiday inside
 * the window pushes it a day earlier.
 *
 * The Oct 5 2026 NCAN event is the worked example — 21 business days back
 * lands on Fri Sep 4 if you only skip weekends, and on Thu Sep 3 once Labor
 * Day is skipped too. Thursday Sep 3 is the answer the PM wrote.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Local-midnight copy, so arithmetic never drifts across a DST boundary. */
function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function key(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** The nth given weekday of a month, e.g. the 3rd Monday of January. */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + (n - 1) * 7);
}

/** The last given weekday of a month, e.g. the last Monday of May. */
function lastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const last = new Date(year, month + 1, 0);
  const offset = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month, last.getDate() - offset);
}

/**
 * A fixed-date holiday as it is actually observed: a Saturday holiday is taken
 * on the Friday before, a Sunday holiday on the Monday after. Without this,
 * July 4 2026 — a Saturday — would leave Friday July 3 counted as a working
 * day when the country is not working.
 */
function observed(date: Date): Date {
  if (date.getDay() === 6) return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  if (date.getDay() === 0) return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return date;
}

/** US federal holidays for one year, as observed. */
export function usFederalHolidays(year: number): Date[] {
  return [
    observed(new Date(year, 0, 1)),                    // New Year's Day
    nthWeekdayOfMonth(year, 0, 1, 3),                  // MLK Jr Day
    nthWeekdayOfMonth(year, 1, 1, 3),                  // Presidents' Day
    lastWeekdayOfMonth(year, 4, 1),                    // Memorial Day
    observed(new Date(year, 5, 19)),                   // Juneteenth
    observed(new Date(year, 6, 4)),                    // Independence Day
    nthWeekdayOfMonth(year, 8, 1, 1),                  // Labor Day
    nthWeekdayOfMonth(year, 9, 1, 2),                  // Columbus Day
    observed(new Date(year, 10, 11)),                  // Veterans Day
    nthWeekdayOfMonth(year, 10, 4, 4),                 // Thanksgiving
    observed(new Date(year, 11, 25)),                  // Christmas Day
  ];
}

const holidayCache = new Map<number, Set<string>>();

function holidaysFor(year: number): Set<string> {
  let set = holidayCache.get(year);
  if (!set) {
    set = new Set(usFederalHolidays(year).map(key));
    holidayCache.set(year, set);
  }
  return set;
}

/** Monday to Friday, and not a federal holiday. */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  return !holidaysFor(date.getFullYear()).has(key(date));
}

/**
 * Walk back `count` business days from `from`, exclusive of `from` itself —
 * "21 business days before the event" means 21 working days in which to do the
 * work, not counting show day.
 */
export function subtractBusinessDays(from: Date, count: number): Date {
  const cursor = atMidnight(from);
  let remaining = count;
  while (remaining > 0) {
    cursor.setTime(cursor.getTime() - MS_PER_DAY);
    // setTime on a midnight date can land on 23:00 the previous day across a
    // spring-forward boundary; normalise before testing the weekday.
    cursor.setHours(0, 0, 0, 0);
    if (isBusinessDay(cursor)) remaining--;
  }
  return cursor;
}

/** The standard Soleia asset deadline: 21 business days before the show. */
export const ASSET_DEADLINE_BUSINESS_DAYS = 21;

export function assetDeadlineFor(eventDate: Date): Date {
  return subtractBusinessDays(eventDate, ASSET_DEADLINE_BUSINESS_DAYS);
}
