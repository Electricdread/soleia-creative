/**
 * What a creative-session item is, for display.
 *
 * `mood_board_items.item_type` is checked against a fixed list in the database
 * (pinterest, instagram, image, video, pdf, link), and 'html' is not on it. An
 * uploaded HTML file is therefore stored as a 'link' whose `file_url` is the
 * uploaded .html, and every screen asks `mediaKind` instead of reading
 * `item_type` directly.
 */

export type MediaKind = 'image' | 'video' | 'pdf' | 'html' | 'link' | 'pinterest' | 'instagram';

interface MediaLike {
  item_type: string;
  file_url?: string | null;
  thumbnail_url?: string | null;
  url?: string | null;
}

const HTML_EXT = /\.html?$/i;

function pathOf(url: string): string {
  return url.split(/[?#]/)[0];
}

export function mediaKind(item: MediaLike): MediaKind {
  if (item.item_type === 'link' && item.file_url && HTML_EXT.test(pathOf(item.file_url))) return 'html';
  return item.item_type as MediaKind;
}

/** The word shown on an item's badge. */
export function mediaKindLabel(item: MediaLike): string {
  const kind = mediaKind(item);
  if (kind === 'pdf') return 'slideshow';
  if (kind === 'html') return 'interactive';
  return kind;
}

/** What an uploaded file becomes, or null when the session cannot show it. */
export function uploadKind(file: { name: string; type: string }): 'image' | 'video' | 'pdf' | 'html' | null {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (file.type === 'text/html' || HTML_EXT.test(name)) return 'html';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  return null;
}

/** The `item_type` to store for an upload: see the note at the top. */
export function storedItemType(kind: 'image' | 'video' | 'pdf' | 'html'): 'image' | 'video' | 'pdf' | 'link' {
  return kind === 'html' ? 'link' : kind;
}

/**
 * A URL that can go in an `<img>` for this item, or null. A PDF or an HTML
 * file is not a picture: without a stored thumbnail there is nothing to show,
 * and handing its `file_url` to an `<img>` draws a broken image.
 */
export function previewImageUrl(item: MediaLike): string | null {
  if (item.thumbnail_url) return item.thumbnail_url;
  const kind = mediaKind(item);
  if (kind === 'image') return item.file_url || item.url || null;
  return null;
}

/** Items the fullscreen viewer can open. */
export function isViewable(item: MediaLike): boolean {
  const kind = mediaKind(item);
  return kind === 'image' || kind === 'video' || kind === 'pdf' || kind === 'html';
}

const EXT: Record<string, string> = { video: 'mp4', image: 'jpg', pdf: 'pdf', html: 'html' };

/** A download file name with the right extension for the item. */
export function downloadName(item: MediaLike & { title?: string | null }): string {
  const ext = EXT[mediaKind(item)] ?? 'bin';
  const base = (item.title || 'download').replace(new RegExp(`\\.${ext}$`, 'i'), '');
  return `${base}.${ext}`;
}
