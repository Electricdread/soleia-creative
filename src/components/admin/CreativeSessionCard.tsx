import { useEffect, useRef, useState } from 'react';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Trash2, ExternalLink, Users, Globe, Lock, Upload, ImageIcon, X, Pencil, Loader2, FileImage, Settings2, Link2, Mail, MonitorPlay, ClipboardList } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SessionContentManager } from './SessionContentManager';
import { SessionPrevizClipsManager } from './SessionPrevizClipsManager';
import { getPublicOrigin } from '@/lib/ogShare';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Json } from '@/integrations/supabase/types';
import { CountdownBadge } from '@/components/CountdownBadge';
import { CreativeBriefViewer } from './CreativeBriefViewer';
import { answeredCount, fetchBriefForSession, type CreativeBriefRow } from '@/lib/creativeBrief';

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
  show_previz?: boolean | null;
  brief_enabled?: boolean | null;
}

interface CreativeSessionCardProps {
  session: CreativeSession;
  index: number;
  onCopyLink: (token: string) => void;
  onDelete: (id: string) => void;
  onOpen: (token: string) => void;
  onSessionUpdate?: () => void;
}

// The client cover is a 21:9 object-cover frame, so anything far off that shape
// loses real picture on the way out. Only flag the shapes where the loss is
// worth an admin's attention — a 16:9 still is close enough not to nag about.
const CLIENT_COVER_RATIO = 21 / 9;

function cropsOnClient({ w, h }: { w: number; h: number }) {
  const ratio = w / h;
  const drift = ratio > CLIENT_COVER_RATIO ? ratio / CLIENT_COVER_RATIO : CLIENT_COVER_RATIO / ratio;
  return drift > 1.35;
}

export function CreativeSessionCard({ session, index, onCopyLink, onDelete, onOpen, onSessionUpdate }: CreativeSessionCardProps) {
  const [isPublic, setIsPublic] = useState(session.is_public ?? false);
  const [isActive, setIsActive] = useState(session.is_active ?? true);
  const [showPreviz, setShowPreviz] = useState(session.show_previz ?? false);
  const [briefEnabled, setBriefEnabled] = useState(session.brief_enabled ?? false);
  const [brief, setBrief] = useState<CreativeBriefRow | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

  // Submitted, and nobody has opened it. The one state on this card that means
  // somebody is waiting on us rather than the other way round.
  const briefUnread = !!brief?.submitted_at && !brief.reviewed_at;

  // Whether the client has written anything is what makes the brief worth
  // opening, so load it with the card rather than on click.
  useEffect(() => {
    let live = true;
    fetchBriefForSession(session.id).then((row) => { if (live) setBrief(row); });
    return () => { live = false; };
  }, [session.id, briefOpen]);

  const handleBriefToggle = async (checked: boolean) => {
    setBriefEnabled(checked);
    const { error } = await supabase
      .from('creative_sessions')
      .update({ brief_enabled: checked })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to update the creative brief');
      setBriefEnabled(!checked);
    } else {
      toast.success(
        checked
          ? 'Creative brief added to this session'
          : 'Creative brief hidden — the answers are kept',
      );
      onSessionUpdate?.();
    }
  };

  const handlePrevizToggle = async (checked: boolean) => {
    setShowPreviz(checked);
    const { error } = await supabase
      .from('creative_sessions')
      .update({ show_previz: checked })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to update previz visibility');
      setShowPreviz(!checked);
    } else {
      toast.success(checked ? 'Venue Previz included in session' : 'Venue Previz hidden from session');
      onSessionUpdate?.();
    }
  };

  const handleActiveToggle = async (checked: boolean) => {
    setIsActive(checked);
    const { error } = await supabase
      .from('creative_sessions')
      .update({ is_active: checked })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to update status');
      setIsActive(!checked);
    } else {
      toast.success(checked ? 'Session activated — link is live' : 'Session deactivated — link is no longer accessible');
      onSessionUpdate?.();
    }
  };
  const [coverImage, setCoverImage] = useState<CoverImage | null>(
    (session.cover_images as CoverImage[])?.[0] || null
  );
  const [coverMeta, setCoverMeta] = useState<{ w: number; h: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editProjectName, setEditProjectName] = useState(session.project_name);
  const [editClientName, setEditClientName] = useState(session.client_name);
  const [editCreativeNotes, setEditCreativeNotes] = useState(session.creative_notes || '');
  const [editTechnicalNotes, setEditTechnicalNotes] = useState(session.technical_notes || '');
  
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
      setCoverMeta(null);
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
      setCoverMeta(null);
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
      <div className={cn(
        "rounded-xl bg-secondary/30 border border-border/50 overflow-hidden transition-opacity",
        !isActive && "opacity-60",
        briefUnread && "brief-unread",
      )}>
        {/* Cover preview. Covers arrive in every shape — a 19:1 title strip, a
            16:9 still, a portrait crop — so the band takes the image's own
            aspect ratio between a floor and a cap and contains the artwork
            rather than cropping it to a fixed strip. The admin sees the whole
            picture; the chips say what the client's 21:9 frame will do to it. */}
        {coverImage && (
          <div
            className="relative w-full overflow-hidden bg-secondary/40 min-h-[120px] max-h-56"
            style={{ aspectRatio: coverMeta ? `${coverMeta.w} / ${coverMeta.h}` : '21 / 9' }}
          >
            {/* the same image, blown up and blurred, so odd shapes sit on their
                own colour instead of a dead letterbox */}
            <img
              src={coverImage.url}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover scale-125 blur-2xl opacity-30"
            />
            <img
              src={coverImage.url}
              alt={`${session.project_name} cover`}
              onLoad={(e) =>
                setCoverMeta({
                  w: e.currentTarget.naturalWidth,
                  h: e.currentTarget.naturalHeight,
                })
              }
              className="relative h-full w-full object-contain"
            />

            <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-full border border-border/60 bg-background/70 p-0.5 backdrop-blur">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={uploading}
                      className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Replace cover image</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={removeCover}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Remove cover image</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {coverMeta && (
              <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-1">
                <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur">
                  {coverMeta.w} × {coverMeta.h} · {(coverMeta.w / coverMeta.h).toFixed(2)}:1
                </span>
                {cropsOnClient(coverMeta) && (
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-500 backdrop-blur">
                    Client frame crops this to 21:9
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="p-3 space-y-2">
          {/* Title & meta */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-secondary/60 border border-border/60 cursor-pointer flex-shrink-0">
                    <Switch
                      checked={isActive}
                      onCheckedChange={handleActiveToggle}
                    />
                    <span className="text-xs font-medium text-foreground">Active</span>
                  </label>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Toggle off to disable client access to this link</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
              isActive
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-red-500/10 text-red-500"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-red-500")} />
              {isActive ? 'Active' : 'Inactive'}
            </span>
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full",
              isPublic
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-amber-500/10 text-amber-500"
            )}>
              {isPublic ? <><Globe className="w-2.5 h-2.5" /> Public</> : <><Lock className="w-2.5 h-2.5" /> Private</>}
            </span>
            {session.is_active && <CountdownBadge eventDate={session.event_date} />}
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={isPublic}
                      onCheckedChange={handlePublicToggle}
                      className="scale-75"
                    />
                    <span className="text-[10px] text-muted-foreground">Public</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Public links don't require authentication</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={showPreviz}
                      onCheckedChange={handlePrevizToggle}
                      className="scale-75"
                    />
                    <span className="text-[10px] text-muted-foreground">Previz</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Include the Venue Previz section in this creative session</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={briefEnabled}
                      onCheckedChange={handleBriefToggle}
                      className="scale-75"
                    />
                    <span className="text-[10px] text-muted-foreground">Brief</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Include the creative questionnaire in this session</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {brief && (
              <button
                type="button"
                onClick={() => setBriefOpen(true)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full transition-colors",
                  briefUnread
                    // Unread is the thing worth crossing the room for, so it is
                    // not the same size as the rest of the row's furniture.
                    ? "bg-primary text-primary-foreground font-semibold text-[11px] px-2 py-1"
                    : brief.submitted_at
                      ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[10px] px-1.5 py-0.5"
                      : "bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-1.5 py-0.5"
                )}
              >
                <ClipboardList className={briefUnread ? "w-3 h-3" : "w-2.5 h-2.5"} />
                {briefUnread
                  ? `Brief in · ${answeredCount(brief)}/7`
                  : brief.submitted_at ? 'Brief read' : `Brief ${answeredCount(brief)}/7`}
              </button>
            )}
            <div className="flex-1" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={emailLoading}
                    onClick={async () => {
                      setEmailLoading(true);
                      try {
                        const { data, error } = await supabase.functions.invoke('generate-session-email', {
                          body: null,
                          method: 'GET',
                        });
                        // Use fetch directly since invoke doesn't support query params well
                        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                        const res = await fetch(`${supabaseUrl}/functions/v1/generate-session-email?token=${session.token}&type=creative`);
                        const result = await res.json();
                        if (result.html) {
                          const blob = new Blob([result.html], { type: 'text/html' });
                          const item = new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([result.html], { type: 'text/plain' }) });
                          await navigator.clipboard.write([item]);
                          toast.success('Email template copied — paste into your email client');
                        } else {
                          toast.error('Failed to generate email');
                        }
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to generate email template');
                      }
                      setEmailLoading(false);
                    }}
                    className="h-7 w-7 p-0"
                  >
                    {emailLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Copy branded email template to clipboard</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button size="sm" variant="outline" onClick={openEditDialog} className="h-7 text-xs gap-1 px-2">
              <Pencil className="w-3 h-3" /> Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => onCopyLink(session.token)} className="h-7 text-xs gap-1 px-2">
              <Link2 className="w-3 h-3" /> Copy Link
            </Button>
            <Button size="sm" variant="outline" onClick={() => onOpen(session.token)} className="h-7 w-7 p-0">
              <ExternalLink className="w-3 h-3" />
            </Button>
            <div className="w-px h-5 bg-border/50 mx-1" />
            <DeleteConfirmDialog
              trigger={
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 ml-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-3 h-3" />
                </Button>
              }
              title="Delete Creative Session?"
              description={`This will permanently delete "${session.project_name}" and all its mood board items, scenes, and uploaded files. This action cannot be undone.`}
              onConfirm={() => onDelete(session.id)}
            />
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
        <DialogContent className="sm:max-w-2xl lg:max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Edit Session</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="details" className="w-full flex-1 overflow-y-auto px-6 pb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details" className="gap-1.5 text-xs">
                <Settings2 className="w-3.5 h-3.5" />
                Details
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-1.5 text-xs">
                <FileImage className="w-3.5 h-3.5" />
                Clips
              </TabsTrigger>
              <TabsTrigger value="previz" className="gap-1.5 text-xs">
                <MonitorPlay className="w-3.5 h-3.5" />
                Previz
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
            </TabsContent>

            <TabsContent value="content" className="py-2">
              <SessionContentManager sessionId={session.id} sessionToken={session.token} />
            </TabsContent>

            <TabsContent value="previz" className="py-2">
              {session.token && (
                <SessionPrevizClipsManager sessionId={session.id} sessionToken={session.token} />
              )}
            </TabsContent>

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>

      <CreativeBriefViewer
        sessionId={session.id}
        clientName={session.client_name}
        projectName={session.project_name}
        open={briefOpen}
        onOpenChange={setBriefOpen}
      />
    </>
  );
}