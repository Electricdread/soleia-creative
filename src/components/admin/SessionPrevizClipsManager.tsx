import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Upload,
  Loader2,
  Trash2,
  GripVertical,
  Star,
  MonitorPlay,
  Copy,
  ExternalLink,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  isAcceptablePrevizFile,
  probePlayable,
  uploadPrevizFile,
} from '@/lib/previzUpload';

interface PrevizClip {
  id: string;
  title: string;
  url: string;
  sort_order: number;
  is_default: boolean;
}

interface Props {
  sessionId: string;
  sessionToken: string;
}

function SortableRow({
  clip,
  onDelete,
  onSetDefault,
  onRename,
  deleting,
}: {
  clip: PrevizClip;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onRename: (id: string, title: string) => void;
  deleting: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: clip.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(clip.title);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md border border-border bg-card/60"
    >
      <div className="flex items-center gap-2 p-2">
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-manipulation text-muted-foreground hover:text-foreground"
        aria-label="Reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <video
        src={clip.url}
        muted
        playsInline
        preload="metadata"
        className="h-12 w-20 flex-shrink-0 rounded bg-black object-cover"
      />

      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onRename(clip.id, draft.trim() || clip.title);
                  setEditing(false);
                } else if (e.key === 'Escape') {
                  setDraft(clip.title);
                  setEditing(false);
                }
              }}
              className="h-7 text-sm"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => {
                onRename(clip.id, draft.trim() || clip.title);
                setEditing(false);
              }}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => {
                setDraft(clip.title);
                setEditing(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{clip.title}</p>
            {clip.is_default && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                Default
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {!editing && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setEditing(true)}
            aria-label="Rename"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className={`h-8 w-8 ${clip.is_default ? 'text-primary' : 'text-muted-foreground'}`}
          onClick={() => onSetDefault(clip.id)}
          aria-label="Set as default"
          title="Set as default"
        >
          <Star className={`h-3.5 w-3.5 ${clip.is_default ? 'fill-primary' : ''}`} />
        </Button>
        <DeleteConfirmDialog
          trigger={
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              disabled={deleting === clip.id}
            >
              {deleting === clip.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          }
          title="Delete previz clip?"
          description={`Permanently remove "${clip.title}" from this session.`}
          onConfirm={() => onDelete(clip.id)}
        />
      </div>
      </div>
    </div>
  );
}

export function SessionPrevizClipsManager({ sessionId, sessionToken }: Props) {
  const [clips, setClips] = useState<PrevizClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState<string>('');
  const [titleDraft, setTitleDraft] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchClips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('session_previz_clips')
      .select('id, title, url, sort_order, is_default')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) {
      toast.error('Failed to load previz clips');
    } else {
      setClips((data as PrevizClip[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handlePick = async (file: File | undefined) => {
    if (!file) return;
    const check = isAcceptablePrevizFile(file);
    if (check.ok === false) {
      toast.error(check.reason);
      return;
    }
    const playable = await probePlayable(file);
    if (!playable) {
      toast.error("Browser can't decode this file. Re-export as H.264 .mp4 from AME.");
      return;
    }
    const title = titleDraft.trim() || file.name.replace(/\.[^.]+$/, '');
    setUploading(true);
    setProgress(5);
    setStageLabel('Uploading previz…');
    try {
      // Upload the original file as-is. The source is already an MP4/WebM
      // the browser confirmed it can decode, so re-encoding only risks
      // corrupting audio or failing on large files. Original = cleanest.
      const { url } = await uploadPrevizFile(file, `previz/${sessionId}/`);
      setProgress(92);
      const nextOrder = clips.length ? Math.max(...clips.map((c) => c.sort_order)) + 1 : 0;
      const { error } = await supabase.from('session_previz_clips').insert({
        session_id: sessionId,
        title,
        url,
        sort_order: nextOrder,
        is_default: clips.length === 0,
      });
      if (error) throw error;
      setProgress(100);
      setStageLabel('Done');
      setTitleDraft('');
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Previz clip added');
      await fetchClips();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
      setStageLabel('');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from('session_previz_clips').delete().eq('id', id);
    setDeleting(null);
    if (error) {
      toast.error('Failed to delete');
      return;
    }
    toast.success('Clip removed');
    await fetchClips();
  };

  const handleSetDefault = async (id: string) => {
    await supabase
      .from('session_previz_clips')
      .update({ is_default: false })
      .eq('session_id', sessionId);
    const { error } = await supabase
      .from('session_previz_clips')
      .update({ is_default: true })
      .eq('id', id);
    if (error) {
      toast.error('Failed to set default');
      return;
    }
    await fetchClips();
  };

  const handleRename = async (id: string, title: string) => {
    const { error } = await supabase
      .from('session_previz_clips')
      .update({ title })
      .eq('id', id);
    if (error) {
      toast.error('Failed to rename');
      return;
    }
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = clips.findIndex((c) => c.id === active.id);
    const newIdx = clips.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(clips, oldIdx, newIdx).map((c, i) => ({ ...c, sort_order: i }));
    setClips(reordered);
    await Promise.all(
      reordered.map((c) =>
        supabase.from('session_previz_clips').update({ sort_order: c.sort_order }).eq('id', c.id),
      ),
    );
  };

  const clientLink = `${window.location.origin}/creative/${sessionToken}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(clientLink);
      toast.success('Client previz link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MonitorPlay className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Previz Clips</h3>
          <span className="text-xs text-muted-foreground">
            {clips.length} clip{clips.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={copyLink}>
            <Copy className="h-3.5 w-3.5" /> Copy link
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => window.open(clientLink, '_blank')}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Preview
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Upload your previz as <span className="text-foreground">H.264 .mp4</span> or
        <span className="text-foreground"> .webm</span>. Files are stored as-is so the 3D venue
        plays back the original clear video and audio.
      </p>

      {/* Uploader */}
      <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/30 p-3">
        <Input
          placeholder="Clip title (optional — defaults to filename)"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          disabled={uploading}
          className="h-8 text-sm"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {uploading ? 'Optimizing…' : 'Add previz clip'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,.mp4,.webm"
            className="hidden"
            onChange={(e) => handlePick(e.target.files?.[0] ?? undefined)}
          />
          {uploading && (
            <div className="flex-1 space-y-1">
              <Progress value={progress} className="h-1.5" />
              {stageLabel && (
                <p className="text-[10px] font-mono text-muted-foreground">{stageLabel}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : clips.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">
          No previz clips yet — upload one above.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={clips.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {clips.map((clip) => (
                <SortableRow
                  key={clip.id}
                  clip={clip}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                  onRename={handleRename}
                  deleting={deleting}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
