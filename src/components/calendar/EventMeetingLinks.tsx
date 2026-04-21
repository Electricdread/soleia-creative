import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Video, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

interface MeetingLink {
  id: string;
  label: string;
  url: string;
  link_type: string;
  created_at: string;
}

export function EventMeetingLinks({ eventUid }: { eventUid: string }) {
  const [links, setLinks] = useState<MeetingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLinks = async () => {
    const { data } = await supabase
      .from('calendar_event_meeting_links')
      .select('*')
      .eq('event_uid', eventUid)
      .order('created_at', { ascending: false });
    setLinks((data as MeetingLink[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchLinks(); }, [eventUid]);

  const addLink = async () => {
    if (!label.trim() || !url.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('calendar_event_meeting_links').insert({
      event_uid: eventUid,
      label: label.trim(),
      url: url.trim(),
      link_type: 'meeting',
    } as any);
    if (error) toast.error('Failed to save link');
    else { setLabel(''); setUrl(''); fetchLinks(); }
    setSaving(false);
  };

  const deleteLink = async (id: string) => {
    await supabase.from('calendar_event_meeting_links').delete().eq('id', id);
    fetchLinks();
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-[#c49a3c]" /></div>;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Link label (e.g. Creative Call #1)"
          className="bg-[#faf8f5] border-[#d6cfc3] text-[#3d3629] text-sm placeholder:text-[#b5ab9a]"
        />
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://zoom.us/j/..."
            className="bg-[#faf8f5] border-[#d6cfc3] text-[#3d3629] text-sm placeholder:text-[#b5ab9a]"
          />
          <Button size="sm" onClick={addLink} disabled={saving || !label.trim() || !url.trim()} className="bg-[#c49a3c] hover:bg-[#b08a30] text-white shrink-0">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {links.length === 0 && <p className="text-xs text-[#b5ab9a] italic">No meeting links yet</p>}

      <div className="space-y-2">
        {links.map((link) => (
          <div key={link.id} className="flex items-center gap-3 bg-[#faf8f5] border border-[#e8e2d8] rounded-lg p-3 group">
            <Video className="w-4 h-4 text-[#c49a3c] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#3d3629] truncate">{link.label}</p>
              <p className="text-[10px] text-[#b5ab9a] truncate">{link.url}</p>
            </div>
            <button onClick={() => copyUrl(link.url)} className="text-[#8a7d6b] hover:text-[#c49a3c]" title="Copy link">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[#c49a3c] hover:text-[#b08a30]">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <DeleteConfirmDialog
              trigger={
                <button className="opacity-0 group-hover:opacity-100 text-[#b5ab9a] hover:text-[#b05a5a] transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              }
              title="Delete meeting link?"
              description={`This will permanently remove "${link.label}". This action cannot be undone.`}
              onConfirm={() => deleteLink(link.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
