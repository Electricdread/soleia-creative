import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-[#c49a3c]" /></div>;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Circleback URL"
          className="bg-[#faf8f5] border-[#d6cfc3] text-[#3d3629] text-sm placeholder:text-[#b5ab9a]"
        />
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Paste or type meeting notes summary..."
          className="bg-[#faf8f5] border-[#d6cfc3] text-[#3d3629] text-sm min-h-[80px] placeholder:text-[#b5ab9a]"
        />
        <Button size="sm" onClick={add} disabled={saving || (!url.trim() && !summary.trim())} className="bg-[#c49a3c] hover:bg-[#b08a30] text-white text-xs gap-1.5">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add Notes
        </Button>
      </div>

      {entries.length === 0 && <p className="text-xs text-[#b5ab9a] italic">No Circleback notes yet</p>}

      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.id} className="bg-[#faf8f5] border border-[#e8e2d8] rounded-lg p-3 group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {e.circleback_url && (
                  <a href={e.circleback_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-[#c49a3c] hover:underline mb-1">
                    <FileText className="w-3.5 h-3.5" /> View in Circleback <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {e.circleback_summary && (
                  <p className="text-sm text-[#3d3629] whitespace-pre-line line-clamp-6">{e.circleback_summary}</p>
                )}
              </div>
              <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 text-[#b5ab9a] hover:text-[#b05a5a] transition-opacity shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] text-[#b5ab9a] mt-1 block">{format(new Date(e.created_at), 'MMM d, h:mm a')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
