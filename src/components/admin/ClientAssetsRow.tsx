import { useEffect, useState } from 'react';
import { ExternalLink, FileUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';


/**
 * What has arrived in a job's folders that is not a final.
 *
 * `FinalsRow` answers "has the delivery gone out"; this answers "have we got
 * what we need to start" — logos, decks, floor plans, whatever the client or
 * the PM dropped in `03_Client Asset Collect`. The job page counted these in a
 * checklist line and then gave no way to look at them, so a file could be sat
 * in Drive for a week without anyone on the job seeing it.
 *
 * Only the asset drop counts. A pixel map or a creative guide sitting in a
 * sibling folder is Soleia's own material, and listing it here made the row
 * claim assets that no client had sent.
 */

/** True for `Client Asset Collect` under either of its spellings. */
const isAssetDrop = (name: string | null) =>
  !!name && name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().endsWith('client asset collect');

interface SeenRow {
  drive_file_id: string;
  file_name: string;
  parent_folder_name: string | null;
  web_view_link: string | null;
  seen_at: string | null;
  final_slot: string | null;
}

function ago(iso: string | null): string {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

export interface ClientAssetsRowProps {
  /** Every Drive folder this job is watched under. */
  folderIds: string[];
  /** Opens the job's Drive folder, when one can be resolved. */
  driveUrl?: string | null;
}

export function ClientAssetsRow({ folderIds, driveUrl }: ClientAssetsRowProps) {
  const [rows, setRows] = useState<SeenRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (folderIds.length === 0) { setRows([]); return; }
    (async () => {
      const { data } = await supabase
        .from('drive_seen_files')
        .select('drive_file_id, file_name, parent_folder_name, web_view_link, seen_at, final_slot')
        .in('drive_folder_id', folderIds)
        // A file deleted in Drive is stamped by the watcher and stops counting.
        .is('missing_since', null)
        .order('seen_at', { ascending: false });
      if (!cancelled) setRows((data as SeenRow[] | null) ?? []);
    })();
    return () => { cancelled = true; };
  }, [folderIds.join(',')]);

  if (rows === null) return null;

  const assets = rows.filter(
    (r) => !r.final_slot && isAssetDrop(r.parent_folder_name) && !/^read me/i.test(r.file_name),
  );

  if (assets.length === 0) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <FileUp className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Assets received</h3>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{assets.length}</span>
        {driveUrl && (
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            Drive <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <ul className="divide-y divide-border">
        {assets.slice(0, 10).map((asset) => (
          <li key={asset.drive_file_id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              {asset.web_view_link ? (
                <a
                  href={asset.web_view_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm text-foreground hover:text-primary hover:underline"
                >
                  {asset.file_name}
                </a>
              ) : (
                <span className="block truncate text-sm text-foreground">{asset.file_name}</span>
              )}
              {asset.parent_folder_name && (
                <span className="text-[11px] text-muted-foreground">{asset.parent_folder_name}</span>
              )}
            </div>
            <span className="flex-shrink-0 font-mono text-[10px] text-muted-foreground">{ago(asset.seen_at)}</span>
          </li>
        ))}
      </ul>

      {assets.length > 10 && (
        <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          {assets.length - 10} more in Drive.
        </p>
      )}
    </div>
  );
}

export default ClientAssetsRow;
