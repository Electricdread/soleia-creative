import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Trash2, ExternalLink, Users, Globe, Lock, Upload, ImageIcon, X, Pencil, Loader2, FileImage, Settings2, Truck, Share2, Link2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SessionContentManager } from './SessionContentManager';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Json } from '@/integrations/supabase/types';

interface CoverImage {
  url: string;
  theme: string;
  prompt: string;
}

interface CreativeSession {
  id: string;
  token: string;
  project_name: string;
  client_name: string;
  created_at: string;
  is_active: boolean;
  is_public?: boolean;
  cover_images?: CoverImage[] | null;
  creative_notes?: string | null;
  technical_notes?: string | null;
  event_date?: string | null;
}

interface CreativeSessionCardProps {
  session: CreativeSession;
  index: number;
  onCopyLink: (token: string) => void;
  onDelete: (id: string) => void;
  onOpen: (token: string) => void;
  onSessionUpdate?: () => void;
}

export function CreativeSessionCard({ session, index, onCopyLink, onDelete, onOpen, onSessionUpdate }: CreativeSessionCardProps) {
  const [isPublic, setIsPublic] = useState(session.is_public ?? false);
  const [coverImage, setCoverImage] = useState<CoverImage | null>(
    (session.cover_images as CoverImage[])?.[0] || null
  );
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editProjectName, setEditProjectName] = useState(session.project_name);
  const [editClientName, setEditClientName] = useState(session.client_name);
  const [editCreativeNotes, setEditCreativeNotes] = useState(session.creative_notes || '');
  const [editTechnicalNotes, setEditTechnicalNotes] = useState(session.technical_notes || '');
  const [editDropboxUrl, setEditDropboxUrl] = useState((session as any).dropbox_url || '');
  const [editEventDate, setEditEventDate] = useState(session.event_date || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePublicToggle = async (checked: boolean) => {
    setIsPublic(checked);
    const { error } = await supabase
      .from('creative_sessions')
      .update({ is_public: checked })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to update visibility');
      setIsPublic(!checked);
    } else {
      toast.success(checked ? 'Session is now public' : 'Session is now private');
      onSessionUpdate?.();
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const path = `covers/${session.token}-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('creative-uploads')
      .upload(path, file);

    if (uploadErr) {
      toast.error('Failed to upload cover');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('creative-uploads')
      .getPublicUrl(path);

    const newCover: CoverImage = { url: urlData.publicUrl, theme: 'cover', prompt: '' };

    const { error } = await supabase
      .from('creative_sessions')
      .update({ cover_images: [newCover] as unknown as Json })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to save cover');
    } else {
      setCoverImage(newCover);
      toast.success('Cover updated');
      onSessionUpdate?.();
    }
    setUploading(false);
  };

  const removeCover = async () => {
    const { error } = await supabase
      .from('creative_sessions')
      .update({ cover_images: null })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to remove cover');
    } else {
      setCoverImage(null);
      toast.success('Cover removed');
      onSessionUpdate?.();
    }
  };

  const openEditDialog = () => {
    setEditProjectName(session.project_name);
    setEditClientName(session.client_name);
    setEditCreativeNotes(session.creative_notes || '');
    setEditTechnicalNotes(session.technical_notes || '');
    setEditDropboxUrl((session as any).dropbox_url || '');
    setEditEventDate(session.event_date || '');
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editProjectName.trim() || !editClientName.trim()) {
      toast.error('Project and client name are required');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('creative_sessions')
      .update({
        project_name: editProjectName.trim(),
        client_name: editClientName.trim(),
        creative_notes: editCreativeNotes.trim() || null,
        technical_notes: editTechnicalNotes.trim() || null,
        dropbox_url: editDropboxUrl.trim() || null,
        event_date: editEventDate || null,
      })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to update session');
    } else {
      toast.success('Session updated');
      setEditOpen(false);
      onSessionUpdate?.();
    }
    setSaving(false);
  };

  return (
    <>
      <div className="rounded-xl bg-secondary/30 border border-border/50 overflow-hidden">
        {/* Cover thumbnail row */}
        {coverImage && (
          <div className="relative h-24 w-full">
            <img src={coverImage.url} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute top-1.5 right-1.5 flex gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6 bg-black/60 hover:bg-black/80 text-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3 w-3" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-6 w-6"
                onClick={removeCover}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        <div className="p-3 space-y-2">
          {/* Title & meta */}
          <div>
            <h4 className="font-medium text-foreground truncate text-sm">
              {session.project_name}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              {session.client_name}
              {session.event_date && (
                <> • {format(new Date(session.event_date + 'T00:00:00'), 'MMM d, yyyy')}</>
              )}
            </p>
          </div>

          {session.creative_notes && (
            <p className="text-xs text-muted-foreground/70 line-clamp-1 italic">
              {session.creative_notes}
            </p>
          )}

          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full",
              isPublic
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-amber-500/10 text-amber-500"
            )}>
              {isPublic ? <><Globe className="w-2.5 h-2.5" /> Public</> : <><Lock className="w-2.5 h-2.5" /> Private</>}
            </span>
            {!coverImage && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Upload className="w-2.5 h-2.5" />
                {uploading ? 'Uploading...' : 'Cover'}
              </button>
            )}
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-border/30">
            <Switch
              checked={isPublic}
              onCheckedChange={handlePublicToggle}
              className="scale-75"
            />
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={openEditDialog} className="h-7 text-xs gap-1 px-2">
              <Pencil className="w-3 h-3" /> Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => onCopyLink(session.token)} className="h-7 text-xs gap-1 px-2">
              <Copy className="w-3 h-3" /> Copy
            </Button>
            <Button size="sm" variant="outline" onClick={() => onOpen(session.token)} className="h-7 w-7 p-0">
              <ExternalLink className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(session.id)} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverUpload}
        />
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details" className="gap-1.5 text-xs">
                <Settings2 className="w-3.5 h-3.5" />
                Details
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-1.5 text-xs">
                <FileImage className="w-3.5 h-3.5" />
                Content
              </TabsTrigger>
              <TabsTrigger value="delivery" className="gap-1.5 text-xs">
                <Truck className="w-3.5 h-3.5" />
                Delivery
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Project Name</Label>
                  <Input
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Client Name</Label>
                  <Input
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Event Date</Label>
                <Input
                  type="date"
                  value={editEventDate}
                  onChange={(e) => setEditEventDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Creative Notes</Label>
                <Textarea
                  value={editCreativeNotes}
                  onChange={(e) => setEditCreativeNotes(e.target.value)}
                  placeholder="Direction, mood, color palette, references..."
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Technical Notes</Label>
                <Textarea
                  value={editTechnicalNotes}
                  onChange={(e) => setEditTechnicalNotes(e.target.value)}
                  placeholder="Specs, file formats, delivery requirements..."
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEdit} disabled={saving} className="gap-1.5">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="content" className="py-2">
              <SessionContentManager sessionId={session.id} />
            </TabsContent>

            <TabsContent value="delivery" className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Dropbox File Request URL</Label>
                <Input
                  value={editDropboxUrl}
                  onChange={(e) => setEditDropboxUrl(e.target.value)}
                  placeholder="https://www.dropbox.com/request/..."
                  className="h-9 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Paste the Dropbox file request link for this client. They'll see a branded upload button on their delivery guide.
                </p>
              </div>

              {session.token && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Client Delivery Guide Link</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${window.location.origin}/delivery/${session.token}`}
                      className="h-9 text-sm bg-muted/50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/delivery/${session.token}`);
                        toast.success('Delivery guide link copied!');
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link with your client so they can view specs and submit assets.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEdit} disabled={saving} className="gap-1.5">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}