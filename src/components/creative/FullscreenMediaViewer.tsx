import { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PdfSlideshow } from '@/components/creative/PdfSlideshow';
import { HtmlEmbed } from '@/components/creative/HtmlEmbed';
import { downloadName, mediaKind } from '@/lib/sessionMedia';

interface MediaItem {
  id: string;
  item_type: string;
  title: string | null;
  url: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  description?: string | null;
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
  const kind = current ? mediaKind(current) : null;
  const [downloading, setDownloading] = useState(false);
  // A deck is stepped through slide by slide before the arrows move on to the next item.
  const [slide, setSlide] = useState(1);
  const [slideCount, setSlideCount] = useState(0);

  useEffect(() => {
    setSlide(1);
    setSlideCount(0);
  }, [currentId]);

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
      a.download = downloadName(current);
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

  const inDeck = kind === 'pdf';
  const canPrev = (inDeck && slide > 1) || currentIndex > 0;
  const canNext = (inDeck && slide < slideCount) || currentIndex < items.length - 1;

  const goPrev = useCallback(() => {
    if (inDeck && slide > 1) setSlide(slide - 1);
    else if (currentIndex > 0) onNavigate(items[currentIndex - 1].id);
  }, [inDeck, slide, currentIndex, items, onNavigate]);

  const goNext = useCallback(() => {
    if (inDeck && slide < slideCount) setSlide(slide + 1);
    else if (currentIndex < items.length - 1) onNavigate(items[currentIndex + 1].id);
  }, [inDeck, slide, slideCount, currentIndex, items, onNavigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') goPrev();
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (inDeck && e.key === ' ')) goNext();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, goPrev, goNext, inDeck]);

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
          aria-label="Download"
        >
          <Download className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white hover:bg-white/10 h-10 w-10"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Nav arrows */}
      {canPrev && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 sm:left-4 z-10 text-white/50 hover:text-white hover:bg-white/10 h-12 w-12"
          onClick={goPrev}
          aria-label="Previous"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}
      {canNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 sm:right-4 z-10 text-white/50 hover:text-white hover:bg-white/10 h-12 w-12"
          onClick={goNext}
          aria-label="Next"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Media */}
      <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center">
        {kind === 'video' && mediaUrl ? (
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
        ) : kind === 'image' && mediaUrl ? (
          <img
            src={mediaUrl}
            alt={current.title || 'Image'}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
          />
        ) : kind === 'pdf' && mediaUrl ? (
          <PdfSlideshow
            key={current.id}
            url={mediaUrl}
            page={slide}
            onPageCount={setSlideCount}
            alt={current.title || undefined}
            className="w-[84vw] sm:w-[80vw] h-[72vh]"
          />
        ) : kind === 'html' && mediaUrl ? (
          <HtmlEmbed
            key={current.id}
            url={mediaUrl}
            title={current.title || 'Interactive preview'}
            mode="full"
            className="w-[84vw] sm:w-[80vw] h-[72vh] rounded-lg bg-white"
          />
        ) : (
          <div className="text-white/50 text-sm">No preview available</div>
        )}
      </div>

      {/* Title + counter + download hint */}
      <div className="absolute bottom-4 left-0 right-0 px-4 text-center space-y-1">
        {current.title && (
          <p className="text-white/80 text-sm">{current.title}</p>
        )}
        {(kind === 'pdf' || kind === 'html') && current.description && (
          <p className="mx-auto max-w-2xl text-white/55 text-xs line-clamp-2">{current.description}</p>
        )}
        <p className="text-white/40 text-xs">
          {inDeck && slideCount > 0 ? `Slide ${slide} / ${slideCount} · ` : ''}
          {currentIndex + 1} / {items.length}
        </p>
        {(kind === 'video' || kind === 'image' || kind === 'pdf') && (
          <button
            onClick={handleDownload}
            className="text-white/40 hover:text-white/70 text-[10px] inline-flex items-center gap-1 transition-colors mt-1"
          >
            <Download className="h-3 w-3" /> Tap to download
          </button>
        )}
      </div>
    </div>
  );
}
