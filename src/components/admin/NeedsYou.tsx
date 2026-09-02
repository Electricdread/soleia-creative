import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useJobs } from '@/hooks/useJobs';
import { nextAction, daysUntil, ACTION_KIND_ORDER } from '@/lib/jobStage';
import type { JobWithMembers, NextAction } from '@/lib/jobStage';

/**
 * The four ways this list is worth reading.
 *
 * Priority is the one that answers "what now", and stays the default. The rest
 * exist because triage is not the only thing done with a list of live jobs: a
 * deadline sweep wants date order, a batch of the same chore wants its verb
 * grouped, and looking for one job by name wants the alphabet.
 */
type SortKey = 'priority' | 'event' | 'action' | 'name';

const SORT_LABEL: Record<SortKey, string> = {
  priority: 'Priority',
  event: 'Soonest event',
  action: 'By action',
  name: 'Job A–Z',
};

const SORT_STORAGE_KEY = 'soleia.needsYou.sort';

const isSortKey = (v: string | null): v is SortKey => v !== null && v in SORT_LABEL;

/** How many rows before the list folds. */
const COLLAPSED_ROWS = 12;

/** No date is not "soonest" — an undated job sorts to the bottom of every view. */
const NO_DATE = 9999;

interface TriageRow {
  j: JobWithMembers;
  action: NextAction;
  days: number | null;
}

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

  const [sortBy, setSortBy] = useState<SortKey>(() => {
    try {
      const saved = localStorage.getItem(SORT_STORAGE_KEY);
      return isSortKey(saved) ? saved : 'priority';
    } catch {
      return 'priority';
    }
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SORT_STORAGE_KEY, sortBy);
    } catch {
      /* private mode — the list just opens on priority next time */
    }
  }, [sortBy]);

  const rows = useMemo(() => {
    const live: TriageRow[] = jobs
      .filter((j) => j.job.is_active)
      .map((j) => ({ j, action: nextAction(j), days: daysUntil(j.job.event_date) }))
      .filter((r): r is TriageRow => r.action !== null)
      // Past events are history, not work.
      .filter((r) => r.days === null || r.days >= 0);

    const byUrgency = (a: TriageRow, b: TriageRow) => a.action.weight - b.action.weight;
    const byDate = (a: TriageRow, b: TriageRow) => (a.days ?? NO_DATE) - (b.days ?? NO_DATE);
    const byName = (a: TriageRow, b: TriageRow) =>
      a.j.job.title.localeCompare(b.j.job.title, undefined, { sensitivity: 'base' }) ||
      (a.j.job.client_name ?? '').localeCompare(b.j.job.client_name ?? '', undefined, { sensitivity: 'base' });
    const byKind = (a: TriageRow, b: TriageRow) =>
      ACTION_KIND_ORDER.indexOf(a.action.kind) - ACTION_KIND_ORDER.indexOf(b.action.kind);

    // Every view falls through to the next key, so no two rows are ever left
    // ordered by nothing — a list that reshuffles between renders is one you
    // stop trusting.
    return live.sort((a, b) => {
      switch (sortBy) {
        case 'event':
          return byDate(a, b) || byUrgency(a, b) || byName(a, b);
        case 'action':
          return byKind(a, b) || byUrgency(a, b) || byDate(a, b) || byName(a, b);
        case 'name':
          return byName(a, b);
        default:
          return byUrgency(a, b) || byDate(a, b) || byName(a, b);
      }
    });
  }, [jobs, sortBy]);

  const visible = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);
  const hidden = rows.length - visible.length;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Needs you</h2>
        {!loading && (
          <span className="text-xs text-muted-foreground">
            {rows.length === 0 ? 'nothing waiting' : `${rows.length} job${rows.length === 1 ? '' : 's'}`}
          </span>
        )}
        {!loading && rows.length > 1 && (
          <select
            aria-label="Sort the triage list"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="ml-auto h-7 rounded-md border border-border bg-card px-1.5 text-[11px] text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
              <option key={key} value={key}>{SORT_LABEL[key]}</option>
            ))}
          </select>
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
        <>
          <div className="divide-y divide-border">
            {visible.map(({ j, action, days }, i) => {
              const urgent = days !== null && days <= 7;
              return (
                <div key={j.job.id} style={{ '--i': i } as CSSProperties} className="rise flex items-center gap-2 px-4 py-2.5 transition-colors duration-300 ease-[cubic-bezier(.16,1,.3,1)] hover:bg-muted/40 motion-reduce:transition-none">
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

          {/* Folding at twelve is fine under Priority, where the tail is the
              least urgent work. Under any other order it would hide rows
              arbitrarily, so the list says how many and offers them. */}
          {(hidden > 0 || expanded) && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full border-t border-border py-2 text-center text-[11px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              {expanded ? 'Show less' : `Show ${hidden} more`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default NeedsYou;
