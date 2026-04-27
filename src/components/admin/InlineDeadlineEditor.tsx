import { useState } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Module = 'proposal' | 'session' | 'link';

const TABLE_MAP: Record<Module, 'proposals' | 'creative_sessions' | 'client_links'> = {
  proposal: 'proposals',
  session: 'creative_sessions',
  link: 'client_links',
};

interface Props {
  module: Module;
  entityId: string;
  currentDate: string | null;
  onSaved: (newDate: string) => void;
  /** Optional: tighter button for dense rows */
  compact?: boolean;
}

export function InlineDeadlineEditor({ module, entityId, currentDate, onSaved, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(
    currentDate ? parseISO(currentDate) : undefined
  );

  const save = async (date: Date) => {
    setSaving(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    const table = TABLE_MAP[module];
    const { error } = await supabase.from(table).update({ event_date: dateStr } as any).eq('id', entityId);
    setSaving(false);
    if (error) {
      toast.error('Failed to update deadline');
      return;
    }
    setSelected(date);
    onSaved(dateStr);
    setOpen(false);
    toast.success(`Deadline set to ${format(date, 'MMM d, yyyy')}`);
  };

  const extend = (days: number) => {
    const base = selected ?? new Date();
    save(addDays(base, days));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label="Edit deadline"
          className={cn(
            'flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0',
            compact ? 'h-7 w-7' : 'h-8 w-8 sm:h-9 sm:w-9'
          )}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarDays className="w-3.5 h-3.5" />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3 z-50"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Current</p>
            <p className="text-sm font-medium text-foreground">
              {currentDate ? format(parseISO(currentDate), 'EEE, MMM d, yyyy') : 'No date set'}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Quick extend</p>
            <div className="flex flex-wrap gap-1.5">
              {[3, 7, 14, 30].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() => extend(d)}
                  className="h-7 px-2.5 text-xs"
                >
                  +{d}d
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Pick a date</p>
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(d) => d && save(d)}
              initialFocus
              className={cn('p-0 pointer-events-auto')}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
