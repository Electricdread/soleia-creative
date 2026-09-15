/**
 * What a Soleia client job folder is called (owner, 2026-09-14: "soleia client google job folders also
 * need to be relabeled with new name format"): the booking's name the way the calendar and the job read
 * it -- "MM.DD.YY" + the job title -- so one event carries one name in Soleia, Google Calendar, Drive and
 * the studio's local production folders.
 *
 * Pure, with no imports, so create-client-drive-folder, rename-client-drive-folder and a vitest test all
 * use the same code. src/lib/jobFolderName.test.ts pins it against the names applied to Drive that day.
 */

/** A title's own leading day, full ("09.15.26 ") or short ("05.27 "), and a stray "|" or "-" after it. */
const LEADING_DAY = /^\s*\d{1,2}\.\d{1,2}(?:\.\d{2,4})?\s*(?:[-|]\s*)?/;
/** Characters Windows cannot hold in a folder name; the studio mirrors these folders to Windows. */
const UNSAFE = /[/:*?"<>|]/g;
const BACKSLASH = String.fromCharCode(92);

/** "2026-09-15" (or a timestamp starting with it) as "09.15.26"; anything else gives no day. */
export function folderDay(eventDate?: string | null): string | null {
  const hit = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(eventDate ?? '').trim());
  return hit ? `${hit[2]}.${hit[3]}.${hit[1].slice(2)}` : null;
}

export function jobFolderName(title: string, eventDate?: string | null): string {
  const trimmed = String(title ?? '').trim();
  const bare = trimmed.replace(LEADING_DAY, '').replace(/^[|\s-]+/, '').trim() || trimmed;
  const day = folderDay(eventDate);
  const named = day ? `${day} ${bare}` : bare;
  return named.split(BACKSLASH).join('-').replace(UNSAFE, '-').replace(/\s+/g, ' ').trim();
}
