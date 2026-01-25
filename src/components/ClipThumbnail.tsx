import React, { useState, useRef, useEffect } from 'react';
import { Play, FileText, Sparkles } from 'lucide-react';
import sunIcon from '@/assets/sun-icon.jpeg';

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
  const [isHovering, setIsHovering] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasVideoPreview = !!clip.preview_url && !videoError;

  useEffect(() => {
    if (isHovering && videoRef.current && hasVideoPreview) {
      videoRef.current.play().catch(() => {
        setVideoError(true);
      });
    } else if (!isHovering && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovering, hasVideoPreview]);

  return (
    <div 
      className="relative aspect-[4/3] bg-secondary/20"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Luxury Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradient} opacity-70`} />

      {/* Static Thumbnail - always shown as base layer */}
      {!hasImageError ? (
        <img
          src={clip.thumbnail}
          alt={clip.title}
          className={`absolute inset-0 w-full h-full object-cover transition-elegant group-hover:scale-105 ${
            isHovering && videoLoaded && hasVideoPreview ? 'opacity-0' : 'opacity-100'
          }`}
          onError={() => onImageError(clip.id)}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-accent/10">
          <Sparkles className="w-12 h-12 text-primary/60" />
        </div>
      )}

      {/* Video Preview - shown on hover if available, loops continuously */}
      {hasVideoPreview && (
        <video
          ref={videoRef}
          src={clip.preview_url!}
          muted
          loop
          playsInline
          preload="auto"
          onCanPlayThrough={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-elegant ${
            isHovering && videoLoaded ? 'opacity-100 scale-105' : 'opacity-0'
          }`}
        />
      )}

      {/* Sun Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center transition-elegant z-10">
          <img src={sunIcon} alt="Selected" className="w-full h-full object-contain drop-shadow-lg" />
        </div>
      )}

      {/* Elegant Note Indicator */}
      {hasNote && (
        <div className="absolute top-3 left-3 w-9 h-9 bg-gradient-to-br from-success to-primary rounded-full flex items-center justify-center glow-amber shadow-lg z-10">
          <FileText className="w-4 h-4 text-success-foreground" />
        </div>
      )}

      {/* Luxury Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-elegant z-10">
        <button
          onClick={onPlayClick}
          className="w-16 h-16 bg-background/95 rounded-full flex items-center justify-center hover:bg-background transition-elegant shadow-2xl glow-gold hover:scale-110"
        >
          <Play className="w-8 h-8 text-primary ml-1" />
        </button>
      </div>

      {/* Sun Icon Badge on hover */}
      <div className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-elegant z-10">
        <img src={sunIcon} alt="Premium" className="w-full h-full object-contain drop-shadow-lg" />
      </div>
    </div>
  );
};

export default ClipThumbnail;
