import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Eye, ExternalLink, FileUp, FolderOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * What has landed in this event's Google Drive folder.
 *
 * `drive-upload-watcher` already polls every client folder and records what it
 * finds in `drive_seen_files`; until now the only way to see that was the
 * notification email. The event card is where someone asks "have they sent the
 * assets yet", so the answer belongs here.
 *
 * The folder is the one on whatever this event has been linked to — the packet
 * first, since a packet is usually raised before a proposal exists.
 */

interface SeenFile {
  id: string;
  file_name: string;
  web_view_link: string | null;
  parent_folder_name: string | null;
  seen_at: string;
}

interface FolderSource {
  folderId: string;
  folderUrl: string;
  from: 'packet' | 'proposal';
  label: string;
}

export function EventDriveWatch({ eventUid }: { eventUid: string }) {
  const [source, setSource] = useState<FolderSource | null>(null);
  const [files, setFiles] = useState<SeenFile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data: assocs } = await supabase
        .from('calendar_event_associations')
        .select('entity_type, entity_id')
        .eq('event_uid', eventUid)
        .in('entity_type', ['packet', 'proposal']);

      const packetIds = (assocs ?? []).filter((a) => a.entity_type === 'packet').map((a) => a.entity_id);
      const proposalIds = (assocs ?? []).filter((a) => a.entity_type === 'proposal').map((a) => a.entity_id);

      let found: FolderSource | null = null;

      if (packetIds.length) {
        const { data } = await supabase
          .from('pre_call_packets')
          .select('title, drive_folder_id, drive_folder_url')
          .in('id', packetIds)
          .not('drive_folder_id', 'is', null)
          .limit(1);
        const row = data?.[0];
        if (row?.drive_folder_id) {
          found = {
            folderId: row.drive_folder_id,
            folderUrl: row.drive_folder_url ?? `https://drive.google.com/drive/folders/${row.drive_folder_id}`,
            from: 'packet',
            label: row.title,
          };
        }
      }

      if (!found && proposalIds.length) {
        const { data } = await supabase
          .from('proposals')
          .select('event_name, drive_folder_id, drive_folder_url')
          .in('id', proposalIds)
          .not('drive_folder_id', 'is', null)
          .limit(1);
        const row = data?.[0];
        if (row?.drive_folder_id) {
          found = {
            folderId: row.drive_folder_id,
            folderUrl: row.drive_folder_url ?? `https://drive.google.com/drive/folders/${row.drive_folder_id}`,
            from: 'proposal',
            label: row.event_name,
          };
        }
      }

      if (cancelled) return;
      setSource(found);

      if (found) {
        const [{ data: recent }, { count }] = await Promise.all([
          supabase
            .from('drive_seen_files')
            .select('id, file_name, web_view_link, parent_folder_name, seen_at')
            .eq('drive_folder_id', found.folderId)
            .is('missing_since', null)
            .order('seen_at', { ascending: false })
            .limit(8),
          supabase
            .from('drive_seen_files')
            .select('id', { count: 'exact', head: true })
            .eq('drive_folder_id', found.folderId)
            .is('missing_since', null),
        ]);
        if (cancelled) return;
        setFiles((recent as SeenFile[]) ?? []);
        setTotal(count ?? 0);
      } else {
        setFiles([]);
        setTotal(0);
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [eventUid]);

  if (loading) {
    return <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>;
  }

  if (!source) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
        <FolderOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
        <p className="text-[11px] text-muted-foreground/70">
          No Drive folder on this event yet. Raise a packet in the Packet tab — saving one with a client name
          creates the folder, and uploads to it show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
              Watching the Drive folder
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {source.label} · from the {source.from} · {total} file{total === 1 ? '' : 's'} seen
          </p>
        </div>
        <a
          href={source.folderUrl}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1 text-[11px] text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" /> Open
        </a>
      </div>

      {files.length === 0 ? (
        <p className="mt-2 text-[11px] italic text-muted-foreground/60">
          Nothing uploaded yet. New files are picked up on the next sweep and notified by email.
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5 border-t border-border/40 pt-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2">
              <FileUp className="h-3 w-3 shrink-0 text-muted-foreground/60" />
              <div className="min-w-0 flex-1">
                {f.web_view_link ? (
                  <a
                    href={f.web_view_link}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-[11px] text-foreground hover:text-primary hover:underline"
                  >
                    {f.file_name}
                  </a>
                ) : (
                  <span className="block truncate text-[11px] text-foreground">{f.file_name}</span>
                )}
                {f.parent_folder_name && (
                  <span className="text-[10px] text-muted-foreground/60">{f.parent_folder_name}</span>
                )}
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground/60">
                {formatDistanceToNow(new Date(f.seen_at), { addSuffix: true })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
