import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useJobs } from '@/hooks/useJobs';
import { nextAction, daysUntil } from '@/lib/jobStage';

/**
 * The triage list.
 *
 * What this replaces could only sort by age, because age was all it knew — an
 * unsigned proposal and a job with no assets both read as "N days" with no
 * indication of what to do about either. Every row here names the thing that is
 * waiting and carries the verb that unblocks it.
 */
export function NeedsYou() {
  const navigate = useNavigate();
  const { jobs, loading } = useJobs();

  const rows = useMemo(() => {
    const now = jobs
      .filter((j) => j.job.is_active)
      .map((j) => ({ j, action: nextAction(j), days: daysUntil(j.job.event_date) }))
      .filter((r): r is typeof r & { action: NonNullable<typeof r.action> } => r.action !== null)
      // Past events are history, not work.
      .filter((r) => r.days === null || r.days >= 0);

    return now.sort((a, b) =>
      a.action.weight - b.action.weight ||
      (a.days ?? 9999) - (b.days ?? 9999));
  }, [jobs]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Needs you</h2>
        {!loading && (
          <span className="text-xs text-muted-foreground">
            {rows.length === 0 ? 'nothing waiting' : `${rows.length} job${rows.length === 1 ? '' : 's'}`}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
          <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
          <p className="text-sm font-medium text-foreground">Nothing is waiting on you</p>
          <p className="mt-1 text-xs text-muted-foreground">Every live job has had its next step taken.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {rows.slice(0, 12).map(({ j, action, days }) => {
            const urgent = days !== null && days <= 7;
            return (
              <div key={j.job.id} className="flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-muted/40">
                <button
                  onClick={() => navigate(`/admin/jobs/${j.job.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{j.job.title}</span>
                    {j.job.track === 'in_house' && (
                      <Badge variant="outline" className="flex-shrink-0 text-[9px] uppercase tracking-wider">
                        In-house
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">{action.label}</p>
                </button>

                <span className={cn(
                  'flex-shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[10px] tabular-nums',
                  urgent ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                         : days === null ? 'bg-muted text-muted-foreground'
                         : 'bg-muted text-muted-foreground',
                )}>
                  {days === null ? 'no date' : days === 0 ? 'today' : `${days}d`}
                </span>

                <button
                  onClick={() => navigate(action.href)}
                  className="flex-shrink-0 rounded-md border border-border px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {action.verb}
                </button>

                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NeedsYou;
