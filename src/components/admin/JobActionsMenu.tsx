import { useState } from 'react';
import { CalendarClock, Loader2, MoreHorizontal, RotateCcw, Trash2, XCircle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DeleteJobDialog } from '@/components/admin/DeleteJobDialog';
import { JOB_STATUS_LABEL, type JobStatus, type JobWithMembers } from '@/lib/jobStage';

/**
 * Postpone, cancel, restore or delete a job (owner, 2026-10-25: "in Jobs section add cancel postponed/delete
 * button").
 *
 * Postponing or cancelling switches the job off — it leaves the live list, Needs you and the morning digest —
 * and records why, so it reads as on hold rather than finished and can be brought back. It touches nothing
 * attached: a client holding a packet or proposal link keeps it. Delete is still here, with its own protocol.
 */

interface JobActionsMenuProps {
  entry: JobWithMembers;
  /** After a status change. */
  onChanged: () => void;
  onDeleted: () => void;
  /** A labelled button on the job page; a quiet icon on the list. */
  variant?: 'icon' | 'button';
}

const HOLD_COPY: Record<'postponed' | 'cancelled', { verb: string; title: string }> = {
  postponed: { verb: 'Postpone', title: 'Postpone' },
  cancelled: { verb: 'Cancel job', title: 'Cancel' },
};

export function JobActionsMenu({ entry, onChanged, onDeleted, variant = 'icon' }: JobActionsMenuProps) {
  const [confirm, setConfirm] = useState<'postponed' | 'cancelled' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const { job } = entry;
  const status: JobStatus = job.status ?? 'active';
  const held = status !== 'active';

  const setStatus = async (next: JobStatus) => {
    setSaving(true);
    const { error } = await supabase.from('jobs').update({
      status: next,
      is_active: next === 'active',
      status_changed_at: new Date().toISOString(),
    }).eq('id', job.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next === 'active' ? `${job.title} is back on the board` : `${job.title} marked ${JOB_STATUS_LABEL[next].toLowerCase()}`);
    setConfirm(null);
    onChanged();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          {variant === 'button' ? (
            <Button variant="outline" size="sm">
              <MoreHorizontal className="mr-2 h-4 w-4" /> Job status
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" aria-label={`Actions for ${job.title}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {held ? (
            <DropdownMenuItem onSelect={() => void setStatus('active')} disabled={saving}>
              <RotateCcw className="mr-2 h-4 w-4" /> Restore to active
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onSelect={() => setConfirm('postponed')}>
                <CalendarClock className="mr-2 h-4 w-4" /> Postpone…
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setConfirm('cancelled')}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel job…
              </DropdownMenuItem>
            </>
          )}
          {held && (
            <DropdownMenuItem onSelect={() => setConfirm(status === 'postponed' ? 'cancelled' : 'postponed')}>
              {status === 'postponed'
                ? <><XCircle className="mr-2 h-4 w-4" /> Mark cancelled instead…</>
                : <><CalendarClock className="mr-2 h-4 w-4" /> Mark postponed instead…</>}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDeleting(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => { if (!o && !saving) setConfirm(null); }}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          {confirm && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{HOLD_COPY[confirm].title} “{job.title}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  It moves to Past &amp; on hold and stops appearing in Needs you and the morning deadline email.
                  Its packet, proposal, creative session, client links and Drive folder are left exactly as they
                  are. You can restore it at any time.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={saving}>Keep it active</AlertDialogCancel>
                <AlertDialogAction onClick={(e) => { e.preventDefault(); void setStatus(confirm); }} disabled={saving}>
                  {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                  {HOLD_COPY[confirm].verb}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <DeleteJobDialog entry={entry} onDeleted={onDeleted} open={deleting} onOpenChange={setDeleting} />
    </>
  );
}

export default JobActionsMenu;
