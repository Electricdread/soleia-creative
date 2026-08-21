import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useJobs } from '@/hooks/useJobs';
import { stageFor, daysUntil, nextAction } from '@/lib/jobStage';

/**
 * The shape of the week in four numbers.
 *
 * What this replaces counted rows per table — "3 active proposals" — which is
 * not something anyone can act on when the list underneath already names them.
 * These count jobs by what is true of them.
 */
export function TodayStrip() {
  const navigate = useNavigate();
  const { jobs, loading } = useJobs();

  const counts = useMemo(() => {
    const live = jobs.filter((j) => j.job.is_active);
    const upcoming = live.filter((j) => {
      const d = daysUntil(j.job.event_date);
      return d === null || d >= 0;
    });

    return {
      imminent: upcoming.filter((j) => {
        const d = daysUntil(j.job.event_date);
        return d !== null && d <= 7;
      }).length,
      waiting: upcoming.filter((j) => nextAction(j) !== null).length,
      inProduction: upcoming.filter((j) => stageFor(j).stage === 'in_production').length,
      awaitingAssets: upcoming.filter((j) => stageFor(j).stage === 'awaiting_assets').length,
    };
  }, [jobs]);

  const pills = [
    { value: counts.imminent, label: 'within 7 days', tone: 'alert' as const },
    { value: counts.waiting, label: 'waiting on you', tone: 'warm' as const },
    { value: counts.awaitingAssets, label: 'awaiting assets', tone: 'plain' as const },
    { value: counts.inProduction, label: 'in production', tone: 'plain' as const },
  ];

  if (loading) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((p) => (
        <button
          key={p.label}
          onClick={() => navigate('/admin/jobs')}
          className={cn(
            'flex items-baseline gap-2 rounded-full border bg-card px-3.5 py-1.5 transition-colors hover:border-primary/40',
            p.tone === 'alert' && p.value > 0 ? 'border-red-500/50' : 'border-border',
          )}
        >
          <span className={cn(
            'font-mono text-base font-semibold tabular-nums',
            p.tone === 'alert' && p.value > 0 ? 'text-red-600 dark:text-red-400'
            : p.tone === 'warm' && p.value > 0 ? 'text-primary'
            : 'text-foreground',
          )}>
            {p.value}
          </span>
          <span className="text-xs text-muted-foreground">{p.label}</span>
        </button>
      ))}
    </div>
  );
}

export default TodayStrip;
