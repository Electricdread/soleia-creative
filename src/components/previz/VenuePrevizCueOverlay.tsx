import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { PrevizCue } from '@/components/previz/PrevizPlayer';
import { formatMMSS } from '@/components/previz/PrevizPlayer';
import { getMediaDuration, isUsableDuration } from '@/lib/mediaDuration';

const GOLD = '#c49a3c';

interface Props {
  /** Source video element whose currentTime drives the highlight. */
  video: HTMLVideoElement | null;
  cues: PrevizCue[];
  /** When false the overlay is hidden (e.g. previz is off). */
  visible: boolean;
  className?: string;
}

/**
 * Bottom-strip cue marker bar that sits inside the 3D venue container.
 * Stays visible in both inline and fullscreen because it's a child of the
 * fullscreen target element (roomRef).
 */
export function VenuePrevizCueOverlay({ video, cues, visible, className }: Props) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const stripRef = useRef<HTMLDivElement | null>(null);

  const sorted = useMemo(
    () => [...cues].sort((a, b) => a.time_seconds - b.time_seconds),
    [cues],
  );

  useEffect(() => {
    if (!video) return;
    let raf = 0;
    const tick = () => {
      setCurrentTime(video.currentTime);
      if (!video.paused && !video.ended) raf = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const onPause = () => {
      cancelAnimationFrame(raf);
      setCurrentTime(video.currentTime);
    };
    const onLoaded = () => {
      if (isUsableDuration(video.duration)) setDuration(video.duration);
      else getMediaDuration(video.currentSrc || video.src).then(setDuration);
    };
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onPause);
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('timeupdate', onPause);
    if (!video.paused) onPlay();
    if (isUsableDuration(video.duration)) setDuration(video.duration);
    else if (video.currentSrc || video.src) getMediaDuration(video.currentSrc || video.src).then(setDuration);
    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onPause);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('timeupdate', onPause);
    };
  }, [video]);

  const activeId = useMemo(() => {
    let id: string | null = null;
    for (const c of sorted) {
      if (c.time_seconds <= currentTime + 0.05) id = c.id;
      else break;
    }
    return id;
  }, [sorted, currentTime]);

  if (!visible || !video || sorted.length === 0) return null;

  const pct = (t: number) => (isUsableDuration(duration) ? Math.min(100, Math.max(0, (t / duration) * 100)) : 0);

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-20 z-10 flex justify-center px-4',
        className,
      )}
    >
      <div className="pointer-events-auto w-full max-w-3xl rounded-full border border-primary/30 bg-black/55 px-4 py-2 backdrop-blur-md">
        <div className="mb-1 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.18em] text-primary/80">
          <span>Run of Show</span>
          <span className="text-white/70">
            {formatMMSS(currentTime)} / {formatMMSS(duration)}
          </span>
        </div>
        <div
          ref={stripRef}
          className="relative h-11 cursor-pointer rounded-full bg-white/5"
          onClick={(e) => {
            if (!duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            video.currentTime = Math.max(0, Math.min(duration, ratio * duration));
          }}
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 rounded-l-full bg-white/8"
            style={{ width: `${pct(currentTime)}%` }}
          />
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px"
            style={{ left: `${pct(currentTime)}%`, background: GOLD }}
          />
          {sorted.map((c, index) => {
            const isActive = c.id === activeId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  video.currentTime = c.time_seconds;
                }}
                className="group absolute top-0 bottom-0 flex w-16 -translate-x-1/2 flex-col items-center"
                style={{ left: `${pct(c.time_seconds)}%` }}
                aria-label={`Jump to ${c.label}`}
              >
                <div
                  className={cn(
                    'mt-1 h-2 w-2 rounded-full border transition-all',
                    isActive
                      ? 'scale-150 border-transparent shadow-[0_0_10px_rgba(196,154,60,0.8)]'
                      : 'border-white/40 bg-black/40 group-hover:border-primary',
                  )}
                  style={isActive ? { background: c.color || GOLD } : {}}
                />
                <span
                  className={cn(
                    'mt-0.5 max-w-16 truncate whitespace-nowrap rounded px-1 text-[9px] font-medium leading-tight',
                    isActive ? 'text-white' : 'text-white/60 group-hover:text-white',
                  )}
                  style={{ transform: `translateY(${(index % 3) * 10}px)`, ...(isActive ? { color: c.color || GOLD } : {}) }}
                  title={`${formatMMSS(c.time_seconds)} — ${c.label}`}
                >
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
