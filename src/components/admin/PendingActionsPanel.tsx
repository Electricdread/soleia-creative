import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { differenceInCalendarDays } from 'date-fns';
import { AlertCircle, FileText, Video, Upload, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActionKind = 'unsigned-proposal' | 'no-selections' | 'no-uploads';

interface PendingAction {
  kind: ActionKind;
  id: string;
  title: string;
  subtitle: string;
  ageDays: number;
  href: string;
}

const KIND_META: Record<ActionKind, { icon: typeof FileText; label: string; tone: string }> = {
  'unsigned-proposal': { icon: FileText, label: 'Awaiting signature', tone: 'text-amber-600' },
  'no-selections': { icon: Video, label: 'No client selections', tone: 'text-blue-500' },
  'no-uploads': { icon: Upload, label: 'No assets uploaded', tone: 'text-purple-500' },
};

export function PendingActionsPanel() {
  const navigate = useNavigate();
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const today = new Date();
      const [proposals, links, selections, uploads] = await Promise.all([
        supabase.from('proposals')
          .select('id, token, event_name, client_name, status, signed_at, is_active, updated_at, created_at')
          .eq('is_active', true).eq('status', 'sent'),
        supabase.from('client_links')
          .select('id, token, event_name, client_name, created_at, is_active')
          .eq('is_active', true),
        supabase.from('link_selections').select('link_id'),
        supabase.from('session_uploads').select('link_id'),
      ]);

      const all: PendingAction[] = [];

      (proposals.data || []).forEach((p: any) => {
        if (p.signed_at) return;
        const sentDate = new Date(p.updated_at || p.created_at);
        all.push({
          kind: 'unsigned-proposal',
          id: p.id,
          title: p.event_name,
          subtitle: p.client_name,
          ageDays: Math.max(0, differenceInCalendarDays(today, sentDate)),
          href: '/admin/proposals',
        });
      });

      const linksWithSelections = new Set((selections.data || []).map((s: any) => s.link_id));
      const linksWithUploads = new Set((uploads.data || []).map((u: any) => u.link_id));

      (links.data || []).forEach((l: any) => {
        const created = new Date(l.created_at);
        const age = Math.max(0, differenceInCalendarDays(today, created));
        if (!linksWithSelections.has(l.id)) {
          all.push({
            kind: 'no-selections',
            id: l.id,
            title: l.event_name,
            subtitle: l.client_name,
            ageDays: age,
            href: '/admin/looks',
          });
        }
        if (!linksWithUploads.has(l.id)) {
          all.push({
            kind: 'no-uploads',
            id: l.id + '-upload',
            title: l.event_name,
            subtitle: l.client_name,
            ageDays: age,
            href: '/admin/looks',
          });
        }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_links' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'link_selections' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_uploads' }, load)
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
                <button
                  key={`${a.kind}-${a.id}`}
                  onClick={() => navigate(a.href)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0', meta.tone)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {meta.label} · {a.subtitle}
                    </p>
                  </div>
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
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
