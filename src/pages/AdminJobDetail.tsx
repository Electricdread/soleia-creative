import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, FileText, BookOpen, Palette, AlertTriangle, ArrowLeft, ExternalLink,
  FolderOpen, Check, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJobs } from '@/hooks/useJobs';
import { AssigneePicker, type Colleague } from '@/components/admin/AssigneePicker';
import { fetchJobAssignees, saveJobAssignees } from '@/lib/jobAssignees';
import { FinalsRow } from '@/components/admin/FinalsRow';
import { DeleteJobDialog } from '@/components/admin/DeleteJobDialog';
import { ClientAssetsRow } from '@/components/admin/ClientAssetsRow';
import {
  stageFor, stagesFor, flagsFor, daysUntil, STAGE_LABEL,
  type Stage, type JobTrack,
} from '@/lib/jobStage';

/**
 * The schedule counts forward from kickoff, never backwards from the event —
 * see src/components/proposal/ProposalTerms.tsx, which is the authoritative
 * statement of the terms. Kickoff is a condition, not a date: signed proposal
 * and brand assets both in hand.
 */
const SCHEDULE = [
  { label: 'First review cut', detail: '14 days from kickoff' },
  { label: 'Client review window', detail: '3 days' },
  { label: 'Final revisions', detail: '7 business days before the show' },
];

export default function AdminJobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jobs, loading, error, reload } = useJobs(id);
  const [saving, setSaving] = useState(false);
  const [assignees, setAssignees] = useState<Colleague[]>([]);

  const entry = jobs[0];

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchJobAssignees(id).then((rows) => { if (!cancelled) setAssignees(rows); });
    return () => { cancelled = true; };
  }, [id]);

  const updateAssignees = async (next: Colleague[]) => {
    if (!id) return;
    const before = assignees;
    setAssignees(next);                       // optimistic — the picker should feel instant
    const ok = await saveJobAssignees(id, next);
    if (!ok) {
      setAssignees(before);
      toast.error('Could not save who is on this job');
    }
  };

  const save = async (patch: Record<string, unknown>) => {
    if (!entry) return;
    setSaving(true);
    const { error: err } = await supabase.from('jobs').update(patch).eq('id', entry.job.id);
    setSaving(false);
    if (err) {
      toast.error(err.message);
      return;
    }
    toast.success('Saved');
    void reload();
  };

  if (loading) {
    return (
      <AdminShell title="Job">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminShell>
    );
  }

  if (error || !entry) {
    return (
      <AdminShell title="Job">
        <p className="py-16 text-center text-sm text-muted-foreground">
          {error ?? 'That job does not exist.'}
        </p>
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/jobs')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> All jobs
          </Button>
        </div>
      </AdminShell>
    );
  }

  const { job, proposals, packets, sessions, assetCount } = entry;
  const { stage, reason, done } = stageFor(entry);
  const flags = flagsFor(entry);
  const days = daysUntil(job.event_date);
  // The creative-call step only exists here when a meeting was scheduled (or a
  // call logged anyway) — not every client has one.
  const stages = stagesFor(entry);
  const signed = proposals.find((p) => !!p.signed_at);
  const kickoff = !!signed && assetCount > 0;

  // A job usually has no folder of its own — the packet made it, and the job
  // row's column stayed null. Falling back to whatever folder its records hold
  // is the difference between a Drive button and no way in at all.
  const folderIds = Array.from(new Set([
    job.drive_folder_id,
    ...proposals.map((p) => p.drive_folder_id),
    ...packets.map((k) => k.drive_folder_id),
  ].filter(Boolean) as string[]));
  const driveUrl = job.drive_folder_url
    ?? (folderIds[0] ? `https://drive.google.com/drive/folders/${folderIds[0]}` : null);

  const subtitle = [
    job.client_name !== job.title ? job.client_name : null,
    job.event_date ?? 'no event date',
    days === null ? null : days < 0 ? `${Math.abs(days)} days ago` : `${days} days out`,
  ].filter(Boolean).join(' · ');

  return (
    <AdminShell
      title={job.title}
      subtitle={subtitle}
      actions={
        <>
          {driveUrl && (
            <Button variant="outline" size="sm" onClick={() => window.open(driveUrl, '_blank', 'noopener')}>
              <FolderOpen className="mr-2 h-4 w-4" /> Drive
            </Button>
          )}
          <DeleteJobDialog
            entry={entry}
            onDeleted={() => navigate('/admin/jobs')}
            trigger={
              <Button variant="outline" size="sm" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" asChild>
                <span><Trash2 className="mr-2 h-4 w-4" /> Delete</span>
              </Button>
            }
          />
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/jobs')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> All jobs
          </Button>
        </>
      }
    >
      {/* Stage tracker */}
      <div className="mb-6 overflow-x-auto rounded-xl border border-border bg-card">
        <div className="flex min-w-[640px]">
          {stages.map((s) => {
            const isDone = done.includes(s);
            const isNow = s === stage;
            return (
              <div
                key={s}
                className={cn(
                  'flex-1 border-r border-border px-3 py-3 last:border-r-0',
                  isDone && 'bg-emerald-500/10',
                  isNow && 'bg-primary/10',
                )}
              >
                <div className="flex items-center gap-1.5">
                  {isDone && <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />}
                  <span className={cn(
                    'font-mono text-[10px] uppercase tracking-wider',
                    isNow ? 'text-primary' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                  )}>
                    {STAGE_LABEL[s]}
                  </span>
                </div>
                {isNow && <p className="mt-1 text-xs font-medium text-foreground">{reason}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Finished files, per surface. Every folder this job is watched under —
          a packet folder's rows carry no proposal_id, so folder is the join. */}
      <ClientAssetsRow folderIds={folderIds} driveUrl={driveUrl} />

      <FinalsRow folderIds={folderIds} driveUrl={driveUrl} />

      {flags.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground">Blocking</h3>
            <span className="ml-auto font-mono text-xs text-muted-foreground">{flags.length}</span>
          </div>
          <ul className="divide-y divide-border">
            {flags.map((f) => (
              <li key={f.label} className="flex items-center gap-3 px-4 py-2.5">
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                <span className="min-w-0 flex-1 text-sm text-foreground">{f.label}</span>
                {f.verb && f.href && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-shrink-0 font-mono text-[10px] uppercase tracking-wider"
                    onClick={() => navigate(f.href!)}
                  >
                    {f.verb}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Attached records */}
        <div className="space-y-4">
          <Section icon={FileText} label="Proposals" empty="No proposal raised.">
            {proposals.map((p) => (
              <Row
                key={p.id}
                title={p.event_name}
                detail={[p.signed_at ? 'signed' : (p.status ?? 'draft'),
                         p.signoff_due_on ? `due ${p.signoff_due_on}` : null,
                         p.is_active ? null : 'archived'].filter(Boolean).join(' · ')}
                onOpen={() => navigate(`/admin/proposals?focus=${p.id}`)}
                publicHref={p.token ? `/proposal/${p.token}` : null}
              />
            ))}
          </Section>

          <Section icon={BookOpen} label="Packets" empty="No packet sent.">
            {packets.map((p) => (
              <Row
                key={p.id}
                title={p.title}
                detail={[p.kind?.replace(/_/g, ' '), p.is_active ? null : 'archived'].filter(Boolean).join(' · ')}
                onOpen={() => navigate(`/admin/packets?focus=${p.id}`)}
                publicHref={p.token ? `/packet/${p.token}` : null}
              />
            ))}
          </Section>

          <Section icon={Palette} label="Creative sessions" empty="No session created.">
            {sessions.map((s) => (
              <Row
                key={s.id}
                title={s.project_name}
                detail={s.is_active ? 'active' : 'archived'}
                onOpen={() => navigate(`/admin/creative?focus=${s.id}`)}
                publicHref={s.token ? `/creative/${s.token}` : null}
              />
            ))}
          </Section>
        </div>

        {/* What only a person can set */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Job</h3>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Track</Label>
                <div className="mt-1.5 flex gap-2">
                  {(['creative', 'in_house'] as JobTrack[]).map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant={job.track === t ? 'default' : 'outline'}
                      disabled={saving}
                      onClick={() => job.track !== t && save({ track: t })}
                    >
                      {t === 'creative' ? 'Creative services' : 'In-house'}
                    </Button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  In-house buys no creative services, so it is never chased for a proposal.
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Assigned to</Label>
                <div className="mt-1.5">
                  <AssigneePicker value={assignees} onChange={updateAssignees} />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Emailed when the client submits their brief, alongside the studio inbox.
                </p>
              </div>

              <div>
                <Label htmlFor="event_date" className="text-xs text-muted-foreground">Event date</Label>
                <Input
                  id="event_date"
                  type="date"
                  defaultValue={job.event_date ?? ''}
                  disabled={saving}
                  onBlur={(e) => {
                    const v = e.target.value || null;
                    if (v !== job.event_date) save({ event_date: v });
                  }}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="call_held_on" className="text-xs text-muted-foreground">Creative call held</Label>
                <Input
                  id="call_held_on"
                  type="date"
                  defaultValue={job.call_held_on ?? ''}
                  disabled={saving || job.track === 'in_house'}
                  onBlur={(e) => {
                    const v = e.target.value || null;
                    if (v !== job.call_held_on) save({ call_held_on: v });
                  }}
                  className="mt-1.5"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Nothing recorded this before, so the call stage was invisible.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Kickoff</h3>
              <Badge variant={kickoff ? 'default' : 'outline'} className="text-[10px] uppercase tracking-wider">
                {kickoff ? 'reached' : 'blocked'}
              </Badge>
            </div>
            <ul className="space-y-1.5 text-xs">
              <li className={cn('flex items-center gap-2', signed ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                {signed ? <Check className="h-3 w-3" /> : <span className="h-3 w-3" />}
                Proposal signed
              </li>
              <li className={cn('flex items-center gap-2', assetCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                {assetCount > 0 ? <Check className="h-3 w-3" /> : <span className="h-3 w-3" />}
                Brand assets in the Drive folder ({assetCount})
              </li>
            </ul>

            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Then, counting forward
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {SCHEDULE.map((s) => (
                  <li key={s.label} className="flex justify-between gap-3">
                    <span>{s.label}</span>
                    <span className="flex-shrink-0 tabular-nums">{kickoff ? s.detail : '—'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Section({
  icon: Icon, label, empty, children,
}: {
  icon: typeof FileText; label: string; empty: string; children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasAny = items.some(Boolean) && items.flat().length > 0;
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      </div>
      {hasAny ? <div className="divide-y divide-border">{children}</div>
              : <p className="px-4 py-4 text-xs text-muted-foreground">{empty}</p>}
    </div>
  );
}

function Row({
  title, detail, onOpen, publicHref,
}: {
  title: string; detail: string; onOpen: () => void; publicHref: string | null;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5">
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm text-foreground">{title}</p>
        {detail && <p className="truncate text-[11px] text-muted-foreground">{detail}</p>}
      </button>
      {publicHref && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0 text-muted-foreground"
          onClick={() => window.open(publicHref, '_blank', 'noopener')}
          aria-label="Open the client page"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
