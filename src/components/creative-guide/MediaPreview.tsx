import React, { useState, useRef } from 'react';
import { VideoModal } from './VideoModal';

interface MediaPreviewProps {
  type: 'video' | 'image';
  src: string;
  alt?: string;
  title?: string;
  className?: string;
}

export function MediaPreview({ type, src, alt = '', title, className = '' }: MediaPreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleClick = () => {
    if (type === 'video') {
      setIsModalOpen(true);
    } else {
      setIsImageModalOpen(true);
    }
  };

  return (
    <>
      <div 
        className={`relative w-full h-full cursor-pointer group ${className}`}
        onClick={handleClick}
      >
        {type === 'video' ? (
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
        ) : (
          <img 
            src={src} 
            alt={alt}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Tap for fullscreen hint */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <span className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm text-xs text-foreground border border-border/50">
            Tap for fullscreen
          </span>
        </div>
      </div>

      {/* Video Modal */}
      {type === 'video' && (
        <VideoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          videoSrc={src}
          title={title || alt}
        />
      )}

      {/* Image Modal */}
      {type === 'image' && isImageModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/20 hover:bg-background/40 text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <img 
            src={src} 
            alt={alt}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {title && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm text-sm text-foreground">
              {title}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default MediaPreview;
