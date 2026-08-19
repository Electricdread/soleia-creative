import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Clipboard, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  ELEVATOR_LABEL,
  PARTY_LABEL,
  answeredCount,
  briefToPlainText,
  fetchBriefForLink,
  type CreativeBriefRow,
} from '@/lib/creativeBrief';

/**
 * Read-only view of a client's creative brief.
 *
 * Written for the moment before a creative call: everything the client told us,
 * in the order they were asked, with one button to lift it into a call agenda
 * or a hand-off note.
 */

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className="grid gap-1 border-t border-border/50 py-3 sm:grid-cols-[170px_1fr] sm:gap-5">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {empty ? (
        <span className="text-sm italic text-muted-foreground/60">Not answered yet</span>
      ) : (
        <span className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{value}</span>
      )}
    </div>
  );
}

export interface CreativeBriefViewerProps {
  linkId: string;
  clientName: string;
  eventName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreativeBriefViewer({ linkId, clientName, eventName, open, onOpenChange }: CreativeBriefViewerProps) {
  const { toast } = useToast();
  const [brief, setBrief] = useState<CreativeBriefRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      setBrief(await fetchBriefForLink(linkId));
      setLoading(false);
    })();
  }, [open, linkId]);

  const copy = async () => {
    if (!brief) return;
    await navigator.clipboard.writeText(briefToPlainText(brief, `${clientName} — ${eventName}`));
    toast({ title: 'Brief copied', description: 'Paste it into your call agenda or hand-off note.' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Creative Brief</DialogTitle>
          <DialogDescription>
            {clientName} — {eventName}
            {brief?.submitted_at
              ? ` · sent ${new Date(brief.submitted_at).toLocaleDateString()}`
              : brief
                ? ' · in progress'
                : ''}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading brief…
          </div>
        ) : !brief ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            The client has not started their brief yet. It appears in their session while the questionnaire is on.
          </div>
        ) : (
          <div className="space-y-1">
            <p className="pb-2 text-xs text-muted-foreground">
              {answeredCount(brief)} of 7 answered
              {brief.updated_at && ` · last edited ${new Date(brief.updated_at).toLocaleString()}`}
            </p>

            <Row label="Mood" value={brief.mood} />
            <Row label="Vibe" value={brief.vibe} />
            <Row label="Colour scheme" value={brief.color_scheme} />
            <Row label="Avoid" value={brief.avoid} />
            <Row
              label="Elevator"
              value={
                brief.elevator_mode ? (
                  <span className="block">
                    {ELEVATOR_LABEL[brief.elevator_mode] || brief.elevator_mode}
                    {brief.elevator_up && (
                      <span className="mt-1.5 flex items-start gap-1.5 text-muted-foreground">
                        <ArrowUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {brief.elevator_up}
                      </span>
                    )}
                    {brief.elevator_down && (
                      <span className="mt-1 flex items-start gap-1.5 text-muted-foreground">
                        <ArrowDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {brief.elevator_down}
                      </span>
                    )}
                  </span>
                ) : null
              }
            />
            <Row
              label="Turns to party"
              value={brief.transforms_to_party ? PARTY_LABEL[brief.transforms_to_party] : null}
            />
            <Row label="Looks" value={brief.looks_count ? `${brief.looks_count}` : null} />
            <Row label="Notes" value={brief.notes} />

            <div className="flex items-center gap-2 border-t border-border/50 pt-4">
              <Button size="sm" variant="outline" onClick={copy} className="gap-2">
                <Clipboard className="h-3.5 w-3.5" /> Copy as text
              </Button>
              {brief.submitted_at && (
                <span className="flex items-center gap-1.5 text-xs text-primary">
                  <Check className="h-3.5 w-3.5" /> Client marked this sent
                </span>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CreativeBriefViewer;
