import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { differenceInCalendarDays } from 'date-fns';
import { CountdownBadge, getDaysUntil } from '@/components/CountdownBadge';
import { isProposalClosed } from '@/lib/proposalStatus';
import { InlineDeadlineEditor } from '@/components/admin/InlineDeadlineEditor';
import { FileText, Palette, Video, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';

type Module = 'proposal' | 'session' | 'link';

interface DeadlineItem {
  id: string;
  module: Module;
  title: string;
  subtitle: string;
  eventDate: string;
  href: string;
  days: number;
}

const moduleMeta: Record<Module, { icon: typeof FileText; label: string; tone: string }> = {
  proposal: { icon: FileText, label: 'Proposal', tone: 'text-blue-500' },
  session: { icon: Palette, label: 'Creative Session', tone: 'text-[#c49a3c]' },
  link: { icon: Video, label: 'Content Previz', tone: 'text-emerald-500' },
};

export function UpcomingDeadlines() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const today = new Date();
      const horizon = new Date();
      horizon.setDate(horizon.getDate() + 30);
      const horizonStr = horizon.toISOString().slice(0, 10);

      const [proposals, sessions, links] = await Promise.all([
        supabase.from('proposals')
          .select('id, token, event_name, client_name, event_date, status, signed_at')
          .eq('is_active', true)
          .not('event_date', 'is', null)
          .lte('event_date', horizonStr),
        supabase.from('creative_sessions')
          .select('id, token, project_name, client_name, event_date')
          .eq('is_active', true)
          .not('event_date', 'is', null)
          .lte('event_date', horizonStr),
        supabase.from('client_links')
          .select('id, token, event_name, client_name, event_date')
          .eq('is_active', true)
          .not('event_date', 'is', null)
          .lte('event_date', horizonStr),
      ]);

      const all: DeadlineItem[] = [];

      (proposals.data || []).forEach((p: any) => {
        if (isProposalClosed(p)) return;
        const days = getDaysUntil(p.event_date);
        if (days === null) return;
        all.push({
          id: p.id, module: 'proposal',
          title: p.event_name, subtitle: p.client_name,
          eventDate: p.event_date, href: '/admin/proposals', days,
        });
      });

      (sessions.data || []).forEach((s: any) => {
        const days = getDaysUntil(s.event_date);
        if (days === null) return;
        all.push({
          id: s.id, module: 'session',
          title: s.project_name, subtitle: s.client_name,
          eventDate: s.event_date, href: '/admin/creative', days,
        });
      });

      (links.data || []).forEach((l: any) => {
        const days = getDaysUntil(l.event_date);
        if (days === null) return;
        all.push({
          id: l.id, module: 'link',
          title: l.event_name, subtitle: l.client_name,
          eventDate: l.event_date, href: '/admin/looks', days,
        });
      });

      // Sort: most urgent first (overdue → today → soonest)
      all.sort((a, b) => a.days - b.days);

      setItems(all);
      setLoading(false);
    };

    load();
  }, []);

  const overdueCount = items.filter(i => i.days < 0).length;
  const todayCount = items.filter(i => i.days === 0).length;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-center mb-6">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/40">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#c49a3c]" />
          <h2 className="text-sm font-semibold text-foreground">Upcoming Deadlines</h2>
          {(overdueCount > 0 || todayCount > 0) && (
            <span className="text-xs text-muted-foreground">
              {overdueCount > 0 && <span className="text-red-500 font-medium">{overdueCount} overdue</span>}
              {overdueCount > 0 && todayCount > 0 && ' · '}
              {todayCount > 0 && <span className="text-amber-600 font-medium">{todayCount} due today</span>}
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Next 30 days</span>
      </div>
      <div className="divide-y divide-border max-h-[280px] overflow-y-auto">
        {items.slice(0, 12).map((item) => {
          const meta = moduleMeta[item.module];
          const Icon = meta.icon;
          return (
            <button
              key={`${item.module}-${item.id}`}
              onClick={() => navigate(item.href)}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${meta.tone}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {meta.label} · {item.subtitle}
                </p>
              </div>
              <CountdownBadge eventDate={item.eventDate} />
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
