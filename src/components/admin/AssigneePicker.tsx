import { useEffect, useState } from 'react';
import { Plus, X, Loader2, UserRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface Colleague {
  user_id: string;
  email: string;
  display_name: string | null;
}

export interface AssigneePickerProps {
  /** Who is on it now. */
  value: Colleague[];
  onChange: (next: Colleague[]) => void;
  /** Shown when nobody is assigned. */
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
}

const label = (c: Colleague) => c.display_name?.trim() || c.email;

/**
 * Assign several colleagues, one at a time.
 *
 * A proposal has always had a single PM slot, which meant a second person on a
 * job had nowhere to go. This adds people rather than replacing them, and the
 * list stays visible so it is obvious who is already on it.
 */
export function AssigneePicker({
  value, onChange, emptyLabel = 'Nobody assigned', disabled, className,
}: AssigneePickerProps) {
  const [people, setPeople] = useState<Colleague[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('list_admin_users').then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error('Could not load colleagues', error.message);
      setPeople((data as Colleague[]) ?? []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const assignedIds = new Set(value.map((v) => v.user_id));
  const available = people.filter((p) => !assignedIds.has(p.user_id));

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {value.map((c) => (
        <span
          key={c.user_id}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 py-1 pl-2 pr-1 text-xs"
          title={c.email}
        >
          <UserRound className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          <span className="max-w-[150px] truncate">{label(c)}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v.user_id !== c.user_id))}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
              aria-label={`Remove ${label(c)}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}

      {value.length === 0 && (
        <span className="text-xs text-muted-foreground">{emptyLabel}</span>
      )}

      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Assign
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-1">
            {available.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                {people.length === 0 ? 'No colleagues found.' : 'Everyone is already on this job.'}
              </p>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {available.map((p) => (
                  <li key={p.user_id}>
                    <button
                      type="button"
                      onClick={() => { onChange([...value, p]); setOpen(false); }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                    >
                      <UserRound className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{label(p)}</span>
                        {p.display_name && (
                          <span className="block truncate text-[11px] text-muted-foreground">{p.email}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export default AssigneePicker;
