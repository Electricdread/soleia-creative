import { supabase } from '@/integrations/supabase/client';

export const PREVIZ_BUCKET = 'creative-guide-template';
export const PREVIZ_MAX_BYTES = 524288000; // 500MB

export function isAcceptablePrevizFile(f: File): { ok: true } | { ok: false; reason: string } {
  const name = f.name.toLowerCase();
  if (name.endsWith('.mov')) {
    return { ok: false, reason: "Browsers can't decode .mov / DXV. Re-export as H.264 .mp4 from AME." };
  }
  const okType =
    f.type === 'video/mp4' ||
    f.type === 'video/webm' ||
    name.endsWith('.mp4') ||
    name.endsWith('.webm');
  if (!okType) return { ok: false, reason: 'Only .mp4 (H.264) or .webm files are supported.' };
  if (f.size > PREVIZ_MAX_BYTES) return { ok: false, reason: 'File too large — maximum is 500MB.' };
  return { ok: true };
}

export function probePlayable(f: File): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(f);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    const cleanup = () => URL.revokeObjectURL(url);
    v.onloadedmetadata = () => {
      cleanup();
      resolve(v.videoWidth > 0);
    };
    v.onerror = () => {
      cleanup();
      resolve(false);
    };
    v.src = url;
  });
}

export async function uploadPrevizFile(
  file: File,
  pathPrefix: string,
): Promise<{ url: string; path: string }> {
  const timestamp = Date.now();
  const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const prefix = pathPrefix.endsWith('/') ? pathPrefix : `${pathPrefix}/`;
  const path = `${prefix}${timestamp}-${sanitized}`;
  const { error } = await supabase.storage
    .from(PREVIZ_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from(PREVIZ_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}
