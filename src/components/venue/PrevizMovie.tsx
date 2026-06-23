import movieAsset from '@/assets/mutiny-movie.mp4.asset.json';

/**
 * PrevizMovie — Unreal Engine rendered previz playback for Creative Session pages.
 * Replaces the live R3F venue scene with a baked, ambient looping video.
 */
export default function PrevizMovie() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl edge-gold surface-elevated bg-black"
      style={{ aspectRatio: '16 / 9' }}
    >
      <video
        src={movieAsset.url}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-primary/30 bg-black/55 px-3 py-1.5 backdrop-blur-md">
        <span className="text-[10px] uppercase tracking-[0.18em] text-primary/90">Unreal Previz</span>
      </div>
    </div>
  );
}
