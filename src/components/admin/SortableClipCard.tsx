import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Pencil, Trash2, Loader2, Download, HardDrive } from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Clip {
  id: string;
  title: string;
  category: string;
  resolution: string;
  duration: string;
  created_at: string;
  video_url: string | null;
  source_url: string | null;
  thumbnail: string | null;
  sort_order?: number;
  drive_file_id?: string | null;
  drive_web_view_link?: string | null;
  original_storage?: string | null;
}

interface SortableClipCardProps {
  clip: Clip;
  getCategoryLabel: (key: string) => string;
  getCategoryColor: (key: string) => string;
  onEdit: (clip: Clip) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export function SortableClipCard({
  clip,
  getCategoryLabel,
  getCategoryColor,
  onEdit,
  onDelete,
  deletingId,
}: SortableClipCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: clip.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const isOnDrive = clip.original_storage === 'drive' && !!clip.drive_file_id;
  const canDownload = isOnDrive || !!clip.video_url;

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const filenameFromDisposition = (header: string | null, fallback: string) => {
    if (!header) return fallback;
    const m = /filename="?([^";]+)"?/i.exec(header);
    return m?.[1] ?? fallback;
  };

  const handleDownloadOriginal = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      if (isOnDrive) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(
          `${supabaseUrl}/functions/v1/download-from-drive?fileId=${encodeURIComponent(clip.drive_file_id!)}`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token ?? anon}`,
              apikey: anon,
            },
          },
        );
        if (!res.ok) {
          const txt = await res.text();
          let msg = txt;
          try { msg = JSON.parse(txt).error ?? txt; } catch { /* noop */ }
          throw new Error(msg.slice(0, 300));
        }
        const blob = await res.blob();
        const name = filenameFromDisposition(
          res.headers.get('content-disposition'),
          `${clip.title || clip.id}.mp4`,
        );
        triggerBlobDownload(blob, name);
        toast({ title: 'Downloaded from Drive', description: name });
      } else if (clip.video_url) {
        const res = await fetch(clip.video_url);
        if (!res.ok) throw new Error(`Fetch failed [${res.status}]`);
        const blob = await res.blob();
        const fallback = clip.video_url.split('/').pop() || `${clip.title}.mp4`;
        triggerBlobDownload(blob, fallback);
        toast({ title: 'Downloaded original', description: fallback });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Download failed', description: msg, variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card transition-all ${
        isDragging ? 'shadow-lg ring-2 ring-primary/50' : 'hover:border-primary/30'
      }`}
    >
      {/* Large touch-friendly drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-3 -m-1 rounded-lg cursor-grab active:cursor-grabbing bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors touch-manipulation"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Thumbnail */}
      {clip.thumbnail && (
        <div className="flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden bg-muted">
          <img
            src={clip.thumbnail}
            alt={clip.title}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{clip.title}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0"
            style={{ backgroundColor: `${getCategoryColor(clip.category)}20`, color: getCategoryColor(clip.category) }}
          >
            {getCategoryLabel(clip.category)}
          </Badge>
          {clip.resolution && (
            <span className="text-[10px] text-muted-foreground">{clip.resolution}</span>
          )}
          {clip.duration && (
            <span className="text-[10px] text-muted-foreground">• {clip.duration}</span>
          )}
          {isOnDrive && (
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 border-emerald-500/40 text-emerald-400 gap-1"
            >
              <HardDrive className="h-2.5 w-2.5" />
              Drive
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex gap-1">
        {canDownload && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownloadOriginal}
            disabled={downloading}
            title={isOnDrive ? 'Download original from Drive' : 'Download original'}
            className="h-10 w-10 rounded-lg touch-manipulation"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(clip)}
          className="h-10 w-10 rounded-lg touch-manipulation"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <DeleteConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="icon"
              disabled={deletingId === clip.id}
              className="h-10 w-10 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
            >
              {deletingId === clip.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          }
          title="Delete clip?"
          description={`This will permanently remove "${clip.title}" from the gallery. This action cannot be undone.`}
          onConfirm={() => onDelete(clip.id)}
        />
      </div>
    </div>
  );
}
