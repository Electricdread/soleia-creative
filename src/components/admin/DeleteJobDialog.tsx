import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { JobWithMembers } from '@/lib/jobStage';

/**
 * Deleting a job, without breaking what hangs off it.
 *
 * A job is a spine, not a container: its packet, proposal and creative session
 * are their own records, and `job_id` is `on delete set null`. So deleting a
 * job never deletes client work — but it does cut those records loose, and
 * nothing re-attaches them: `findOrCreateJob` runs when a record is created,
 * not when it is saved again. That is the consequence worth spelling out
 * before the button is pressed rather than discovering afterwards.
 *
 * What the delete does touch: `job_assignees`, which cascades. What it never
 * touches: the Drive folder, which the packet and the proposal may also hold.
 */

interface DeleteJobDialogProps {
  entry: JobWithMembers;
  onDeleted: () => void;
  /** Rendered as the opener; defaults to a quiet icon button. */
  trigger?: React.ReactNode;
}

export function DeleteJobDialog({ entry, onDeleted, trigger }: DeleteJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { job, proposals, packets, sessions } = entry;
  const attached = [
    ...proposals.map((p) => ({ kind: 'Proposal', name: p.event_name })),
    ...packets.map((p) => ({ kind: 'Packet', name: p.title })),
    ...sessions.map((s) => ({ kind: 'Creative session', name: s.project_name })),
  ];
  const isConnected = attached.length > 0;

  const remove = async () => {
    setDeleting(true);
    const { error } = await supabase.from('jobs').delete().eq('id', job.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      isConnected
        ? `Job deleted — ${attached.length} record${attached.length === 1 ? '' : 's'} detached, none deleted`
        : 'Job deleted',
    );
    setOpen(false);
    setUnderstood(false);
    onDeleted();
  };

  return (
    <>
      <span
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); } }}
        aria-label={`Delete ${job.title}`}
      >
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            asChild
          >
            <span><Trash2 className="h-3.5 w-3.5" /></span>
          </Button>
        )}
      </span>

      <AlertDialog open={open} onOpenChange={(o) => { if (!deleting) { setOpen(o); if (!o) setUnderstood(false); } }}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{job.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {isConnected
                ? 'This job still has work attached. Nothing of that work is deleted — but it is cut loose from the job.'
                : 'Nothing is attached to this job, so this only removes the job itself.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {isConnected && (
            <div className="space-y-3">
              <ul className="divide-y divide-border rounded-lg border border-border bg-muted/30">
                {attached.map((item) => (
                  <li key={`${item.kind}-${item.name}`} className="flex items-center gap-2 px-3 py-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {item.kind}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{item.name}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <p className="text-xs text-foreground">
                  {attached.length === 1 ? 'This record keeps' : 'These records keep'} its own page, link and Drive
                  folder, but {attached.length === 1 ? 'it drops' : 'they drop'} off the Jobs screen and will not
                  re-attach on {attached.length === 1 ? 'its' : 'their'} own. Anyone assigned to the job loses that
                  assignment. The Drive folder is left alone.
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-2.5">
                <Checkbox checked={understood} onCheckedChange={(v) => setUnderstood(v === true)} className="mt-0.5" />
                <span className="text-sm text-foreground">
                  I know this leaves {attached.length} record{attached.length === 1 ? '' : 's'} without a job.
                </span>
              </label>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); remove(); }}
              disabled={deleting || (isConnected && !understood)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              {isConnected ? `Detach ${attached.length} and delete` : 'Delete job'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default DeleteJobDialog;
