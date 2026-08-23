import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Copy, ExternalLink, FileText, FolderOpen, Loader2, Pencil, Plus, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  PacketEditor,
  PACKET_KIND_LABEL,
  defaultFor,
  type PacketKind,
  type PacketRecord,
} from '@/components/admin/PacketEditor';

/**
 * The packet step of the event, done on the event.
 *
 * Raising a packet used to mean leaving the calendar, opening Packets, and
 * retyping the event's name, client and date into a blank form. The event
 * already knows all three, so the shortcut here opens the editor with them
 * filled in and links whatever is saved back to this event.
 */

interface PacketRow {
  id: string;
  token: string;
  title: string;
  client_name: string | null;
  event_date: string | null;
  kind: string | null;
  is_active: boolean;
  drive_folder_url: string | null;
  intro: string | null;
  scope: string | null;
  notes: string | null;
  creative_guide_url: string | null;
  inclusions: unknown;
}

const cleanTitle = (s: string) => s.replace(/^\[(D|T|P|C)\]\s*/i, '').trim();

const KIND_ORDER: PacketKind[] = ['pre_call', 'creative_pre_call', 'post_call', 'custom'];

interface EventPacketProps {
  eventUid: string;
  summary: string;
  dtstart: string;
}

export function EventPacket({ eventUid, summary, dtstart }: EventPacketProps) {
  const [packets, setPackets] = useState<PacketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKind, setEditorKind] = useState<PacketKind>('pre_call');
  const [editorInitial, setEditorInitial] = useState<PacketRecord | null>(null);
  const [clientName, setClientName] = useState('');

  const eventTitle = cleanTitle(summary);
  const eventDate = (() => {
    try { return format(parseISO(dtstart), 'yyyy-MM-dd'); } catch { return ''; }
  })();

  const load = async () => {
    setLoading(true);
    const [{ data: assocs }, { data: brief }] = await Promise.all([
      supabase
        .from('calendar_event_associations')
        .select('entity_id')
        .eq('event_uid', eventUid)
        .eq('entity_type', 'packet'),
      supabase.from('calendar_event_brief').select('group_name').eq('event_uid', eventUid).maybeSingle(),
    ]);

    // The brief's group name is the closest thing the event has to a client,
    // so it seeds the packet when one has been written.
    setClientName(brief?.group_name?.trim() || '');

    const ids = (assocs ?? []).map((a) => a.entity_id);
    if (ids.length === 0) {
      setPackets([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('pre_call_packets')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false });
    setPackets((data as unknown as PacketRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [eventUid]);

  const openNew = (kind: PacketKind) => {
    setEditorKind(kind);
    setEditorInitial({
      ...defaultFor(kind),
      title: eventTitle,
      client_name: clientName || eventTitle,
      event_date: eventDate,
    });
    setEditorOpen(true);
  };

  const openExisting = (p: PacketRow) => {
    setEditorKind((p.kind as PacketKind) ?? 'pre_call');
    setEditorInitial({
      id: p.id,
      title: p.title,
      client_name: p.client_name,
      event_date: p.event_date,
      intro: p.intro,
      inclusions: Array.isArray(p.inclusions) ? (p.inclusions as PacketRecord['inclusions']) : [],
      scope: p.scope,
      notes: p.notes,
      creative_guide_url: p.creative_guide_url,
      drive_folder_url: p.drive_folder_url,
      kind: (p.kind as PacketKind) ?? 'pre_call',
      is_active: p.is_active,
    });
    setEditorOpen(true);
  };

  const handleSaved = async (packetId?: string) => {
    if (packetId) {
      // Link it to the event that raised it, so it is here next time. A repeat
      // save of the same packet hits the unique constraint, which is a no-op.
      const { error } = await supabase.from('calendar_event_associations').insert({
        event_uid: eventUid,
        entity_type: 'packet',
        entity_id: packetId,
      });
      if (error && error.code !== '23505') toast.error('Saved, but could not link it to this event');
    }
    load();
  };

  const toggleDeploy = async (p: PacketRow) => {
    const { error } = await supabase
      .from('pre_call_packets')
      .update({ is_active: !p.is_active })
      .eq('id', p.id);
    if (error) return toast.error(error.message);
    toast.success(!p.is_active ? 'Packet deployed — the link is live' : 'Packet unpublished');
    load();
  };

  const unlink = async (p: PacketRow) => {
    await supabase
      .from('calendar_event_associations')
      .delete()
      .eq('event_uid', eventUid)
      .eq('entity_type', 'packet')
      .eq('entity_id', p.id);
    toast.success('Unlinked from this event — the packet itself is untouched');
    load();
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/packet/${token}`);
    toast.success('Link copied');
  };

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70">Raise a packet</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Opens prefilled as <span className="text-foreground">{eventTitle || 'this event'}</span>
          {eventDate ? ` for ${format(parseISO(`${eventDate}T00:00:00`), 'MMM d, yyyy')}` : ''}.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {KIND_ORDER.map((kind) => (
            <Button key={kind} size="sm" variant="outline" onClick={() => openNew(kind)} className="h-7 gap-1 px-2 text-[11px]">
              <Plus className="h-3 w-3" /> {PACKET_KIND_LABEL[kind] ?? kind}
            </Button>
          ))}
        </div>
      </div>

      {packets.length === 0 ? (
        <p className="text-xs italic text-muted-foreground/60">No packet on this event yet.</p>
      ) : (
        <div className="space-y-2">
          {packets.map((p) => (
            <div key={p.id} className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{p.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {PACKET_KIND_LABEL[(p.kind as PacketKind) ?? 'pre_call'] ?? p.kind}
                    {p.client_name ? ` · ${p.client_name}` : ''}
                  </p>
                </div>
                <span className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px]',
                  p.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500',
                )}>
                  {p.is_active ? 'Deployed' : 'Draft'}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2">
                <Button
                  size="sm"
                  variant={p.is_active ? 'outline' : 'default'}
                  onClick={() => toggleDeploy(p)}
                  className="h-7 px-2 text-[11px]"
                >
                  {p.is_active ? 'Unpublish' : 'Deploy'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => openExisting(p)} className="h-7 gap-1 px-2 text-[11px]">
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => copyLink(p.token)} className="h-7 gap-1 px-2 text-[11px]">
                  <Copy className="h-3 w-3" /> Link
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/packet/${p.token}`, '_blank', 'noopener,noreferrer')}
                  className="h-7 w-7 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                {p.drive_folder_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(p.drive_folder_url!, '_blank', 'noopener,noreferrer')}
                    className="h-7 gap-1 px-2 text-[11px]"
                  >
                    <FolderOpen className="h-3 w-3" /> Drive
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => unlink(p)}
                  className="ml-auto h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  title="Remove it from this event, without deleting the packet"
                >
                  <Unlink className="h-3 w-3" /> Unlink
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PacketEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initial={editorInitial}
        kind={editorKind}
        onSaved={handleSaved}
      />
    </div>
  );
}
