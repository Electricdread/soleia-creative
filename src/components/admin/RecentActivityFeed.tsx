import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Activity, FileSignature, ClipboardCheck, Image as ImageIcon, Loader2, ChevronRight, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActivityKind = 'signed' | 'brief' | 'mood' | 'upload';

interface ActivityItem {
  kind: ActivityKind;
  id: string;
  title: string;
  subtitle: string;
  at: string;
  href: string;
  /** A file opens in Drive rather than navigating the admin app. */
  external?: string;
}

const KIND_META: Record<ActivityKind, { icon: typeof Activity; label: string; tone: string; bg: string }> = {
  signed: { icon: FileSignature, label: 'Proposal signed', tone: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  brief: { icon: ClipboardCheck, label: 'Creative brief submitted', tone: 'text-primary', bg: 'bg-primary/10' },
  mood: { icon: ImageIcon, label: 'Mood board update', tone: 'text-[#c49a3c]', bg: 'bg-[#c49a3c]/10' },
  upload: { icon: FileUp, label: 'File in the Drive folder', tone: 'text-blue-500', bg: 'bg-blue-500/10' },
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
      const [signed, briefs, mood, uploads, packets, proposalFolders, jobFolders] = await Promise.all([
        supabase.from('proposals')
          .select('id, event_name, client_name, client_signature, signed_at, token')
          .not('signed_at', 'is', null).gte('signed_at', since)
          .order('signed_at', { ascending: false }).limit(20),
        supabase.from('creative_briefs')
          .select('id, creative_session_id, submitted_at, creative_sessions!inner(project_name, client_name)')
          .not('submitted_at', 'is', null).gte('submitted_at', since)
          .order('submitted_at', { ascending: false }).limit(20),
        supabase.from('mood_board_items')
          .select('id, session_id, title, added_by, created_at, creative_sessions!inner(project_name, client_name, token)')
          .gte('created_at', since)
          .order('created_at', { ascending: false }).limit(20),
        // Anything the watcher has seen land in a client folder — the PM's own
        // uploads from an event's Docs tab as much as the client's.
        supabase.from('drive_seen_files')
          .select('drive_file_id, drive_folder_id, file_name, parent_folder_name, web_view_link, seen_at')
          .gte('seen_at', since)
          .order('seen_at', { ascending: false }).limit(25),
        supabase.from('pre_call_packets')
          .select('title, job_id, drive_folder_id').not('drive_folder_id', 'is', null),
        supabase.from('proposals')
          .select('event_name, job_id, drive_folder_id').not('drive_folder_id', 'is', null),
        supabase.from('jobs')
          .select('id, title, drive_folder_id').not('drive_folder_id', 'is', null),
      ]);

      // drive_seen_files knows a folder, not a job, so the folder is the join
      // back to something a person recognises.
      const folderOwner = new Map<string, { label: string; jobId: string | null }>();
      (jobFolders.data ?? []).forEach((j) => {
        if (j.drive_folder_id) folderOwner.set(j.drive_folder_id, { label: j.title, jobId: j.id });
      });
      (proposalFolders.data ?? []).forEach((p) => {
        if (p.drive_folder_id) folderOwner.set(p.drive_folder_id, { label: p.event_name, jobId: p.job_id ?? null });
      });
      (packets.data ?? []).forEach((k) => {
        if (k.drive_folder_id) folderOwner.set(k.drive_folder_id, { label: k.title, jobId: k.job_id ?? null });
      });

      const all: ActivityItem[] = [];

      (signed.data || []).forEach((p: any) => {
        all.push({
          kind: 'signed', id: p.id,
          title: `${p.event_name} signed by ${p.client_signature || p.client_name}`,
          subtitle: p.client_name,
          at: p.signed_at,
          href: `/admin/proposals?focus=${p.id}`,
        });
      });
      (briefs.data || []).forEach((b: any) => {
        all.push({
          kind: 'brief', id: b.id,
          title: `${b.creative_sessions?.project_name || 'Session'} — brief in`,
          subtitle: b.creative_sessions?.client_name || '',
          at: b.submitted_at,
          href: `/admin/creative?focus=${b.creative_session_id}`,
        });
      });
      (mood.data || []).forEach((m: any) => {
        all.push({
          kind: 'mood', id: m.id,
          title: m.title || 'Mood board item',
          subtitle: `${m.creative_sessions?.project_name || 'Session'} · added by ${m.added_by || 'someone'}`,
          at: m.created_at,
          href: `/admin/creative?focus=${m.session_id}`,
        });
      });

      (uploads.data || []).forEach((f) => {
        if (!f.seen_at) return;
        const owner = f.drive_folder_id ? folderOwner.get(f.drive_folder_id) : undefined;
        all.push({
          kind: 'upload', id: f.drive_file_id,
          title: f.file_name,
          subtitle: [owner?.label, f.parent_folder_name].filter(Boolean).join(' · ') || 'Drive',
          at: f.seen_at,
          href: owner?.jobId ? `/admin/jobs/${owner.jobId}` : '/admin/jobs',
          external: f.web_view_link ?? undefined,
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_briefs' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_board_items' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drive_seen_files' }, load)
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
            <p className="text-xs text-muted-foreground mt-1">Signatures, submitted briefs, mood board updates and files landing in Drive will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.slice(0, 12).map((it) => {
              const meta = KIND_META[it.kind];
              const Icon = meta.icon;
              return (
                <button
                  key={`${it.kind}-${it.id}`}
                  onClick={() => {
                    // A file is worth opening where it lives; everything else
                    // is a place in the admin app.
                    if (it.external) window.open(it.external, '_blank', 'noopener,noreferrer');
                    else navigate(it.href);
                  }}
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
