import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ExternalLink, Play, Pause, X, Heart, Sparkles, Loader2, Grid3X3, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SyncedImage {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  source: string;
  media_type?: 'image' | 'video';
  width?: number;
  height?: number;
}

interface SyncedAlbumProps {
  images: SyncedImage[];
  source: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

function AlbumItem({ item, index, onClick }: { item: SyncedImage; index: number; onClick: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isVideo = item.media_type === 'video' || 
    item.url?.includes('.mp4') || 
    item.url?.includes('.webm') ||
    item.thumbnail?.includes('.mp4') ||
    item.thumbnail?.includes('.webm');

  // Intersection Observer for lazy loading and auto-play
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.3, rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-play video when visible
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    if (isVisible && videoLoaded) {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isVisible, isVideo, videoLoaded]);

  // Determine aspect ratio class for masonry effect
  const getSpanClass = () => {
    if (item.width && item.height) {
      const ratio = item.height / item.width;
      if (ratio > 1.4) return 'row-span-2';
      if (ratio < 0.7) return 'col-span-2';
    }
    // Pseudo-random based on index for visual variety
    if (index % 7 === 0) return 'row-span-2';
    if (index % 11 === 0) return 'col-span-2';
    return '';
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={cn(
        "relative group cursor-pointer rounded-xl overflow-hidden bg-zinc-800/50",
        "aspect-square",
        getSpanClass()
      )}
      onClick={onClick}
    >
      {/* Gradient shimmer while loading */}
      {!imageLoaded && !videoLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-cyan-500/20 animate-pulse" />
      )}

      {isVideo ? (
        <video
          ref={videoRef}
          src={item.url || item.thumbnail}
          poster={item.thumbnail}
          muted
          loop
          playsInline
          webkit-playsinline="true"
          preload="metadata"
          onLoadedData={() => setVideoLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            videoLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      ) : (
        <img
          src={item.thumbnail || item.url}
          alt={item.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}

      {/* Video playing indicator */}
      {isVideo && (
        <div className={cn(
          "absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-tech uppercase tracking-wider flex items-center gap-1 transition-opacity",
          isPlaying 
            ? "bg-emerald-500/80 text-white" 
            : "bg-zinc-900/80 text-zinc-300"
        )}>
          {isPlaying ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Playing
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              Video
            </>
          )}
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-xs text-white font-medium truncate">{item.title}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5 capitalize">{item.source}</p>
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(item.url, '_blank');
            }}
          >
            <ExternalLink className="w-4 h-4 text-white" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const response = await fetch(item.url);
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `${item.title || 'image'}.${isVideo ? 'mp4' : 'jpg'}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
              } catch {
                window.open(item.url, '_blank');
              }
            }}
          >
            <Download className="w-4 h-4 text-white" />
          </Button>
        </div>

        {/* Heart icon */}
        <div className="absolute bottom-3 right-3">
          <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
        </div>
      </div>
    </motion.div>
  );
}

function LightboxModal({ 
  item, 
  onClose, 
  onPrev, 
  onNext 
}: { 
  item: SyncedImage; 
  onClose: () => void; 
  onPrev: () => void; 
  onNext: () => void;
}) {
  const isVideo = item.media_type === 'video' || 
    item.url?.includes('.mp4') || 
    item.url?.includes('.webm');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-4 right-4 z-10 h-10 w-10 p-0 bg-white/10 hover:bg-white/20 rounded-full"
        onClick={onClose}
      >
        <X className="w-5 h-5 text-white" />
      </Button>

      {/* Navigation arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
      >
        ←
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
      >
        →
      </button>

      {/* Media content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-[90vw] max-h-[85vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={item.url}
            controls
            autoPlay
            loop
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl"
          />
        ) : (
          <img
            src={item.url}
            alt={item.title}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        )}

        {/* Title bar */}
        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <p className="text-sm text-white font-medium">{item.title}</p>
          <p className="text-xs text-zinc-500 capitalize">{item.source}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function SyncedAlbum({ images, source, onRefresh, isRefreshing }: SyncedAlbumProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('masonry');

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (selectedIndex === 0) {
      setSelectedIndex(images.length - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else if (selectedIndex === images.length - 1) {
      setSelectedIndex(0);
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-purple-400/50" />
        </div>
        <p className="text-sm font-tech text-zinc-400">No synced content yet</p>
        <p className="text-xs text-zinc-600 mt-1">Sync your likes to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
            <span className="text-xs font-tech text-white">{images.length} Synced</span>
          </div>
          
          {/* View toggle */}
          <div className="flex items-center bg-zinc-800/50 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('masonry')}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'masonry' ? "bg-purple-500/30 text-purple-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'grid' ? "bg-purple-500/30 text-purple-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {onRefresh && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs text-zinc-400 hover:text-white"
          >
            {isRefreshing ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            )}
            Refresh
          </Button>
        )}
      </div>

      {/* Album Grid */}
      <div className={cn(
        "gap-2",
        viewMode === 'masonry' 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 auto-rows-[120px] sm:auto-rows-[150px]"
          : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      )}>
        {images.map((item, index) => (
          <AlbumItem
            key={item.id}
            item={item}
            index={index}
            onClick={() => setSelectedIndex(index)}
          />
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && images[selectedIndex] && (
          <LightboxModal
            item={images[selectedIndex]}
            onClose={() => setSelectedIndex(null)}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
