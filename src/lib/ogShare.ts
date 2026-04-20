import { toast } from 'sonner';

export type OgLinkType = 'creative' | 'session' | 'proposal' | 'delivery' | 'preview';

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

export function getOgShareUrl(token: string, type: OgLinkType): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/og-preview?token=${token}&type=${type}`;
}

export function copyOgShareLink(token: string, type: OgLinkType) {
  const url = getOgShareUrl(token, type);
  navigator.clipboard.writeText(url);
  toast.success('Social-friendly link copied! Shows rich preview when shared.');
}

export function copyDirectLink(path: string) {
  const url = `${getPublicOrigin()}${path}`;
  navigator.clipboard.writeText(url);
  toast.success('Direct link copied!');
}
