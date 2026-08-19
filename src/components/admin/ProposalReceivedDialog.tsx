import { useEffect, useMemo, useState } from 'react';
import { Clapperboard, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { getPublicOrigin } from '@/lib/ogShare';
import { ProposalReceivedEmailCard } from '@/components/admin/ProposalReceivedEmailCard';

interface SessionOption {
  id: string;
  token: string;
  project_name: string;
  client_name: string;
  event_date: string | null;
  is_active: boolean;
  is_public: boolean;
  brief_enabled: boolean;
  proposal_id: string | null;
}

export interface ProposalReceivedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: {
    id: string;
    client_name: string | null;
    event_name: string | null;
    event_date?: string | null;
    drive_folder_url?: string | null;
  } | null;
}

/**
 * Compose the reply that acknowledges a signed proposal.
 *
 * The email hands the client their creative session, so the session has to be
 * chosen first. A session already linked to this proposal is selected for you;
 * otherwise the client's own sessions are listed ahead of everyone else's.
 */
export function ProposalReceivedDialog({ open, onOpenChange, proposal }: ProposalReceivedDialogProps) {
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedId(null);
    (async () => {
      const { data } = await supabase
        .from('creative_sessions')
        .select('id, token, project_name, client_name, event_date, is_active, is_public, brief_enabled, proposal_id')
        .order('created_at', { ascending: false });
      const rows = (data as SessionOption[]) || [];
      setSessions(rows);
      // A linked session is nearly always the right one — pick it outright.
      setSelectedId(rows.find((s) => s.proposal_id === proposal?.id)?.id ?? null);
      setLoading(false);
    })();
  }, [open, proposal?.id]);

  const ordered = useMemo(() => {
    const client = (proposal?.client_name || '').trim().toLowerCase();
    const linked = (s: SessionOption) => s.proposal_id === proposal?.id;
    const sameClient = (s: SessionOption) =>
      Boolean(client) && (s.client_name || '').trim().toLowerCase() === client;
    return [
      ...sessions.filter(linked),
      ...sessions.filter((s) => !linked(s) && sameClient(s)),
      ...sessions.filter((s) => !linked(s) && !sameClient(s)),
    ];
  }, [sessions, proposal?.id, proposal?.client_name]);

  const selected = ordered.find((s) => s.id === selectedId) || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Proposal Received — Reply</DialogTitle>
          <DialogDescription>
            {proposal?.event_name
              ? `Confirm the signed proposal for ${proposal.event_name} and hand them their creative session.`
              : 'Confirm the signed proposal and hand the client their creative session.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading creative sessions…
          </div>
        ) : ordered.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No creative sessions yet. Create one on the Creative Sessions screen, then come back.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Choose the creative session
              </p>
              <div className="grid gap-2">
                {ordered.map((s) => {
                  const linked = s.proposal_id === proposal?.id;
                  // Both flags gate whether a client can open the page at all.
                  const reachable = s.is_active && s.is_public;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                        selectedId === s.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <Clapperboard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {s.project_name || 'Untitled session'}
                          {linked && (
                            <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                              Linked
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.client_name || 'No client'}
                          {!reachable && ' · not reachable — needs Active and Public'}
                          {reachable && !s.brief_enabled && ' · brief is off'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selected && !selected.brief_enabled && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
                The creative brief is switched off for this session — turn it on before you send, or the
                questionnaire this email promises will not be there.
              </p>
            )}

            {selected && proposal && (
              <div className="border-t border-border pt-4">
                <ProposalReceivedEmailCard
                  // The card seeds its fields on mount, so switching sessions
                  // must remount it or it keeps showing the previous link.
                  key={selected.id}
                  clientName={proposal.client_name || selected.client_name || ''}
                  eventName={proposal.event_name || selected.project_name || ''}
                  eventDate={proposal.event_date || selected.event_date}
                  sessionUrl={`${getPublicOrigin()}/creative/${selected.token}`}
                  driveUrl={proposal.drive_folder_url || null}
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ProposalReceivedDialog;
