import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useFocusRow } from '@/hooks/useFocusRow';
import { AdminShell } from '@/components/admin/AdminShell';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ArrowLeft, ExternalLink, Copy, Loader2, Trash2, Edit3, Globe, Lock, FolderOpen, FolderPlus, Mail, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { PacketEditor, PACKET_KIND_LABEL, type PacketRecord, type PacketInclusion, type PacketKind } from '@/components/admin/PacketEditor';
import { PacketEmailCard } from '@/components/admin/PacketEmailCard';
import IncludePriceSheetToggle, { priceSheetUrl } from '@/components/admin/IncludePriceSheetToggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PacketRow extends PacketRecord {
  id: string;
  token: string;
  is_active: boolean;
  created_at: string;
  drive_folder_url?: string | null;
  drive_folder_id?: string | null;
}

/**
 * What `delete-client-drive-folder` says about the folder behind a packet.
 * `canTrash` is false while anything else — the job's proposal, a sibling
 * packet, a job with other work attached — still points at the same folder.
 */
interface DriveFolderState {
  hasFolder: boolean;
  folderId?: string;
  folderName?: string | null;
  folderUrl?: string;
  missing?: boolean;
  alreadyTrashed?: boolean;
  files?: number;
  truncated?: boolean;
  blockers?: { type: string; id: string; label: string }[];
  canTrash?: boolean;
}

/** Read the JSON body an edge function returned alongside a non-2xx status. */
async function fnErrorMessage(error: unknown, fallback: string): Promise<string> {
  const withContext = error as { context?: { json?: () => Promise<{ error?: string }> }; message?: string } | null;
  try {
    const body = await withContext?.context?.json?.();
    if (body?.error) return String(body.error);
  } catch { /* the body was not JSON */ }
  return withContext?.message ?? fallback;
}

/**
 * How the list is ordered and what it shows.
 *
 * Packets carry a kind — pre-call, post-call, custom — and until now the list
 * ignored it and sorted by whenever a packet happened to be made. Neither is
 * how anyone looks for one: it is either "the post-call packets" or "the one
 * for the show that is nearly here".
 */
type SortKey = 'recent' | 'event' | 'client' | 'status';

const SORT_LABEL: Record<SortKey, string> = {
  recent: 'Newest first',
  event: 'Event date',
  client: 'Client A–Z',
  status: 'Deployed first',
};

/** Legacy "creative_pre_call" rows are custom packets by another name. */
const kindGroup = (kind?: string | null) => (kind === 'creative_pre_call' ? 'custom' : kind ?? 'pre_call');

export default function AdminPackets() {
  const navigate = useNavigate();
  const { isLoading } = useAuth();
  const [packets, setPackets] = useState<PacketRow[]>([]);
  const [loading, setLoading] = useState(true);
  useFocusRow(!loading);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PacketRow | null>(null);
  const [newKind, setNewKind] = useState<PacketKind>('pre_call');
  const [deleteTarget, setDeleteTarget] = useState<PacketRow | null>(null);
  const [drive, setDrive] = useState<DriveFolderState | null>(null);
  const [driveChecking, setDriveChecking] = useState(false);
  const [driveCheckFailed, setDriveCheckFailed] = useState(false);
  const [alsoTrashFolder, setAlsoTrashFolder] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [emailPacket, setEmailPacket] = useState<PacketRow | null>(null);
  const [includePriceSheet, setIncludePriceSheet] = useState(false);
  const [kindFilter, setKindFilter] = useState<'all' | 'pre_call' | 'post_call' | 'custom'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('recent');

  const counts = useMemo(() => {
    const c = { all: packets.length, pre_call: 0, post_call: 0, custom: 0 } as Record<string, number>;
    packets.forEach((p) => { c[kindGroup(p.kind)] = (c[kindGroup(p.kind)] ?? 0) + 1; });
    return c;
  }, [packets]);

  const visible = useMemo(() => {
    const rows = kindFilter === 'all' ? [...packets] : packets.filter((p) => kindGroup(p.kind) === kindFilter);
    const time = (v?: string | null) => (v ? new Date(v).getTime() : null);
    return rows.sort((a, b) => {
      if (sortBy === 'event') {
        // Soonest show first; a packet with no date has nothing to be soon, so
        // it falls to the bottom rather than to the top.
        const ta = time(a.event_date);
        const tb = time(b.event_date);
        if (ta !== null && tb !== null && ta !== tb) return ta - tb;
        if (ta === null && tb !== null) return 1;
        if (tb === null && ta !== null) return -1;
      }
      if (sortBy === 'client') {
        const byClient = (a.client_name ?? '').localeCompare(b.client_name ?? '', undefined, { sensitivity: 'base' });
        if (byClient !== 0) return byClient;
      }
      if (sortBy === 'status' && a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1;
      }
      return (time(b.created_at) ?? 0) - (time(a.created_at) ?? 0);
    });
  }, [packets, kindFilter, sortBy]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pre_call_packets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setPackets(
        (data ?? []).map((d: any) => ({
          ...d,
          inclusions: Array.isArray(d.inclusions) ? (d.inclusions as PacketInclusion[]) : [],
        })),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isLoading) load();
  }, [isLoading]);

  const toggleDeploy = async (p: PacketRow) => {
    const { error } = await supabase
      .from('pre_call_packets')
      .update({ is_active: !p.is_active })
      .eq('id', p.id);
    if (error) return toast.error(error.message);
    toast.success(!p.is_active ? 'Packet deployed' : 'Packet unpublished');
    if (!p.is_active) {
      // The job's team hears about it once the link is live. Fire-and-forget:
      // the notification must never block, or undo, the deploy. The function
      // reads the packet server-side and refuses to send twice.
      void supabase.functions
        .invoke('notify-packet-deployed', { body: { packet_id: p.id } })
        .catch((e) => console.error('Packet deploy notification failed', e));
    }
    load();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/packet/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  // Deleting a packet has always left its Drive folder behind. Ask the folder
  // what state it is in before offering to bin it — it may be shared with the
  // job's proposal, and it may hold assets the client uploaded.
  const openDelete = async (p: PacketRow) => {
    setDeleteTarget(p);
    setDrive(null);
    setDriveCheckFailed(false);
    setAlsoTrashFolder(false);
    if (!p.drive_folder_id) return;

    setDriveChecking(true);
    const { data, error } = await supabase.functions.invoke('delete-client-drive-folder', {
      body: { packet_id: p.id, action: 'check' },
    });
    setDriveChecking(false);
    if (error || !data) {
      setDriveCheckFailed(true);
      return;
    }
    setDrive(data as DriveFolderState);
    // Pre-ticked only when there is nothing to lose: no other owner, and no
    // files inside. A folder with client uploads is an explicit choice.
    setAlsoTrashFolder(Boolean((data as DriveFolderState).canTrash) && !(data as DriveFolderState).files);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    let folderBinned = false;
    if (alsoTrashFolder && drive?.canTrash) {
      const { data, error } = await supabase.functions.invoke('delete-client-drive-folder', {
        body: { packet_id: deleteTarget.id, action: 'trash' },
      });
      if (error || !data?.trashed) {
        setDeleting(false);
        toast.error(await fnErrorMessage(error, 'Could not move the Drive folder to the bin'));
        return; // the packet stays: untick the box to delete it without Drive
      }
      folderBinned = true;
    }

    const { error } = await supabase.from('pre_call_packets').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(folderBinned ? 'Packet deleted, Drive folder moved to the bin' : 'Packet deleted');
    setDeleteTarget(null);
    load();
  };

  const openNewPacket = (kind: PacketKind) => {
    setEditing(null);
    setNewKind(kind);
    setEditorOpen(true);
  };

  const createDriveFolder = async (p: PacketRow, folderMode?: 'full' | 'asset_only') => {
    if (!p.client_name) {
      toast.error('Add a client name before creating a Drive folder');
      return;
    }
    const t = toast.loading('Creating Drive folder…');
    try {
      const { data, error } = await supabase.functions.invoke('create-client-drive-folder', {
        body: { packet_id: p.id, ...(folderMode ? { folder_mode: folderMode } : {}) },
      });
      if (error) throw error;
      toast.success('Drive folder ready', { id: t });
      if (data?.folderUrl) window.open(data.folderUrl, '_blank');
      load();
    } catch (e: any) {
      toast.error(e?.message ?? 'Drive folder failed', { id: t });
    }
  };

  return (
    <AdminShell
      title="Packets"
      subtitle="Inclusions and scope of work for client review"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => openNewPacket('pre_call')}>
            <Plus className="w-4 h-4 mr-2" /> Pre-call
          </Button>
          <Button variant="outline" size="sm" onClick={() => openNewPacket('post_call')}>
            <Plus className="w-4 h-4 mr-2" /> Post-call
          </Button>
          <Button size="sm" onClick={() => openNewPacket('custom')}>
            <Plus className="w-4 h-4 mr-2" /> Custom
          </Button>
        </>
      }
    >
      <div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : packets.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="mb-4">No packets yet.</p>
            <Button onClick={() => openNewPacket('pre_call')}>
              <Plus className="w-4 h-4 mr-2" /> Create the first packet
            </Button>
          </div>
        ) : (
          <>
          {/* Filter by kind, order by what you are actually looking for. */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {([
                ['all', 'All'],
                ['pre_call', PACKET_KIND_LABEL.pre_call],
                ['post_call', PACKET_KIND_LABEL.post_call],
                ['custom', PACKET_KIND_LABEL.custom],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setKindFilter(key)}
                  className={
                    kindFilter === key
                      ? 'rounded-full border border-primary bg-primary/15 px-3 py-1 text-xs font-medium text-primary'
                      : 'rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground'
                  }
                >
                  {label}
                  <span className="ml-1.5 font-mono text-[10px] opacity-70">{counts[key] ?? 0}</span>
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="min-h-[36px] rounded-md border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
                  <option key={key} value={key}>{SORT_LABEL[key]}</option>
                ))}
              </select>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No {kindFilter === 'all' ? '' : (PACKET_KIND_LABEL[kindFilter] ?? '').toLowerCase()} packets.
            </p>
          ) : (
          <div className="grid gap-4">
            {visible.map((p, i) => (
              <div
                key={p.id}
                data-focus-id={p.id}
                style={{ '--i': i } as CSSProperties}
                className="rise lift card-elevated bg-card border border-border rounded-lg p-5 shadow-card hover:shadow-card-hover"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="font-display text-lg text-foreground truncate">{p.title}</h2>
                      {p.is_active ? (
                        <Badge className="bg-primary/15 text-primary border-primary/30">
                          <Globe className="w-3 h-3 mr-1" /> Deployed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <Lock className="w-3 h-3 mr-1" /> Draft
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {p.kind === 'creative_pre_call' ? 'Creative' : 'Pre-Call'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {p.client_name || 'No client'}
                      {p.event_date && ` · ${format(parseISO(p.event_date), 'MMM d, yyyy')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.drive_folder_url ? (
                      <Button variant="outline" size="sm" onClick={() => window.open(p.drive_folder_url!, '_blank')}>
                        <FolderOpen className="w-3.5 h-3.5 mr-1" /> Drive folder
                      </Button>
                    ) : kindGroup(p.kind) === 'custom' ? (
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => createDriveFolder(p, 'full')}>
                          <FolderPlus className="w-3.5 h-3.5 mr-1" /> Full project folder
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => createDriveFolder(p, 'asset_only')}>
                          <FolderPlus className="w-3.5 h-3.5 mr-1" /> Asset collect only
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => createDriveFolder(p)}>
                        <FolderPlus className="w-3.5 h-3.5 mr-1" /> Create Drive folder
                      </Button>
                    )}
                    {p.is_active && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => copyLink(p.token)}>
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copy link
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.open(`/packet/${p.token}`, '_blank')}>
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setIncludePriceSheet(false); setEmailPacket(p); }}>
                          <Mail className="w-3.5 h-3.5 mr-1" /> Email
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant={p.is_active ? 'outline' : 'default'}
                      onClick={() => toggleDeploy(p)}
                    >
                      {p.is_active ? 'Unpublish' : 'Deploy'}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setEditorOpen(true); }}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openDelete(p)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
          </>
        )}
      </div>

      <PacketEditor open={editorOpen} onOpenChange={setEditorOpen} initial={editing} kind={newKind} onSaved={load} />

      <Dialog open={!!emailPacket} onOpenChange={(o) => { if (!o) { setEmailPacket(null); setIncludePriceSheet(false); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Packet Email</DialogTitle>
          </DialogHeader>
          {emailPacket && (
            <div className="space-y-4">
              {kindGroup(emailPacket.kind) === 'custom' ? (
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <p className="font-medium text-foreground">Custom delivery keeps pricing private</p>
                  <p className="mt-1 text-xs text-muted-foreground">This email will not include the service price sheet, pricing, or proposal-selection language.</p>
                </div>
              ) : (
                <IncludePriceSheetToggle
                  checked={includePriceSheet}
                  onCheckedChange={setIncludePriceSheet}
                />
              )}
              <PacketEmailCard
                key={`${emailPacket.id}-${includePriceSheet}`}
                kind={(emailPacket.kind as PacketKind) || 'pre_call'}
                clientName={emailPacket.client_name || ''}
                eventDate={emailPacket.event_date}
                packetUrl={`${window.location.origin}/packet/${emailPacket.token}`}
                driveUrl={emailPacket.drive_folder_url}
                priceSheetUrl={kindGroup(emailPacket.kind) === 'custom' || !includePriceSheet ? undefined : priceSheetUrl()}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete packet?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{deleteTarget?.title ? ` "${deleteTarget.title}"` : ' the packet'}. Public links will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteTarget?.drive_folder_id && (
            <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-sm">
              {driveChecking ? (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking its Google Drive folder...
                </p>
              ) : driveCheckFailed ? (
                <p className="text-muted-foreground">
                  Could not reach Drive to check this packet's folder, so it will be left alone.
                </p>
              ) : drive?.missing ? (
                <p className="text-muted-foreground">Its Drive folder is already gone.</p>
              ) : drive?.alreadyTrashed ? (
                <p className="text-muted-foreground">Its Drive folder is already in the bin.</p>
              ) : drive?.canTrash ? (
                <label className="flex cursor-pointer items-start gap-2.5">
                  <Checkbox
                    checked={alsoTrashFolder}
                    onCheckedChange={(v) => setAlsoTrashFolder(v === true)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium text-foreground">Also move its Google Drive folder to the bin</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <FolderOpen className="h-3 w-3" />
                      {drive.folderName || 'Drive folder'}
                      <span>&bull;</span>
                      {drive.files
                        ? `${drive.files}${drive.truncated ? '+' : ''} file${drive.files === 1 ? '' : 's'} inside`
                        : 'empty'}
                      <span>&bull;</span>
                      recoverable from Drive's bin for 30 days
                    </span>
                    {Boolean(drive.files) && (
                      <span className="mt-1 flex items-center gap-1.5 text-xs text-amber-500">
                        <AlertTriangle className="h-3 w-3" />
                        Anything the client uploaded goes with it.
                      </span>
                    )}
                  </span>
                </label>
              ) : (
                <div className="space-y-1">
                  <p className="text-foreground">Its Drive folder stays — it is shared.</p>
                  <ul className="text-xs text-muted-foreground">
                    {(drive?.blockers ?? []).map((b) => (
                      <li key={`${b.type}-${b.id}`}>&bull; still used by the {b.type}: {b.label}</li>
                    ))}
                  </ul>
                </div>
              )}
              {drive?.folderUrl && !drive?.missing && (
                <a
                  href={drive.folderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Open the folder in Drive
                </a>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting || driveChecking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              {alsoTrashFolder ? 'Delete packet and folder' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
