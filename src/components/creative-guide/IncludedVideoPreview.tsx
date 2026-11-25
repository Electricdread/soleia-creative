import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Play } from 'lucide-react';

type Props = {
  video: string;
  poster: string;
  onWatch: (video: string) => void;
};

/**
 * The first thing in "What's included": the What's Included film (approved by
 * the owner 2026-11-25) playing muted and looping, with a button that opens it
 * in the page's video modal. Rivka (Soleia, 2026-11-19) asked for the static-logo
 * example up front here; the film shows it on every included screen, and the
 * LED branding add-on card keeps the original static-logo loop.
 *
 * The clip only loads once the card is near the viewport, and reduced motion
 * shows the still poster instead of a moving preview.
 */
export function IncludedVideoPreview({ video, poster, onWatch }: Props) {
  const reduceMotion = useReducedMotion();
  const frameRef = useRef<HTMLButtonElement>(null);
  const [nearView, setNearView] = useState(false);

  useEffect(() => {
    const node = frameRef.current;
    if (!node || nearView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNearView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [nearView]);

  const playInline = nearView && !reduceMotion;

  return (
    <figure data-included-preview className="mb-4 overflow-hidden rounded-2xl border border-primary/25 bg-card/60">
      <button
        ref={frameRef}
        type="button"
        onClick={() => onWatch(video)}
        aria-label="Watch the film: what’s included with your buyout"
        className="group relative block aspect-video w-full overflow-hidden bg-black focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        {playInline ? (
          <video
            src={video}
            poster={poster}
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
          />
        ) : (
          <img src={poster} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/20" />
        <span aria-hidden="true" className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur-md sm:left-5 sm:top-5">
          Included with your buyout
        </span>
        <span
          aria-hidden="true"
          className="btn-glow absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-primary/50 bg-black/65 px-4 py-2.5 text-sm font-medium text-primary backdrop-blur-sm group-hover:bg-black/80 group-hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.5),0_0_22px_-4px_hsl(var(--primary)/0.45),0_0_56px_-14px_hsl(var(--primary)/0.3)] sm:bottom-5 sm:right-5"
        >
          <Play className="h-4 w-4" /> Watch the film
        </span>
      </button>
      <figcaption className="px-5 py-4 text-sm leading-relaxed text-muted-foreground sm:px-7 sm:text-base">
        A one-minute walk through the venue: your logos on the five LED screens and the 28 TVs, and the screens you can add.
      </figcaption>
    </figure>
  );
}
