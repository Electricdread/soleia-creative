import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Activity, FileSignature, MousePointerClick, Upload, Image as ImageIcon, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActivityKind = 'signed' | 'selection' | 'upload' | 'mood';

interface ActivityItem {
  kind: ActivityKind;
  id: string;
  title: string;
  subtitle: string;
  at: string;
  href: string;
}

const KIND_META: Record<ActivityKind, { icon: typeof Activity; label: string; tone: string; bg: string }> = {
  signed: { icon: FileSignature, label: 'Proposal signed', tone: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  selection: { icon: MousePointerClick, label: 'Selection added', tone: 'text-blue-500', bg: 'bg-blue-500/10' },
  upload: { icon: Upload, label: 'Asset uploaded', tone: 'text-purple-500', bg: 'bg-purple-500/10' },
  mood: { icon: ImageIcon, label: 'Mood board update', tone: 'text-[#c49a3c]', bg: 'bg-[#c49a3c]/10' },
};

function fortnightAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  return d.toISOString();
}

export function RecentActivityFeed() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const since = fortnightAgo();
      const [signed, selections, uploads, mood] = await Promise.all([
        supabase.from('proposals')
          .select('id, event_name, client_name, client_signature, signed_at, token')
          .not('signed_at', 'is', null).gte('signed_at', since)
          .order('signed_at', { ascending: false }).limit(20),
        supabase.from('link_selections')
          .select('id, link_id, clip_title, created_at, client_links!inner(event_name, client_name, token)')
          .gte('created_at', since)
          .order('created_at', { ascending: false }).limit(20),
        supabase.from('session_uploads')
          .select('id, link_id, file_name, created_at, client_links!inner(event_name, client_name, token)')
          .gte('created_at', since)
          .order('created_at', { ascending: false }).limit(20),
        supabase.from('mood_board_items')
          .select('id, session_id, title, added_by, created_at, creative_sessions!inner(project_name, client_name, token)')
          .gte('created_at', since)
          .order('created_at', { ascending: false }).limit(20),
      ]);

      const all: ActivityItem[] = [];

      (signed.data || []).forEach((p: any) => {
        all.push({
          kind: 'signed', id: p.id,
          title: `${p.event_name} signed by ${p.client_signature || p.client_name}`,
          subtitle: p.client_name,
          at: p.signed_at,
          href: `/proposal/${p.token}`,
        });
      });
      (selections.data || []).forEach((s: any) => {
        all.push({
          kind: 'selection', id: s.id,
          title: s.clip_title || 'Clip selected',
          subtitle: `${s.client_links?.event_name || 'Link'} · ${s.client_links?.client_name || ''}`,
          at: s.created_at,
          href: '/admin/looks',
        });
      });
      (uploads.data || []).forEach((u: any) => {
        all.push({
          kind: 'upload', id: u.id,
          title: u.file_name || 'Asset uploaded',
          subtitle: `${u.client_links?.event_name || 'Link'} · ${u.client_links?.client_name || ''}`,
          at: u.created_at,
          href: '/admin/looks',
        });
      });
      (mood.data || []).forEach((m: any) => {
        all.push({
          kind: 'mood', id: m.id,
          title: m.title || 'Mood board item',
          subtitle: `${m.creative_sessions?.project_name || 'Session'} · added by ${m.added_by || 'someone'}`,
          at: m.created_at,
          href: `/creative/${m.creative_sessions?.token || ''}`,
        });
      });

      all.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setItems(all);
    } catch (e) {
      console.error('RecentActivityFeed load error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('recent-activity-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'link_selections' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_uploads' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_board_items' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/40">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#c49a3c]" />
          <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          {!loading && (
            <span className="text-xs text-muted-foreground">last 14 days</span>
          )}
        </div>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Activity className="w-7 h-7 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">Client signatures, uploads, and selections will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.slice(0, 12).map((it) => {
              const meta = KIND_META[it.kind];
              const Icon = meta.icon;
              return (
                <button
                  key={`${it.kind}-${it.id}`}
                  onClick={() => navigate(it.href)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className={cn('w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0', meta.bg)}>
                    <Icon className={cn('w-3.5 h-3.5', meta.tone)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{it.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {meta.label} · {it.subtitle}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(it.at), { addSuffix: false })}
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
