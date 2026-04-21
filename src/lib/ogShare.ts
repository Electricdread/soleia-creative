import { toast } from 'sonner';

const CANONICAL_ORIGIN = 'https://soleiacreative.app';

/**
 * Returns the canonical public origin for client-shared links.
 * Always returns https://soleiacreative.app unless already running on the
 * canonical domain (so SSR / future domain changes still work).
 */
export function getPublicOrigin(): string {
  if (typeof window === 'undefined') return CANONICAL_ORIGIN;
  const host = window.location.hostname;
  if (host === 'soleiacreative.app' || host === 'www.soleiacreative.app') {
    return window.location.origin;
  }
  return CANONICAL_ORIGIN;
}

export function copyDirectLink(path: string) {
  const url = `${getPublicOrigin()}${path}`;
  navigator.clipboard.writeText(url);
  toast.success('Direct link copied!');
}
