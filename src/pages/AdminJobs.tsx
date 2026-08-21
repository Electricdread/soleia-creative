import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, FileText, BookOpen, Palette, AlertTriangle, ArrowRight, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  deriveJobs, STAGE_ORDER, STAGE_LABEL,
  type DerivedJob, type JobStage, type JobMember,
} from '@/lib/jobs';
import { CountdownBadge } from '@/components/CountdownBadge';

const MEMBER_META: Record<JobMember['kind'], { icon: typeof FileText; href: string; label: string }> = {
  proposal: { icon: FileText, href: '/admin/proposals', label: 'Proposal' },
  packet: { icon: BookOpen, href: '/admin/packets', label: 'Packet' },
  session: { icon: Palette, href: '/admin/creative', label: 'Session' },
};

const STAGE_TONE: Record<JobStage, string> = {
  booked: 'text-muted-foreground',
  packet_sent: 'text-blue-500',
  proposal_out: 'text-amber-600 dark:text-amber-400',
  awaiting_assets: 'text-amber-600 dark:text-amber-400',
  in_production: 'text-emerald-600 dark:text-emerald-400',
};

export default function AdminJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<DerivedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [proposals, packets, sessions, assets, packageItems] = await Promise.all([
          supabase.from('proposals')
            .select('id, token, client_name, event_name, event_date, status, signed_at, is_active, drive_folder_id'),
          supabase.from('pre_call_packets')
            .select('id, token, client_name, title, event_date, kind, is_active, drive_folder_id'),
          supabase.from('creative_sessions')
            .select('id, token, client_name, project_name, event_date, is_active, proposal_id'),
          supabase.from('drive_seen_files').select('proposal_id'),
          supabase.from('proposal_items')
            .select('proposal_id, category, title')
            .eq('client_selected', true),
        ]);
        if (cancelled) return;

        const assetsByProposal: Record<string, number> = {};
        (assets.data ?? []).forEach((row) => {
          if (!row.proposal_id) return;
          assetsByProposal[row.proposal_id] = (assetsByProposal[row.proposal_id] ?? 0) + 1;
        });

        const creativePackageProposalIds = new Set(
          (packageItems.data ?? [])
            .filter((i) =>
              i.category === 'Soleia Creative Package' ||
              (i.title ?? '').toLowerCase().includes('creative package'))
            .map((i) => i.proposal_id),
        );

        setJobs(deriveJobs({
          proposals: (proposals.data ?? []) as never,
          packets: (packets.data ?? []) as never,
          sessions: (sessions.data ?? []) as never,
          assetsByProposal,
          creativePackageProposalIds,
        }));
      } catch (e) {
        console.error('Jobs derivation failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // A job is live if anything under it still is; the rest are history.
  const [live, archived] = useMemo(() => {
    const isLive = (j: DerivedJob) =>
      j.stage !== 'in_production' || !!j.eventDate;
    const past = (j: DerivedJob) =>
      !!j.eventDate && j.eventDate < new Date().toISOString().slice(0, 10);
    return [jobs.filter((j) => !past(j) && isLive(j)), jobs.filter((j) => past(j) || !isLive(j))];
  }, [jobs]);

  const shown = showArchived ? archived : live;
  const byStage = useMemo(() => {
    const map = new Map<JobStage, DerivedJob[]>();
    STAGE_ORDER.forEach((s) => map.set(s, []));
    shown.forEach((j) => map.get(j.stage)!.push(j));
    return map;
  }, [shown]);

  const flaggedCount = live.filter((j) => j.flags.length > 0).length;

  return (
    <AdminShell
      title="Jobs"
      subtitle={loading ? 'Working out the groupings…' : `${live.length} live · ${archived.length} past`}
      actions={
        <Button variant="outline" size="sm" onClick={() => setShowArchived((v) => !v)}>
          {showArchived ? 'Show live' : `Show past (${archived.length})`}
        </Button>
      }
    >
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">These groupings are inferred, not stored.</p>
          <p className="mt-1">
            A job has no row of its own yet. This reads the proposals, packets and sessions that
            already exist and groups records that share a distinguishing name and do not disagree on
            a date. Check them before I write any of it to the database — especially anything
            flagged.
            {flaggedCount > 0 && <> <span className="font-medium text-foreground">{flaggedCount} live job{flaggedCount === 1 ? '' : 's'} carry a flag.</span></>}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {showArchived ? 'No past jobs.' : 'No live jobs.'}
        </p>
      ) : (
        <div className="space-y-8">
          {STAGE_ORDER.map((stage) => {
            const items = byStage.get(stage) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={stage}>
                <div className="mb-3 flex items-baseline gap-3 border-b border-border pb-2">
                  <h2 className={cn('font-display text-lg', STAGE_TONE[stage])}>{STAGE_LABEL[stage]}</h2>
                  <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
                </div>

                <div className="space-y-3">
                  {items.map((job) => (
                    <article
                      key={job.key}
                      className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-medium text-foreground">{job.title}</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {job.client}
                            {job.aliases.length > 1 && (
                              <> · also filed as {job.aliases.filter((a) => a !== job.title).join(', ')}</>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {job.track === 'in_house' && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                              In-house
                            </Badge>
                          )}
                          {job.eventDate
                            ? <CountdownBadge eventDate={job.eventDate} />
                            : <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">no date</span>}
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground">{job.stageReason}</p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.members.map((m) => {
                          const meta = MEMBER_META[m.kind];
                          const Icon = meta.icon;
                          return (
                            <button
                              key={`${m.kind}-${m.id}`}
                              onClick={() => navigate(`${meta.href}?focus=${m.id}`)}
                              className="group flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                            >
                              <Icon className="h-3 w-3" />
                              <span className="max-w-[220px] truncate">{m.label}</span>
                              <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                            </button>
                          );
                        })}
                      </div>

                      {job.flags.length > 0 && (
                        <ul className="mt-3 space-y-1 border-t border-border pt-3">
                          {job.flags.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
