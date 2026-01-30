import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Calendar, User, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type EntryType = 'creative' | 'looks';

export function QuickEntryForm() {
  const [entryType, setEntryType] = useState<EntryType>('creative');
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim() || !clientName.trim()) {
      toast.error('Project name and client are required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (entryType === 'creative') {
        const token = crypto.randomUUID().slice(0, 8);
        const { error } = await supabase.from('creative_sessions').insert({
          project_name: projectName.trim(),
          client_name: clientName.trim(),
          token,
          creative_notes: notes.trim() || null,
        });

        if (error) throw error;
        toast.success('Creative session created!');
      } else {
        const token = crypto.randomUUID().slice(0, 8);
        const { error } = await supabase.from('client_links').insert({
          event_name: projectName.trim(),
          client_name: clientName.trim(),
          token,
          event_date: eventDate ? format(eventDate, 'yyyy-MM-dd') : null,
        });

        if (error) throw error;
        toast.success('Looks session created!');
      }

      // Reset form
      setProjectName('');
      setClientName('');
      setEventDate(undefined);
      setNotes('');
    } catch (error: any) {
      console.error('Error creating entry:', error);
      toast.error(error.message || 'Failed to create entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          <h3 className="font-tech text-sm uppercase tracking-wider text-zinc-300">Quick Entry</h3>
        </div>
        
        {/* Entry Type Toggle */}
        <div className="flex gap-1 bg-zinc-800/50 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setEntryType('creative')}
            className={`px-2.5 py-1 text-[10px] font-tech uppercase tracking-wider rounded-md transition-all ${
              entryType === 'creative'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Creative
          </button>
          <button
            type="button"
            onClick={() => setEntryType('looks')}
            className={`px-2.5 py-1 text-[10px] font-tech uppercase tracking-wider rounded-md transition-all ${
              entryType === 'looks'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Looks
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Project/Event Name */}
          <div>
            <label className="text-[10px] font-tech uppercase tracking-wider text-zinc-500 mb-1 block">
              <FileText className="w-3 h-3 inline mr-1" />
              {entryType === 'creative' ? 'Project Name' : 'Event Name'}
            </label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={entryType === 'creative' ? 'Project name...' : 'Event name...'}
              className="font-tech text-sm bg-zinc-800/50 border-zinc-700 focus:border-cyan-500/50 h-9"
            />
          </div>

          {/* Client Name */}
          <div>
            <label className="text-[10px] font-tech uppercase tracking-wider text-zinc-500 mb-1 block">
              <User className="w-3 h-3 inline mr-1" />
              Client
            </label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client name..."
              className="font-tech text-sm bg-zinc-800/50 border-zinc-700 focus:border-cyan-500/50 h-9"
            />
          </div>
        </div>

        {/* Event Date (only for Looks) */}
        {entryType === 'looks' && (
          <div>
            <label className="text-[10px] font-tech uppercase tracking-wider text-zinc-500 mb-1 block">
              <Calendar className="w-3 h-3 inline mr-1" />
              Event Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-tech text-sm h-9 bg-zinc-800/50 border-zinc-700",
                    !eventDate && "text-zinc-500"
                  )}
                >
                  <Calendar className="mr-2 h-3.5 w-3.5" />
                  {eventDate ? format(eventDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={eventDate}
                  onSelect={setEventDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Notes (only for Creative) */}
        {entryType === 'creative' && (
          <div>
            <label className="text-[10px] font-tech uppercase tracking-wider text-zinc-500 mb-1 block">
              Quick Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="font-tech text-sm bg-zinc-800/50 border-zinc-700 focus:border-cyan-500/50 min-h-[60px] resize-none"
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-tech text-xs uppercase tracking-wider ${
            entryType === 'creative'
              ? 'bg-cyan-500 hover:bg-cyan-600'
              : 'bg-purple-500 hover:bg-purple-600'
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5 mr-1.5" />
          )}
          Create {entryType === 'creative' ? 'Creative Session' : 'Looks Session'}
        </Button>
      </form>
    </div>
  );
}
