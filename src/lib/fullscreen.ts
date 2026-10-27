/**
 * Element fullscreen, iOS included.
 *
 * iPhone Safari has no element fullscreen: `requestFullscreen` is undefined
 * there, so a button that only calls it does nothing at all. iPadOS has it,
 * unprefixed from 16.4 and as `webkitRequestFullscreen` before that. These
 * helpers try both and say whether it worked, so a caller can fall back --
 * to the native video player for a <video>, or to a fixed full-window layer.
 */

type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
};
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => void };
type WebkitVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

export function fullscreenElement(): Element | null {
  const d = document as WebkitDocument;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

/** Whether this browser can put an arbitrary element fullscreen. */
export function canFullscreenElement(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement as WebkitElement;
  return typeof el.requestFullscreen === 'function' || typeof el.webkitRequestFullscreen === 'function';
}

/** Resolves true when the element went fullscreen. */
export async function enterFullscreen(el: HTMLElement): Promise<boolean> {
  const w = el as WebkitElement;
  try {
    if (typeof w.requestFullscreen === 'function') {
      await w.requestFullscreen();
      return true;
    }
    if (typeof w.webkitRequestFullscreen === 'function') {
      w.webkitRequestFullscreen();
      return true;
    }
  } catch {
    /* refused (no user gesture, or a frame without permission) */
  }
  return false;
}

export function exitFullscreen(): void {
  const d = document as WebkitDocument;
  if (d.fullscreenElement) void d.exitFullscreen?.().catch(() => undefined);
  else if (d.webkitFullscreenElement) d.webkitExitFullscreen?.();
}

/** iPhone's own full-screen video player: the only fullscreen it offers. */
export function enterVideoFullscreen(video: HTMLVideoElement | null): boolean {
  const v = video as WebkitVideo | null;
  if (v && typeof v.webkitEnterFullscreen === 'function') {
    v.webkitEnterFullscreen();
    return true;
  }
  return false;
}

/** Listens for both spellings of the change event; returns the unsubscribe. */
export function onFullscreenChange(cb: () => void): () => void {
  document.addEventListener('fullscreenchange', cb);
  document.addEventListener('webkitfullscreenchange', cb);
  return () => {
    document.removeEventListener('fullscreenchange', cb);
    document.removeEventListener('webkitfullscreenchange', cb);
  };
}
