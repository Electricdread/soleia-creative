import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Palette, Video, CloudDownload, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Stats {
  proposalsActive: number;
  proposalsSent: number;
  proposalsSigned: number;
  proposalsDraft: number;
  sessionsActive: number;
  sessionsPublic: number;
  moodWeek: number;
  linksActive: number;
  linksWithSelections: number;
  uploadsTotal: number;
  uploadsWeek: number;
}

const ZERO: Stats = {
  proposalsActive: 0, proposalsSent: 0, proposalsSigned: 0, proposalsDraft: 0,
  sessionsActive: 0, sessionsPublic: 0, moodWeek: 0,
  linksActive: 0, linksWithSelections: 0,
  uploadsTotal: 0, uploadsWeek: 0,
};

function weekAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

export function DashboardStatusGrid() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>(ZERO);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const since = weekAgo();
      const [proposals, sessions, mood, links, selections, uploadsAll, uploadsWk] = await Promise.all([
        supabase.from('proposals').select('id, status, is_active, signed_at'),
        supabase.from('creative_sessions').select('id, is_active, is_public'),
        supabase.from('mood_board_items').select('id, created_at').gte('created_at', since),
        supabase.from('client_links').select('id, is_active'),
        supabase.from('link_selections').select('link_id'),
        supabase.from('session_uploads').select('id', { count: 'exact', head: true }),
        supabase.from('session_uploads').select('id', { count: 'exact', head: true }).gte('created_at', since),
      ]);

      const activeProposals = (proposals.data || []).filter(p => p.is_active);
      const linksActiveList = (links.data || []).filter(l => l.is_active);
      const linksWithSel = new Set((selections.data || []).map((s: any) => s.link_id));

      setStats({
        proposalsActive: activeProposals.length,
        proposalsSent: activeProposals.filter(p => p.status === 'sent').length,
        proposalsSigned: activeProposals.filter(p => !!p.signed_at || p.status === 'signed' || p.status === 'accepted').length,
        proposalsDraft: activeProposals.filter(p => p.status === 'draft').length,
        sessionsActive: (sessions.data || []).filter(s => s.is_active).length,
        sessionsPublic: (sessions.data || []).filter(s => s.is_active && s.is_public).length,
        moodWeek: mood.data?.length || 0,
        linksActive: linksActiveList.length,
        linksWithSelections: linksActiveList.filter(l => linksWithSel.has(l.id)).length,
        uploadsTotal: uploadsAll.count || 0,
        uploadsWeek: uploadsWk.count || 0,
      });
    } catch (e) {
      console.error('DashboardStatusGrid load error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('dashboard-status-grid')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_sessions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_links' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_uploads' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'link_selections' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_board_items' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const cards = [
    {
      title: 'Proposals',
      icon: FileText,
      tone: 'text-blue-500',
      ring: 'hover:border-blue-500/40',
      primary: stats.proposalsActive,
      primaryLabel: 'active',
      sub: [
        { label: 'sent', value: stats.proposalsSent, color: 'text-amber-500' },
        { label: 'signed', value: stats.proposalsSigned, color: 'text-emerald-500' },
        { label: 'draft', value: stats.proposalsDraft, color: 'text-muted-foreground' },
      ],
      href: '/admin/proposals',
    },
    {
      title: 'Creative Sessions',
      icon: Palette,
      tone: 'text-[#c49a3c]',
      ring: 'hover:border-[#c49a3c]/40',
      primary: stats.sessionsActive,
      primaryLabel: 'active',
      sub: [
        { label: 'public', value: stats.sessionsPublic, color: 'text-emerald-500' },
        { label: 'mood items / 7d', value: stats.moodWeek, color: 'text-blue-500' },
      ],
      href: '/admin/creative',
    },
    {
      title: 'Content Previz',
      icon: Video,
      tone: 'text-emerald-500',
      ring: 'hover:border-emerald-500/40',
      primary: stats.linksActive,
      primaryLabel: 'links live',
      sub: [
        { label: 'with selections', value: stats.linksWithSelections, color: 'text-emerald-500' },
        { label: 'awaiting', value: Math.max(0, stats.linksActive - stats.linksWithSelections), color: 'text-amber-500' },
      ],
      href: '/admin/looks',
    },
    {
      title: 'Asset Uploads',
      icon: Upload,
      tone: 'text-purple-500',
      ring: 'hover:border-purple-500/40',
      primary: stats.uploadsWeek,
      primaryLabel: 'this week',
      sub: [
        { label: 'all-time', value: stats.uploadsTotal, color: 'text-muted-foreground' },
      ],
      href: '/admin/looks',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.title}
            onClick={() => navigate(card.href)}
            className={cn(
              'group relative bg-card border border-border rounded-xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-md min-h-[120px] flex flex-col',
              card.ring,
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-9 h-9 rounded-lg bg-muted flex items-center justify-center', card.tone)}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
            </div>
            <div className="flex items-baseline gap-1.5 mb-0.5">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <span className="text-3xl font-bold text-foreground leading-none">{card.primary}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{card.primaryLabel}</span>
                </>
              )}
            </div>
            <p className="text-xs font-medium text-foreground mb-2">{card.title}</p>
            <div className="mt-auto flex flex-wrap gap-x-2 gap-y-0.5">
              {card.sub.map((s) => (
                <span key={s.label} className="text-[10px] text-muted-foreground">
                  <span className={cn('font-semibold', s.color)}>{s.value}</span> {s.label}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
