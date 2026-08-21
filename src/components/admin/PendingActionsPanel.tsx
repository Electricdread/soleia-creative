import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { differenceInCalendarDays } from 'date-fns';
import { AlertCircle, FileText, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InlineDeadlineEditor } from '@/components/admin/InlineDeadlineEditor';

// Previz-link chasers ('no-selections', 'no-uploads') were removed with that
// workflow: they filled this panel with rows nobody was going to act on.
type ActionKind = 'unsigned-proposal';

interface PendingAction {
  kind: ActionKind;
  id: string;
  rawId: string;
  title: string;
  subtitle: string;
  ageDays: number;
  href: string;
  eventDate: string | null;
  module: 'proposal' | null;
}

const KIND_META: Record<ActionKind, { icon: typeof FileText; label: string; tone: string }> = {
  'unsigned-proposal': { icon: FileText, label: 'Awaiting signature', tone: 'text-amber-600' },
};

export function PendingActionsPanel() {
  const navigate = useNavigate();
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const today = new Date();
      const { data: proposals } = await supabase.from('proposals')
        .select('id, token, event_name, client_name, event_date, status, signed_at, is_active, updated_at, created_at')
        .eq('is_active', true).eq('status', 'sent');

      const all: PendingAction[] = [];

      (proposals || []).forEach((p: any) => {
        if (p.signed_at) return;
        const sentDate = new Date(p.updated_at || p.created_at);
        all.push({
          kind: 'unsigned-proposal',
          id: p.id,
          rawId: p.id,
          title: p.event_name,
          subtitle: p.client_name,
          ageDays: Math.max(0, differenceInCalendarDays(today, sentDate)),
          href: '/admin/proposals',
          eventDate: p.event_date || null,
          module: 'proposal',
        });
      });

      // Oldest first
      all.sort((a, b) => b.ageDays - a.ageDays);
      setActions(all);
    } catch (e) {
      console.error('PendingActionsPanel load error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('pending-actions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/40">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-foreground">Pending Actions</h2>
          {!loading && actions.length > 0 && (
            <span className="text-xs text-muted-foreground">{actions.length} item{actions.length === 1 ? '' : 's'}</span>
          )}
        </div>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
            <p className="text-sm font-medium text-foreground">All caught up</p>
            <p className="text-xs text-muted-foreground mt-1">No pending client actions right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {actions.slice(0, 12).map((a) => {
              const meta = KIND_META[a.kind];
              const Icon = meta.icon;
              return (
                <div
                  key={`${a.kind}-${a.id}`}
                  className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-muted/50 transition-colors"
                >
                  <button
                    onClick={() => navigate(a.href)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', meta.tone)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {meta.label} · {a.subtitle}
                      </p>
                    </div>
                  </button>
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap',
                    a.ageDays >= 7
                      ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                      : a.ageDays >= 3
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {a.ageDays === 0 ? 'today' : `${a.ageDays}d`}
                  </span>
                  {a.module && (
                    <InlineDeadlineEditor
                      module={a.module}
                      entityId={a.rawId}
                      currentDate={a.eventDate}
                      compact
                      onSaved={() => load()}
                    />
                  )}
                  <button
                    onClick={() => navigate(a.href)}
                    className="p-1 -mr-1 text-muted-foreground/40 hover:text-foreground"
                    aria-label="Open"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
