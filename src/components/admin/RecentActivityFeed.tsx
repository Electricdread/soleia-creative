import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Activity, FileSignature, ClipboardCheck, Image as ImageIcon, Loader2, ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActivityKind = 'signed' | 'brief' | 'mood' | 'upload';

interface ActivityFile {
  id: string;
  name: string;
  folder: string | null;
  at: string;
  url?: string;
}

interface ActivityItem {
  kind: ActivityKind;
  id: string;
  title: string;
  subtitle: string;
  at: string;
  href: string;
  /**
   * Files arrive in handfuls — two logos and a deck in the same minute — and
   * one row each pushed a signed proposal off the list. A folder row stands
   * for the lot and opens when asked.
   */
  files?: ActivityFile[];
}

const KIND_META: Record<ActivityKind, { icon: typeof Activity; label: string; tone: string; bg: string }> = {
  signed: { icon: FileSignature, label: 'Proposal signed', tone: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  brief: { icon: ClipboardCheck, label: 'Creative brief submitted', tone: 'text-primary', bg: 'bg-primary/10' },
  mood: { icon: ImageIcon, label: 'Mood board update', tone: 'text-[#c49a3c]', bg: 'bg-[#c49a3c]/10' },
  upload: { icon: Folder, label: 'Uploaded to Drive', tone: 'text-blue-500', bg: 'bg-blue-500/10' },
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
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (id: string) =>
    setOpenFolders((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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

      // One row per folder that received something, not one per file.
      const groups = new Map<string, ActivityItem>();
      (uploads.data || []).forEach((f) => {
        if (!f.seen_at || !f.drive_folder_id) return;
        const owner = folderOwner.get(f.drive_folder_id);
        const key = `${f.drive_folder_id}:${f.parent_folder_name ?? ''}`;
        const file: ActivityFile = {
          id: f.drive_file_id,
          name: f.file_name,
          folder: f.parent_folder_name,
          at: f.seen_at,
          url: f.web_view_link ?? undefined,
        };
        const existing = groups.get(key);
        if (existing) {
          existing.files!.push(file);
          // The group carries the newest arrival's time, which is what the
          // feed sorts on.
          if (new Date(f.seen_at) > new Date(existing.at)) existing.at = f.seen_at;
          return;
        }
        groups.set(key, {
          kind: 'upload',
          id: key,
          title: [owner?.label, f.parent_folder_name].filter(Boolean).join(' · ') || 'Drive folder',
          subtitle: '',
          at: f.seen_at,
          href: owner?.jobId ? `/admin/jobs/${owner.jobId}` : '/admin/jobs',
          files: [file],
        });
      });
      groups.forEach((group) => {
        const count = group.files!.length;
        group.subtitle = `${count} file${count === 1 ? '' : 's'}`;
        all.push(group);
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
              const isFolder = it.kind === 'upload';
              const open = isFolder && openFolders.has(it.id);
              const Icon = isFolder ? (open ? FolderOpen : Folder) : meta.icon;
              return (
                <div key={`${it.kind}-${it.id}`}>
                <button
                  onClick={() => (isFolder ? toggleFolder(it.id) : navigate(it.href))}
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
                  {isFolder ? (
                    open
                      ? <ChevronDown className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      : <ChevronRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                  )}
                </button>

                {open && (
                  <ul className="border-t border-border bg-blue-500/5 px-4 py-1.5">
                    {it.files!.map((f) => (
                      <li key={f.id} className="flex items-center gap-2 py-1">
                        <span className="h-1 w-1 flex-shrink-0 rounded-full bg-blue-500/60" />
                        {f.url ? (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 flex-1 truncate text-xs text-foreground hover:text-primary hover:underline"
                          >
                            {f.name}
                          </a>
                        ) : (
                          <span className="min-w-0 flex-1 truncate text-xs text-foreground">{f.name}</span>
                        )}
                        <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(f.at), { addSuffix: false })}
                        </span>
                      </li>
                    ))}
                    <li className="pt-1">
                      <button
                        onClick={() => navigate(it.href)}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        Open the job →
                      </button>
                    </li>
                  </ul>
                )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
