import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

export function EventAttachments({ eventUid }: { eventUid: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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

  useEffect(() => { fetchAttachments(); }, [eventUid]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const path = `${eventUid}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('calendar-attachments').upload(path, file);
    if (uploadError) { toast.error('Upload failed'); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from('calendar-attachments').getPublicUrl(path);

    const { error } = await supabase.from('calendar_event_attachments').insert({
      event_uid: eventUid,
      file_name: file.name,
      file_url: publicUrl,
      file_type: file.type,
      file_size: file.size,
    });
    if (error) toast.error('Failed to save attachment');
    else fetchAttachments();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const deleteAttachment = async (att: Attachment) => {
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
      <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={handleUpload} />
      <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5">
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload Document
      </Button>

      {attachments.length === 0 && <p className="text-xs text-muted-foreground/60 italic">No documents attached</p>}

      <div className="space-y-2">
        {attachments.map((att) => (
          <div key={att.id} className="flex items-center gap-3 bg-muted/50 border border-border rounded-lg p-3 group">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{att.file_name}</p>
              <p className="text-[10px] text-muted-foreground/60">
                {formatSize(att.file_size)} · {format(new Date(att.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
              <ExternalLink className="w-4 h-4" />
            </a>
            <button onClick={() => deleteAttachment(att)} className="opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-destructive transition-opacity">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
