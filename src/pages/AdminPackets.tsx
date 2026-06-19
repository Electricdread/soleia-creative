import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowLeft, ExternalLink, Copy, Loader2, Trash2, Edit3, Globe, Lock, FolderOpen, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { PacketEditor, type PacketRecord, type PacketInclusion, type PacketKind } from '@/components/admin/PacketEditor';
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

export default function AdminPackets() {
  const navigate = useNavigate();
  const { isLoading } = useAuth();
  const [packets, setPackets] = useState<PacketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PacketRow | null>(null);
  const [newKind, setNewKind] = useState<PacketKind>('pre_call');
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    load();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/packet/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('pre_call_packets').delete().eq('id', deleteId);
    if (error) return toast.error(error.message);
    toast.success('Packet deleted');
    setDeleteId(null);
    load();
  };

  const openNewPacket = (kind: PacketKind) => {
    setEditing(null);
    setNewKind(kind);
    setEditorOpen(true);
  };

  const createDriveFolder = async (p: PacketRow) => {
    if (!p.client_name) {
      toast.error('Add a client name before creating a Drive folder');
      return;
    }
    const t = toast.loading('Creating Drive folder…');
    try {
      const { data, error } = await supabase.functions.invoke('create-client-drive-folder', {
        body: { packet_id: p.id },
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
            </Button>
            <h1 className="font-display text-2xl text-foreground">Pre-Call Packets</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={() => openNewPacket('pre_call')}>
              <Plus className="w-4 h-4 mr-2" /> Pre-Call
            </Button>
            <Button onClick={() => openNewPacket('creative_pre_call')}>
              <Plus className="w-4 h-4 mr-2" /> Creative Packet
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : packets.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="mb-4">No packets yet.</p>
            <Button onClick={() => openNewPacket('creative_pre_call')}>
              <Plus className="w-4 h-4 mr-2" /> Create the first packet
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {packets.map((p) => (
              <div
                key={p.id}
                className="card-elevated bg-card border border-border rounded-lg p-5 shadow-card hover:shadow-card-hover transition-shadow"
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
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <PacketEditor open={editorOpen} onOpenChange={setEditorOpen} initial={editing} kind={newKind} onSaved={load} />
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete packet?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the packet. Public links will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
