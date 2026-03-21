import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
}

export function EventTasks({ eventUid }: { eventUid: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('calendar_event_tasks')
      .select('id, title, is_completed')
      .eq('event_uid', eventUid)
      .order('sort_order');
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [eventUid]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('calendar_event_tasks').insert({ event_uid: eventUid, title: newTask.trim(), sort_order: tasks.length });
    if (error) toast.error('Failed to add task');
    else { setNewTask(''); fetchTasks(); }
    setSaving(false);
  };

  const toggleTask = async (id: string, current: boolean) => {
    await supabase.from('calendar_event_tasks').update({ is_completed: !current }).eq('id', id);
    setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: !current } : t));
  };

  const deleteTask = async (id: string) => {
    await supabase.from('calendar_event_tasks').delete().eq('id', id);
    fetchTasks();
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-[#c49a3c]" /></div>;

  const completed = tasks.filter(t => t.is_completed).length;

  return (
    <div className="space-y-3">
      {tasks.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-[#8a7d6b]">
          <div className="h-1.5 flex-1 bg-[#e8e2d8] rounded-full overflow-hidden">
            <div className="h-full bg-[#7b8a3e] rounded-full transition-all" style={{ width: `${(completed / tasks.length) * 100}%` }} />
          </div>
          <span>{completed}/{tasks.length}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Add a task..."
          className="bg-[#faf8f5] border-[#d6cfc3] text-[#3d3629] text-sm placeholder:text-[#b5ab9a]"
        />
        <Button size="sm" onClick={addTask} disabled={saving || !newTask.trim()} className="bg-[#c49a3c] hover:bg-[#b08a30] text-white shrink-0">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {tasks.length === 0 && <p className="text-xs text-[#b5ab9a] italic">No tasks yet</p>}

      <div className="space-y-1">
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded hover:bg-[#faf8f5] group">
            <Checkbox
              checked={t.is_completed}
              onCheckedChange={() => toggleTask(t.id, t.is_completed)}
              className="border-[#d6cfc3] data-[state=checked]:bg-[#7b8a3e] data-[state=checked]:border-[#7b8a3e]"
            />
            <span className={`text-sm flex-1 ${t.is_completed ? 'line-through text-[#b5ab9a]' : 'text-[#3d3629]'}`}>{t.title}</span>
            <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-100 text-[#b5ab9a] hover:text-[#b05a5a] transition-opacity">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
