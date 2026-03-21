import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export function EventNotes({ eventUid }: { eventUid: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('calendar_event_notes')
      .select('id, content, created_at')
      .eq('event_uid', eventUid)
      .order('created_at', { ascending: false });
    setNotes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, [eventUid]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('calendar_event_notes').insert({ event_uid: eventUid, content: newNote.trim() });
    if (error) toast.error('Failed to save note');
    else { setNewNote(''); fetchNotes(); }
    setSaving(false);
  };

  const deleteNote = async (id: string) => {
    await supabase.from('calendar_event_notes').delete().eq('id', id);
    fetchNotes();
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-[#c49a3c]" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          className="bg-[#faf8f5] border-[#d6cfc3] text-[#3d3629] text-sm min-h-[60px] placeholder:text-[#b5ab9a]"
        />
      </div>
      <Button size="sm" onClick={addNote} disabled={saving || !newNote.trim()} className="bg-[#c49a3c] hover:bg-[#b08a30] text-white text-xs gap-1.5">
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add Note
      </Button>

      {notes.length === 0 && <p className="text-xs text-[#b5ab9a] italic">No notes yet</p>}

      <div className="space-y-2 mt-2">
        {notes.map((n) => (
          <div key={n.id} className="bg-[#faf8f5] border border-[#e8e2d8] rounded-lg p-3 group">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-[#3d3629] whitespace-pre-line flex-1">{n.content}</p>
              <button onClick={() => deleteNote(n.id)} className="opacity-0 group-hover:opacity-100 text-[#b5ab9a] hover:text-[#b05a5a] transition-opacity">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] text-[#b5ab9a] mt-1 block">{format(new Date(n.created_at), 'MMM d, h:mm a')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
