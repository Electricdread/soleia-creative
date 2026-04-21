import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

interface CirclebackEntry {
  id: string;
  circleback_url: string | null;
  circleback_summary: string | null;
  created_at: string;
}

export function EventCircleback({ eventUid }: { eventUid: string }) {
  const [entries, setEntries] = useState<CirclebackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    const { data } = await supabase
      .from('calendar_event_circleback')
      .select('*')
      .eq('event_uid', eventUid)
      .order('created_at', { ascending: false });
    setEntries((data as CirclebackEntry[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, [eventUid]);

  const add = async () => {
    if (!url.trim() && !summary.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('calendar_event_circleback').insert({
      event_uid: eventUid,
      circleback_url: url.trim() || null,
      circleback_summary: summary.trim() || null,
    } as any);
    if (error) toast.error('Failed to save');
    else { setUrl(''); setSummary(''); fetch_(); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    await supabase.from('calendar_event_circleback').delete().eq('id', id);
    fetch_();
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Circleback URL"
          className="bg-muted/50 border-border text-foreground text-sm placeholder:text-muted-foreground/60"
        />
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Paste or type meeting notes summary..."
          className="bg-muted/50 border-border text-foreground text-sm min-h-[80px] placeholder:text-muted-foreground/60"
        />
        <Button size="sm" onClick={add} disabled={saving || (!url.trim() && !summary.trim())} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add Notes
        </Button>
      </div>

      {entries.length === 0 && <p className="text-xs text-muted-foreground/60 italic">No Circleback notes yet</p>}

      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.id} className="bg-muted/50 border border-border rounded-lg p-3 group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {e.circleback_url && (
                  <a href={e.circleback_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-1">
                    <FileText className="w-3.5 h-3.5" /> View in Circleback <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {e.circleback_summary && (
                  <p className="text-sm text-foreground whitespace-pre-line line-clamp-6">{e.circleback_summary}</p>
                )}
              </div>
              <DeleteConfirmDialog
                trigger={
                  <button className="opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-destructive transition-opacity shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                }
                title="Delete Circleback notes?"
                description="This will permanently remove these meeting notes. This action cannot be undone."
                onConfirm={() => remove(e.id)}
              />
            </div>
            <span className="text-[10px] text-muted-foreground/60 mt-1 block">{format(new Date(e.created_at), 'MMM d, h:mm a')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
