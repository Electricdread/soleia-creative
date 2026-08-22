import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { FINAL_SLOTS, isFinalsFolder, type FinalSlot } from '@/lib/finalSlots';
import { AlertTriangle, ExternalLink } from 'lucide-react';

/**
 * Which finished files have arrived, per surface.
 *
 * Queried by Drive folder rather than by proposal: a packet folder is watched
 * too and its `drive_seen_files` rows carry a null `proposal_id`, so filtering
 * on the proposal would quietly miss every final a packet-only job delivers.
 *
 * A file dropped loose in 04_Finals rather than a subfolder lights nothing and
 * is called out instead. Counting it against a surface nobody chose would hide
 * exactly the mistake the subfolders exist to prevent.
 */

interface SeenRow {
  final_slot: string | null;
  parent_folder_name: string | null;
  file_name: string;
  web_view_link: string | null;
  seen_at: string | null;
}

export interface FinalsRowProps {
  /** Every Drive folder this job is watched under. */
  folderIds: string[];
  /** Opens the client's Drive folder, when the job has one. */
  driveUrl?: string | null;
}

function ago(iso: string | null): string {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

export function FinalsRow({ folderIds, driveUrl }: FinalsRowProps) {
  const [rows, setRows] = useState<SeenRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (folderIds.length === 0) { setRows([]); return; }
    (async () => {
      const { data } = await supabase
        .from('drive_seen_files')
        .select('final_slot, parent_folder_name, file_name, web_view_link, seen_at')
        .in('drive_folder_id', folderIds)
        .order('seen_at', { ascending: false });
      if (!cancelled) setRows((data as SeenRow[] | null) ?? []);
    })();
    return () => { cancelled = true; };
  }, [folderIds.join(',')]);

  if (rows === null) return null;

  const bySlot = new Map<FinalSlot, SeenRow[]>();
  for (const r of rows) {
    if (!r.final_slot) continue;
    const slot = r.final_slot as FinalSlot;
    if (!bySlot.has(slot)) bySlot.set(slot, []);
    bySlot.get(slot)!.push(r);
  }

  // Sitting in the finals folder itself, not in one of the four subfolders.
  // Clients name it by hand — Whatnot's is called just "Finals" — so the test
  // is on what the name means, not on our own spelling of it.
  const unfiled = rows.filter((r) => !r.final_slot && isFinalsFolder(r.parent_folder_name));

  const newest = rows.find((r) => !!r.final_slot);

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">Finals received</h3>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {bySlot.size} / {FINAL_SLOTS.length}
        </span>
        {driveUrl && (
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            Drive <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-2 px-4 py-3.5">
        {FINAL_SLOTS.map((def) => {
          const hits = bySlot.get(def.slot) ?? [];
          const lit = hits.length > 0;
          const first = hits[0];
          const body = (
            <>
              <span
                className={cn(
                  'h-2 w-2 flex-shrink-0 rounded-full',
                  lit ? 'bg-primary ring-4 ring-primary/20' : 'bg-muted-foreground/30',
                )}
              />
              {def.label}
              {lit && (
                <span className="font-mono text-[10px] opacity-80">
                  {hits.length} file{hits.length === 1 ? '' : 's'}
                </span>
              )}
            </>
          );
          const cls = cn(
            'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors',
            lit
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground',
          );
          return first?.web_view_link ? (
            <a
              key={def.slot}
              href={first.web_view_link}
              target="_blank"
              rel="noopener noreferrer"
              title={`${first.file_name} — ${ago(first.seen_at)}`}
              className={cn(cls, 'hover:bg-primary/20')}
            >
              {body}
            </a>
          ) : (
            <span key={def.slot} className={cls} title={lit ? undefined : def.hint}>
              {body}
            </span>
          );
        })}
      </div>

      {newest && (
        <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          Newest: <span className="text-foreground">{newest.file_name}</span> · {ago(newest.seen_at)}
        </p>
      )}

      {unfiled.length > 0 && (
        <div className="flex items-start gap-2 border-t border-border bg-amber-500/10 px-4 py-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-foreground">
            {unfiled.length} file{unfiled.length === 1 ? '' : 's'} sitting loose in the Finals folder —
            not in a surface subfolder, so nothing above counts {unfiled.length === 1 ? 'it' : 'them'}.
            <span className="ml-1 text-muted-foreground">{unfiled.map((u) => u.file_name).join(', ')}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default FinalsRow;
