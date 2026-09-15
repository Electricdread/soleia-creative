import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Loader2, MessageCircle, PenLine, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchSessionFeedback, summarizeFeedback, type FeedbackSummary } from '@/lib/creativeFeedback';

/**
 * What the client approved, declined and said about each item in their creative session, and the approvals they
 * confirmed with their name. Read-only: the client's own page is where they change their minds.
 */

const when = (iso: string) => format(new Date(iso), 'MMM d, h:mm a');

function Names({ label, tone, rows }: { label: string; tone: 'approve' | 'decline'; rows: { id: string; reactor_name: string; created_at: string }[] }) {
  if (!rows.length) return null;
  const Icon = tone === 'approve' ? CheckCircle2 : XCircle;
  return (
    <div className={tone === 'approve' ? 'flex flex-wrap items-center gap-1.5 text-xs text-primary' : 'flex flex-wrap items-center gap-1.5 text-xs text-destructive'}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="font-medium">{label}</span>
      {rows.map((r) => (
        <span key={r.id} className="text-muted-foreground">
          {r.reactor_name} <span className="text-muted-foreground/60">· {when(r.created_at)}</span>
        </span>
      ))}
    </div>
  );
}

export interface CreativeFeedbackViewerProps {
  sessionId: string;
  clientName: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreativeFeedbackViewer({ sessionId, clientName, projectName, open, onOpenChange }: CreativeFeedbackViewerProps) {
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let live = true;
    setLoading(true);
    fetchSessionFeedback(sessionId).then((feedback) => {
      if (!live) return;
      setSummary(summarizeFeedback(feedback));
      setLoading(false);
    });
    return () => { live = false; };
  }, [open, sessionId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client feedback</DialogTitle>
          <DialogDescription>
            {clientName} — {projectName}
            {summary?.latestAt && ` · latest ${when(summary.latestAt)}`}
          </DialogDescription>
        </DialogHeader>

        {loading || !summary ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading feedback…
          </div>
        ) : summary.total === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No approvals, declines or comments yet. Clients leave them on each item in their session.
          </div>
        ) : (
          <div className="space-y-4">
            {summary.signoffList.map((signoff) => (
              <div key={signoff.id} className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm">
                <PenLine className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">
                    {signoff.signer_name} confirmed their approval of {signoff.approved_item_ids.length} item{signoff.approved_item_ids.length === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs text-muted-foreground">{when(signoff.created_at)}</p>
                </div>
              </div>
            ))}

            {summary.items.map(({ item, approvedBy, declinedBy, comments }) => {
              const thumb = item.thumbnail_url || (item.item_type === 'image' ? item.file_url : null);
              return (
                <div key={item.id} className="flex gap-3 border-t border-border/50 pt-4">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md border border-border/60 bg-secondary/40">
                    {thumb ? (
                      <img src={thumb} alt={item.title || 'Item'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-wider text-muted-foreground/60">
                        {item.item_type}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="truncate text-sm font-medium text-foreground">{item.title || 'Untitled'}</p>
                    <Names label="Approved" tone="approve" rows={approvedBy} />
                    <Names label="Declined" tone="decline" rows={declinedBy} />
                    {comments.map((comment) => (
                      <div key={comment.id} className="rounded-md bg-secondary/40 px-2.5 py-1.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-foreground">{comment.commenter_name}</span>
                          <span className="text-muted-foreground/60">{when(comment.created_at)}</span>
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CreativeFeedbackViewer;
