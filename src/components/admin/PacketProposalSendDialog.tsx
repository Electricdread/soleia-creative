import { useEffect, useMemo, useState } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { getPublicOrigin } from '@/lib/ogShare';
import { PacketEmailCard, type PacketEmailKind } from '@/components/admin/PacketEmailCard';
import { PACKET_KIND_LABEL, type PacketKind } from '@/components/admin/PacketEditor';

interface PacketOption {
  id: string;
  title: string | null;
  client_name: string | null;
  event_date: string | null;
  token: string;
  drive_folder_url: string | null;
  kind: string | null;
}

export interface PacketProposalSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: {
    token: string;
    client_name: string | null;
    event_name: string | null;
    event_date?: string | null;
  } | null;
}

/**
 * Send a creative packet and a proposal as one email.
 *
 * Covers the case where a client leaves a meeting expecting both: the guide
 * packet to review, and the price sheet to select line items on and sign. The
 * email body is the same builder used for a packet on its own — supplying a
 * proposal URL switches it to the post-meeting opening and adds the sign CTA.
 */
export function PacketProposalSendDialog({ open, onOpenChange, proposal }: PacketProposalSendDialogProps) {
  const [packets, setPackets] = useState<PacketOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedId(null);
    (async () => {
      const { data } = await supabase
        .from('pre_call_packets')
        .select('id, title, client_name, event_date, token, drive_folder_url, kind')
        .order('created_at', { ascending: false });
      setPackets((data as PacketOption[]) || []);
      setLoading(false);
    })();
  }, [open]);

  // Surface packets for this client first — the intended one is nearly always
  // theirs, and scanning a long list for it is the slow part of sending.
  const ordered = useMemo(() => {
    const client = (proposal?.client_name || '').trim().toLowerCase();
    if (!client) return packets;
    const match = (p: PacketOption) => (p.client_name || '').trim().toLowerCase() === client;
    return [...packets.filter(match), ...packets.filter((p) => !match(p))];
  }, [packets, proposal?.client_name]);

  const selected = ordered.find((p) => p.id === selectedId) || null;
  const likelyMatch = (p: PacketOption) =>
    Boolean(proposal?.client_name) &&
    (p.client_name || '').trim().toLowerCase() === (proposal?.client_name || '').trim().toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Packet &amp; Proposal</DialogTitle>
          <DialogDescription>
            {proposal?.event_name
              ? `One email for ${proposal.event_name} — the creative packet to review, and the proposal to sign.`
              : 'One email containing the creative packet and the proposal.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading packets…
          </div>
        ) : ordered.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No packets yet. Create one on the Creative Packets screen, then send it with this proposal.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">Choose the packet</p>
              <div className="grid gap-2">
                {ordered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selectedId === p.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {p.title || 'Untitled packet'}
                        {likelyMatch(p) && (
                          <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                            This client
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.client_name || 'No client'} ·{' '}
                        {PACKET_KIND_LABEL[(p.kind as PacketKind) || 'pre_call'] || 'Packet'}
                        {p.drive_folder_url ? '' : ' · no Drive folder yet'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selected && proposal && (
              <div className="border-t border-border pt-4">
                <PacketEmailCard
                  kind={(selected.kind as PacketEmailKind) || 'pre_call'}
                  clientName={proposal.client_name || selected.client_name || ''}
                  eventDate={proposal.event_date || selected.event_date}
                  packetUrl={`${getPublicOrigin()}/packet/${selected.token}`}
                  driveUrl={selected.drive_folder_url}
                  proposalUrl={`${getPublicOrigin()}/proposal/${proposal.token}`}
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PacketProposalSendDialog;
