import { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MediaItem {
  id: string;
  item_type: string;
  title: string | null;
  url: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
}

interface FullscreenMediaViewerProps {
  items: MediaItem[];
  currentId: string;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export function FullscreenMediaViewer({
  items,
  currentId,
  onClose,
  onNavigate,
}: FullscreenMediaViewerProps) {
  const currentIndex = items.findIndex((i) => i.id === currentId);
  const current = items[currentIndex];
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!current) return;
    const url = current.file_url || current.url;
    if (!url) return;
    setDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const ext = current.item_type === 'video' ? 'mp4' : 'jpg';
      a.download = `${current.title || 'download'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    }
    setDownloading(false);
  };

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(items[currentIndex - 1].id);
  }, [currentIndex, items, onNavigate]);

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) onNavigate(items[currentIndex + 1].id);
  }, [currentIndex, items, onNavigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, goPrev, goNext]);

  if (!current) return null;

  const mediaUrl = current.file_url || current.url;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Top controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white hover:bg-white/10 h-10 w-10"
          onClick={handleDownload}
          disabled={downloading}
        >
          <Download className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white hover:bg-white/10 h-10 w-10"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Nav arrows */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 sm:left-4 z-10 text-white/50 hover:text-white hover:bg-white/10 h-12 w-12"
          onClick={goPrev}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}
      {currentIndex < items.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 sm:right-4 z-10 text-white/50 hover:text-white hover:bg-white/10 h-12 w-12"
          onClick={goNext}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Media */}
      <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center">
        {current.item_type === 'video' && mediaUrl ? (
          <video
            key={current.id}
            src={mediaUrl}
            className="max-w-full max-h-[85vh] rounded-lg"
            autoPlay
            loop
            muted
            playsInline
            controls
          />
        ) : current.item_type === 'image' && mediaUrl ? (
          <img
            src={mediaUrl}
            alt={current.title || 'Image'}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
          />
        ) : (
          <div className="text-white/50 text-sm">No preview available</div>
        )}
      </div>

      {/* Title + counter */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        {current.title && (
          <p className="text-white/80 text-sm mb-1">{current.title}</p>
        )}
        <p className="text-white/40 text-xs">
          {currentIndex + 1} / {items.length}
        </p>
      </div>
    </div>
  );
}
