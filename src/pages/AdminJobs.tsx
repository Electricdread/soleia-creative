import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, BookOpen, Palette, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJobs } from '@/hooks/useJobs';
import { DeleteJobDialog } from '@/components/admin/DeleteJobDialog';
import {
  stageFor, flagsFor, daysUntil, CREATIVE_STAGES, STAGE_LABEL, type Stage,
} from '@/lib/jobStage';

const STAGE_TONE: Record<Stage, string> = {
  booked: 'text-muted-foreground',
  packet_sent: 'text-blue-500',
  call_held: 'text-blue-500',
  proposal_out: 'text-amber-600 dark:text-amber-400',
  awaiting_assets: 'text-amber-600 dark:text-amber-400',
  in_production: 'text-emerald-600 dark:text-emerald-400',
};

function Countdown({ eventDate }: { eventDate: string | null }) {
  const days = daysUntil(eventDate);
  if (days === null) {
    return <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">no date</span>;
  }
  const tone =
    days < 0 ? 'text-muted-foreground'
    : days <= 7 ? 'text-red-600 dark:text-red-400'
    : days <= 21 ? 'text-amber-600 dark:text-amber-400'
    : 'text-muted-foreground';
  return (
    <span className={cn('font-mono text-[11px] tabular-nums', tone)}>
      {days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? 'today' : `${days}d`}
    </span>
  );
}

export default function AdminJobs() {
  const navigate = useNavigate();
  const { jobs, loading, error, reload } = useJobs();
  const [showPast, setShowPast] = useState(false);

  const rows = useMemo(
    () => jobs.map((j) => ({ ...j, ...stageFor(j), flags: flagsFor(j) })),
    [jobs],
  );

  const [live, past] = useMemo(() => {
    const isPast = (r: (typeof rows)[number]) => {
      const d = daysUntil(r.job.event_date);
      return !r.job.is_active || (d !== null && d < 0);
    };
    return [rows.filter((r) => !isPast(r)), rows.filter(isPast)];
  }, [rows]);

  const shown = showPast ? past : live;

  const byStage = useMemo(() => {
    const map = new Map<Stage, typeof shown>();
    CREATIVE_STAGES.forEach((s) => map.set(s, []));
    shown.forEach((r) => map.get(r.stage)!.push(r));
    return map;
  }, [shown]);

  const flagged = live.filter((r) => r.flags.length > 0).length;

  return (
    <AdminShell
      title="Jobs"
      subtitle={loading ? 'Loading…' : `${live.length} live · ${past.length} past${flagged ? ` · ${flagged} need a decision` : ''}`}
      actions={
        <Button variant="outline" size="sm" onClick={() => setShowPast((v) => !v)}>
          {showPast ? 'Show live' : `Show past (${past.length})`}
        </Button>
      }
    >
      {error && (
        <p className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {showPast ? 'No past jobs.' : 'No live jobs.'}
        </p>
      ) : (
        <div className="space-y-8">
          {CREATIVE_STAGES.map((stage) => {
            const items = byStage.get(stage) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={stage}>
                <div className="mb-3 flex items-baseline gap-3 border-b border-border pb-2">
                  <h2 className={cn('font-display text-lg', STAGE_TONE[stage])}>{STAGE_LABEL[stage]}</h2>
                  <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
                </div>

                <div className="space-y-2">
                  {/* The row was one button, which cannot hold another; the
                      delete control is a sibling of the opener now. */}
                  {items.map((r) => (
                    <div
                      key={r.job.id}
                      className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <button
                        onClick={() => navigate(`/admin/jobs/${r.job.id}`)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium text-foreground">{r.job.title}</span>
                          {r.job.track === 'in_house' && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">In-house</Badge>
                          )}
                          {r.flags.length > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" />
                              {r.flags.length}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {r.job.client_name !== r.job.title && <>{r.job.client_name} · </>}
                          {r.reason}
                        </p>
                      </button>

                      <div className="hidden flex-shrink-0 items-center gap-2.5 text-muted-foreground sm:flex">
                        {r.proposals.length > 0 && (
                          <span className="flex items-center gap-1 text-[11px]"><FileText className="h-3 w-3" />{r.proposals.length}</span>
                        )}
                        {r.packets.length > 0 && (
                          <span className="flex items-center gap-1 text-[11px]"><BookOpen className="h-3 w-3" />{r.packets.length}</span>
                        )}
                        {r.sessions.length > 0 && (
                          <span className="flex items-center gap-1 text-[11px]"><Palette className="h-3 w-3" />{r.sessions.length}</span>
                        )}
                      </div>

                      <Countdown eventDate={r.job.event_date} />

                      <div className="flex-shrink-0 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                        <DeleteJobDialog entry={r} onDeleted={reload} />
                      </div>

                      <button
                        onClick={() => navigate(`/admin/jobs/${r.job.id}`)}
                        aria-label={`Open ${r.job.title}`}
                        className="flex-shrink-0"
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                      </button>
                    </div>
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
