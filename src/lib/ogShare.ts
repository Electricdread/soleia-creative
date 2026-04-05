import { toast } from 'sonner';

export type OgLinkType = 'creative' | 'session' | 'proposal' | 'delivery' | 'preview';

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
  const url = `${window.location.origin}${path}`;
  navigator.clipboard.writeText(url);
  toast.success('Direct link copied!');
}
