import { format, isValid, parseISO } from 'date-fns';

/**
 * What a booking is called, the owner's way (2026-09-14): "MM.DD.YY Client - Event",
 * the same words on the calendar, the Soleia job and the production folder
 * ("09.15.26 CR - Travcon 2026").
 *
 * The day is the day of the event, as Tripleseat states it: its event details
 * ("Tue, Sep 15, 2026") when they have been read, else the booking's own start
 * in the feed, which Tripleseat writes in Las Vegas time. Never the day the
 * booking was added to the feed -- that is a different field and it is not read.
 */

const TRIPLESEAT_TAG = /^\[(D|T|P|C)\]\s*/i;
/** A day already written at the front of a name: "09.15.26 " or the older "09.14.26 - ". */
const LEADING_DAY = /^\d{1,2}\.\d{1,2}\.\d{2,4}\s+(?:-\s+)?/;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export const stripTripleseatTag = (summary: string): string => summary.replace(TRIPLESEAT_TAG, '').trim();

const token = (month: number, day: number, year: number) =>
  `${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}.${String(year).slice(-2)}`;

/** Tripleseat's event page writes the day as "Tue, Sep 15, 2026". */
export function dayFromTripleseatDate(value?: string | null): string | null {
  const hit = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i.exec(value ?? '');
  if (!hit) return null;
  return token(MONTHS.indexOf(hit[1].toLowerCase()) + 1, Number(hit[2]), Number(hit[3]));
}

/**
 * The booking's start, read the way the calendar grid places it, so the day in
 * the name is always the day the booking sits on.
 */
export function dayFromEventStart(dtstart?: string | null): string | null {
  if (!dtstart) return null;
  const start = parseISO(dtstart);
  return isValid(start) ? format(start, 'MM.dd.yy') : null;
}

export function eventDisplayName({ summary, dtstart, tripleseatDate, jobTitles }: {
  summary: string;
  dtstart?: string | null;
  /** `event_date` from the booking's Tripleseat details, when they have been read. */
  tripleseatDate?: string | null;
  /** Titles of the jobs the booking is linked to; a job's title is used only when there is exactly one. */
  jobTitles?: string[] | null;
}): string {
  const jobTitle = jobTitles?.length === 1 ? jobTitles[0].trim() : '';
  const named = jobTitle || stripTripleseatTag(summary);
  const day = dayFromTripleseatDate(tripleseatDate) ?? dayFromEventStart(dtstart);
  if (!day) return named;
  // The day comes from Tripleseat even when the job's title carries one of its own.
  return `${day} ${named.replace(LEADING_DAY, '').trim()}`;
}
