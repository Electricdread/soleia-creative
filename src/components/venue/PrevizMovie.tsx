import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import movieAsset from '@/assets/mutiny-movie.mp4.asset.json';

/**
 * PrevizMovie — Unreal Engine rendered previz playback for Creative Session pages.
 * Replaces the live R3F venue scene with a baked, ambient looping video.
 */
export default function PrevizMovie() {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl edge-gold surface-elevated bg-black"
      style={{ aspectRatio: '16 / 9' }}
    >
      {!hasError && (
        <video
          src={movieAsset.url}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          onError={() => setHasError(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90">
          <AlertCircle className="h-8 w-8 text-primary/70" />
          <div className="text-center">
            <p className="text-sm font-medium text-primary/90">Preview unavailable</p>
            <p className="mt-1 text-xs text-muted-foreground">Unable to load previz video. Please refresh or try again later.</p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-primary/30 bg-black/55 px-3 py-1.5 backdrop-blur-md">
        <span className="text-[10px] uppercase tracking-[0.18em] text-primary/90">Unreal Previz</span>
      </div>
    </div>
  );
}
