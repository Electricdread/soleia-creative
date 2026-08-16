import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'session-uploads';
const SIGNED_TTL = 60 * 60; // 1 hour

/** Extract the storage path from a stored session-upload URL. */
export function sessionUploadPath(fileUrl: string): string | null {
  const parts = fileUrl.split(`/${BUCKET}/`);
  if (parts.length < 2) return null;
  return decodeURIComponent(parts[1].split('?')[0]);
}

/** Resolve a stored session-upload URL into a short-lived signed URL. */
export async function signSessionUploadUrl(fileUrl: string): Promise<string | null> {
  const path = sessionUploadPath(fileUrl);
  if (!path) return fileUrl;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Resolve a list of stored URLs into signed URLs keyed by the original URL. */
export function useSignedSessionUploads(fileUrls: string[]): Record<string, string> {
  const [signed, setSigned] = useState<Record<string, string>>({});
  const key = fileUrls.join('|');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const entries = await Promise.all(
        fileUrls.map(async (url) => [url, await signSessionUploadUrl(url)] as const),
      );
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const [url, value] of entries) if (value) next[url] = value;
      setSigned(next);
    };
    if (fileUrls.length) run();
    else setSigned({});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return signed;
}
