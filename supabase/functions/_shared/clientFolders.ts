// The "Soleia Clients" root and its Archive, found the same way by every function that needs them.
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { driveJson } from './googleDrive.ts';
import { ARCHIVE_FOLDER_NAME } from './driveFolderTiers.ts';

export const FOLDER_MIME = 'application/vnd.google-apps.folder';

/** The "Soleia Clients" root, found the way create-client-drive-folder finds it. Never created here. */
export async function soleiaClientsRoot(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.from('site_settings').select('value').eq('key', 'drive_root_folder_id').maybeSingle();
  const pinned = (data as { value?: string } | null)?.value?.trim();
  if (pinned) return pinned;
  const q = encodeURIComponent(`mimeType='${FOLDER_MIME}' and name='Soleia Clients' and trashed=false and 'root' in parents`);
  const list = await driveJson(`/drive/v3/files?q=${q}&fields=files(id)&pageSize=2`, { method: 'GET' });
  return list?.files?.[0]?.id ?? null;
}

/**
 * "Soleia Clients / Archive", where a show's folder goes 7 days after the show (organize-client-drive-folders).
 * Null until the first folder is archived. Never created here.
 */
export async function archiveFolderId(rootId: string): Promise<string | null> {
  const q = encodeURIComponent(
    `mimeType='${FOLDER_MIME}' and name='${ARCHIVE_FOLDER_NAME}' and '${rootId}' in parents and trashed=false`,
  );
  const list = await driveJson(`/drive/v3/files?q=${q}&fields=files(id)&pageSize=1`, { method: 'GET' });
  return list?.files?.[0]?.id ?? null;
}
