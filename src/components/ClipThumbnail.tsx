import React, { useState, useRef, useEffect } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import showbloxIcon from '@/assets/showblox-icon.png';

interface ClipThumbnailProps {
  clip: {
    id: string;
    title: string;
    thumbnail: string;
    preview_url?: string | null;
  };
  isSelected: boolean;
  hasNote: boolean;
  hasImageError: boolean;
  onImageError: (id: string) => void;
  onPlayClick: (e: React.MouseEvent) => void;
  categoryGradient: string;
}

const ClipThumbnail: React.FC<ClipThumbnailProps> = ({
  clip,
  isSelected,
  hasNote,
  hasImageError,
  onImageError,
  onPlayClick,
  categoryGradient,
}) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasVideoPreview = !!clip.preview_url && !videoError;

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

  // Auto-play video when visible
  useEffect(() => {
    if (isVisible && videoRef.current && hasVideoPreview && videoLoaded) {
      videoRef.current.play().catch(() => {
        setVideoError(true);
      });
    } else if (!isVisible && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isVisible, hasVideoPreview, videoLoaded]);

  return (
    <div 
      ref={containerRef}
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
          fetchPriority="high"
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
          src={clip.preview_url!}
          poster={clip.thumbnail || undefined}
          muted
          loop
          playsInline
          preload="auto"
          onCanPlayThrough={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-elegant ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          } ${isSelected ? 'grayscale opacity-50' : ''}`}
        />
      )}

      {/* ShowBlox Selection Indicator - Centered with pulse animation */}
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-16 h-16 flex items-center justify-center">
            <img src={showbloxIcon} alt="Selected" className="w-full h-full object-contain showblox-icon-selected" />
          </div>
        </div>
      )}

      {/* Elegant Note Indicator */}
      {hasNote && (
        <div className="absolute top-3 left-3 w-9 h-9 bg-gradient-to-br from-success to-primary rounded-full flex items-center justify-center glow-amber shadow-lg z-10">
          <FileText className="w-4 h-4 text-success-foreground" />
        </div>
      )}

      {/* ShowBlox Icon Badge - only show when not selected */}
      {!isSelected && (
        <div className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-elegant z-10">
          <img src={showbloxIcon} alt="Premium" className="w-full h-full object-contain drop-shadow-lg" />
        </div>
      )}
    </div>
  );
};

export default ClipThumbnail;
