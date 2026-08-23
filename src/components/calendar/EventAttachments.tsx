import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, Trash2, ExternalLink, FolderOpen, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

/**
 * Documents on an event.
 *
 * These used to land in a Supabase bucket nobody opens. A document attached to
 * a booking — a floor plan, a run of show, a logo pack — is a document the
 * client and the crew both need, and the place they already look is the job's
 * `Client Asset Collect` folder in Drive. So that is where these go, and the
 * upload watcher sees them like anything else the client drops in.
 *
 * The bucket remains the fallback for an event with no Drive folder yet, so
 * attaching a file never fails for want of a packet.
 */

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

interface DriveTarget {
  folderId: string;
  folderUrl: string;
  label: string;
}

export function EventAttachments({ eventUid }: { eventUid: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [target, setTarget] = useState<DriveTarget | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = async () => {
    const { data } = await supabase
      .from('calendar_event_attachments')
      .select('*')
      .eq('event_uid', eventUid)
      .order('created_at', { ascending: false });
    setAttachments(data || []);
    setLoading(false);
  };

  /** The job folder behind this event: its packet first, then its proposal. */
  const findTarget = useCallback(async () => {
    const { data: assocs } = await supabase
      .from('calendar_event_associations')
      .select('entity_type, entity_id')
      .eq('event_uid', eventUid)
      .in('entity_type', ['packet', 'proposal']);

    const packetIds = (assocs ?? []).filter((a) => a.entity_type === 'packet').map((a) => a.entity_id);
    const proposalIds = (assocs ?? []).filter((a) => a.entity_type === 'proposal').map((a) => a.entity_id);

    if (packetIds.length) {
      const { data } = await supabase
        .from('pre_call_packets')
        .select('title, drive_folder_id, drive_folder_url')
        .in('id', packetIds)
        .not('drive_folder_id', 'is', null)
        .limit(1);
      const row = data?.[0];
      if (row?.drive_folder_id) {
        setTarget({
          folderId: row.drive_folder_id,
          folderUrl: row.drive_folder_url ?? `https://drive.google.com/drive/folders/${row.drive_folder_id}`,
          label: row.title,
        });
        return;
      }
    }

    if (proposalIds.length) {
      const { data } = await supabase
        .from('proposals')
        .select('event_name, drive_folder_id, drive_folder_url')
        .in('id', proposalIds)
        .not('drive_folder_id', 'is', null)
        .limit(1);
      const row = data?.[0];
      if (row?.drive_folder_id) {
        setTarget({
          folderId: row.drive_folder_id,
          folderUrl: row.drive_folder_url ?? `https://drive.google.com/drive/folders/${row.drive_folder_id}`,
          label: row.event_name,
        });
        return;
      }
    }

    setTarget(null);
  }, [eventUid]);

  useEffect(() => {
    fetchAttachments();
    findTarget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventUid]);

  const uploadOne = async (file: File) => {
    if (target) {
      const form = new FormData();
      form.append('file', file, file.name);
      form.append('filename', file.name);
      form.append('mimeType', file.type || 'application/octet-stream');
      form.append('folderId', target.folderId);
      // The asset drop inside the job folder, not the job folder itself.
      form.append('assetCollect', 'true');

      const { data, error } = await supabase.functions.invoke('upload-to-drive', { body: form });
      if (error || !data?.webViewLink) {
        throw new Error(error?.message ?? 'Drive upload failed');
      }
      return { url: data.webViewLink as string, size: file.size };
    }

    // No Drive folder on this event yet — keep the bucket so nothing is lost.
    const path = `${eventUid}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('calendar-attachments').upload(path, file);
    if (uploadError) throw new Error('Upload failed');
    const { data: { publicUrl } } = supabase.storage.from('calendar-attachments').getPublicUrl(path);
    return { url: publicUrl, size: file.size };
  };

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);

    let done = 0;
    for (const file of list) {
      try {
        const { url, size } = await uploadOne(file);
        const { error } = await supabase.from('calendar_event_attachments').insert({
          event_uid: eventUid,
          file_name: file.name,
          file_url: url,
          file_type: file.type,
          file_size: size,
        });
        if (error) throw new Error('Saved to Drive, but not recorded on the event');
        done++;
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof Error ? e.message : 'upload failed'}`);
      }
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    if (done > 0) {
      toast.success(
        target
          ? `${done} file${done === 1 ? '' : 's'} uploaded to the client asset folder`
          : `${done} file${done === 1 ? '' : 's'} attached`,
      );
      fetchAttachments();
    }
  };

  const deleteAttachment = async (att: Attachment) => {
    // The row goes; the file stays in Drive, where the client may be using it.
    await supabase.from('calendar_event_attachments').delete().eq('id', att.id);
    fetchAttachments();
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed p-5 text-center transition-colors',
          dragging ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:border-primary/50',
        )}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <Upload className="h-5 w-5 text-muted-foreground" />
        )}
        <p className="text-xs text-foreground">
          {uploading ? 'Uploading…' : 'Drop documents here, or click to choose'}
        </p>
        {target ? (
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <HardDrive className="h-3 w-3" />
            Goes to the client asset folder for {target.label}
          </p>
        ) : (
          <p className="text-[10px] text-amber-500">
            No Drive folder on this event yet — files are kept here until a packet creates one.
          </p>
        )}
      </div>

      {target && (
        <a
          href={target.folderUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          <FolderOpen className="h-3 w-3" /> Open the folder in Drive
        </a>
      )}

      {attachments.length === 0 && <p className="text-xs italic text-muted-foreground/60">No documents attached</p>}

      <div className="space-y-2">
        {attachments.map((att) => (
          <div key={att.id} className="group flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{att.file_name}</p>
              <p className="text-[10px] text-muted-foreground/60">
                {formatSize(att.file_size)} · {format(new Date(att.created_at), 'MMM d, yyyy')}
                {att.file_url.includes('drive.google.com') ? ' · in Drive' : ''}
              </p>
            </div>
            <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
              <ExternalLink className="w-4 h-4" />
            </a>
            <DeleteConfirmDialog
              trigger={
                <button className="opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-destructive transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              }
              title="Remove from this event?"
              description={`This takes "${att.file_name}" off the event. A file already uploaded to Drive stays in the client folder.`}
              onConfirm={() => deleteAttachment(att)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
