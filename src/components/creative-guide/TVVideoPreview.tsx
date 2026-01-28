import React, { useState, useRef } from 'react';
import { VideoModal } from './VideoModal';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const TV_CABANAS_VIDEO = `${SUPABASE_URL}/storage/v1/object/public/clips/venue-visualization/Soleia%20Pixelmap%203D%20TV%20Cabanas%20Preview.webm`;

export function TVVideoPreview() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div 
        className="relative w-full h-full cursor-pointer group"
        onClick={handleClick}
      >
        <video
          ref={videoRef}
          src={TV_CABANAS_VIDEO}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
        {/* Tap for fullscreen hint */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <span className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm text-xs text-foreground border border-border/50">
            Tap for fullscreen
          </span>
        </div>
      </div>

      <VideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoSrc={TV_CABANAS_VIDEO}
        title="Soleia Pixelmap 3D TV Cabanas Preview"
      />
    </>
  );
}

export default TVVideoPreview;
