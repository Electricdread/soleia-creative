/**
 * One spelling of a client's name.
 *
 * A client name is not just a label: `create-client-drive-folder` finds a job's
 * Drive folder by matching the name, so `MOC&CO x ZAXBYS,` and
 * `MOC&CO x ZAXBYS` are two clients as far as Drive is concerned — which is
 * exactly how that booking ended up with two sibling folders.
 *
 * So every name is tidied on the way in: outer whitespace gone, runs of space
 * collapsed, and the trailing separator someone left behind when they pasted
 * from a list removed. Nothing else is touched — casing and punctuation inside
 * the name are the client's own.
 */

/** Separators that mean nothing at the end of a name. */
const TRAILING = /[\s,;:|/\\-]+$/;

export function cleanClientName(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().replace(/\s+/g, ' ').replace(TRAILING, '').trim();
}

/** The same tidy, but preserving null for columns that are allowed to be empty. */
export function cleanClientNameOrNull(value: string | null | undefined): string | null {
  const cleaned = cleanClientName(value);
  return cleaned.length > 0 ? cleaned : null;
}
