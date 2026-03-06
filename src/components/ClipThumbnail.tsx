import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import soleiaIcon from '@/assets/sol-icon.png';

interface ClipThumbnailProps {
  clip: {
    id: string;
    title: string;
    thumbnail: string;
    previewUrl?: string | null;
  };
  isSelected: boolean;
  hasNote: boolean;
  hasImageError: boolean;
  onImageError: (id: string) => void;
  onPlayClick: (e: React.MouseEvent) => void;
  categoryGradient: string;
}

const ClipThumbnail = forwardRef<HTMLDivElement, ClipThumbnailProps>(({
  clip,
  isSelected,
  hasNote,
  hasImageError,
  onImageError,
  onPlayClick,
  categoryGradient,
}, ref) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasVideoPreview = !!clip.previewUrl && !videoError;

  // Intersection Observer for auto-play when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-play video when visible - with iOS-friendly handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideoPreview) return;

    if (isVisible && videoLoaded) {
      // Ensure video is muted for autoplay to work on iOS
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('Autoplay prevented:', error);
          // Don't set error state - thumbnail fallback handles this gracefully
        });
      }
    } else {
      video.pause();
    }
  }, [isVisible, hasVideoPreview, videoLoaded]);

  // Handle video ready to play
  const handleVideoReady = () => {
    setVideoLoaded(true);
  };

  return (
    <div 
      ref={(node) => {
        // Handle both internal ref and forwarded ref
        containerRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className="relative aspect-[4/3] bg-secondary/20"
    >
      {/* Luxury Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradient} opacity-70`} />

      {/* Static Thumbnail - shown as fallback when no video or video loading */}
      {(!hasVideoPreview || !videoLoaded) && !hasImageError && (
        <img
          src={clip.thumbnail}
          alt={clip.title}
          className={`absolute inset-0 w-full h-full object-cover transition-elegant ${
            isSelected ? 'grayscale opacity-50' : ''
          }`}
          onError={() => onImageError(clip.id)}
          loading="eager"
          decoding="async"
        />
      )}

      {/* Fallback for image errors */}
      {hasImageError && !hasVideoPreview && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-accent/10">
          <Sparkles className="w-12 h-12 text-primary/60" />
        </div>
      )}

      {/* Video Preview - auto-plays when in viewport */}
      {hasVideoPreview && (
        <video
          ref={videoRef}
          src={clip.previewUrl!}
          poster={clip.thumbnail || undefined}
          muted
          loop
          playsInline
          webkit-playsinline="true"
          preload="auto"
          onLoadedData={handleVideoReady}
          onCanPlayThrough={handleVideoReady}
          onError={() => setVideoError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-elegant ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          } ${isSelected ? 'grayscale opacity-50' : ''}`}
        />
      )}

      {/* Selection Indicator - Centered with pulse animation */}
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-16 h-16 flex items-center justify-center">
            <img src={soleiaIcon} alt="Selected" className="w-full h-full object-contain soleia-icon-selected" />
          </div>
        </div>
      )}

      {/* Elegant Note Indicator */}
      {hasNote && (
        <div className="absolute top-3 left-3 w-9 h-9 bg-gradient-to-br from-success to-primary rounded-full flex items-center justify-center glow-amber shadow-lg z-10">
          <FileText className="w-4 h-4 text-success-foreground" />
        </div>
      )}

      {/* Soleia Icon Badge - only show when not selected */}
      {!isSelected && (
        <div className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-elegant z-10">
          <img src={soleiaIcon} alt="Premium" className="w-full h-full object-contain drop-shadow-lg" />
        </div>
      )}
    </div>
  );
});

ClipThumbnail.displayName = 'ClipThumbnail';

export default ClipThumbnail;
