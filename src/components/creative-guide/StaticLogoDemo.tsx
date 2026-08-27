import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import { Crossfade, FadeSwap } from '@/components/motion/Crossfade';
import { HIGHLIGHT_SPRING, useWarmImages } from '@/components/motion/motion';

/**
 * Static Logo, shown on the screens it lands on.
 *
 * These are the owner's own renders (2026-08-27): the Soleia mark held still
 * on the venue model's actual surfaces — the main-room walls and booth, the
 * ceiling rays, the beachclub verticals, the arch over the Strip, the pool
 * deck, and a cabana television. Nothing is composited in code any more; the
 * renders carry the mark exactly where the playback system puts it.
 *
 * Nothing animates on the screens — that is the point of a static logo. The
 * highlight glides between the views and the render crossfades; the mark stays.
 */

type View = {
  id: string;
  label: string;
  image: string;
  alt: string;
  note: string;
};

const DIR = '/creative-guide/static-logo';

const VIEWS: View[] = [
  {
    id: 'main',
    label: 'Main room',
    image: `${DIR}/main-room.jpg`,
    alt: 'The Soleia mark held on the main-room walls, the DJ booth face and the ceiling rays',
    note: 'IMAG SR · IMAG SL · DJ Booth · Sol Rays',
  },
  {
    id: 'sunburst',
    label: 'Sunburst',
    image: `${DIR}/sunburst.jpg`,
    alt: 'The Soleia mark repeated along the six ceiling rays around the sunburst',
    note: 'Sol Rays 1 – 6',
  },
  {
    id: 'beachclub',
    label: 'Beachclub',
    image: `${DIR}/beachclub.jpg`,
    alt: 'The Soleia mark on the two outdoor verticals, the pool and palms in front',
    note: 'Outdoor SR · Outdoor SL',
  },
  {
    id: 'arch',
    label: 'Arch',
    image: `${DIR}/arch.jpg`,
    alt: 'The Soleia mark on the outdoor arch, the Strip behind it at sunset',
    note: 'Outdoor Arch',
  },
  {
    id: 'pool',
    label: 'Pool deck',
    image: `${DIR}/pool-deck.jpg`,
    alt: 'The pool deck at dusk, the Soleia mark on every screen facing it',
    note: 'The beachclub, from the water',
  },
  {
    id: 'tv',
    label: 'TV',
    image: `${DIR}/tv.jpg`,
    alt: 'A cabana television carrying the Soleia mark, the beachclub beyond the curtain',
    note: 'Cabana & bungalow network',
  },
];

const IMAGES = VIEWS.map((v) => v.image);

export interface StaticLogoDemoProps {
  /** Opens the pass through the venue model full screen. */
  onFullscreen?: () => void;
  className?: string;
}

export function StaticLogoDemo({ onFullscreen, className = '' }: StaticLogoDemoProps) {
  const [viewId, setViewId] = useState(VIEWS[0].id);
  const view = useMemo(() => VIEWS.find((v) => v.id === viewId) ?? VIEWS[0], [viewId]);
  const reduceMotion = useReducedMotion();
  const images = useMemo(() => IMAGES, []);
  useWarmImages(images);

  return (
    <div className={className}>
      <Crossfade id={view.id} className="aspect-video overflow-hidden bg-black">
        <img src={view.image} alt={view.alt} decoding="async" className="media-grade h-full w-full object-cover" />
        <div className="media-veil absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" aria-hidden="true" />
      </Crossfade>

      <div className="relative">
        <FadeSwap id={view.id} className="pointer-events-none absolute -top-11 left-4 max-w-[calc(100%-224px)] sm:left-5">
          <span className="block truncate rounded-full border border-white/15 bg-black/65 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-white backdrop-blur-md">
            Static · {view.note}
          </span>
        </FadeSwap>
        {onFullscreen && (
          <button
            type="button"
            onClick={onFullscreen}
            className="btn-glow tap-44 absolute -top-12 right-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3.5 py-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white backdrop-blur-sm hover:bg-black/80"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            See it on the wall
          </button>
        )}
      </div>

      {/* Which screens */}
      <div className="flex items-center gap-2 overflow-x-auto border-t border-primary/15 px-5 py-3 scrollbar-hide sm:px-7" role="tablist" aria-label="Where a static logo lands">
        {VIEWS.map((v) => {
          const on = v.id === view.id;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setViewId(v.id)}
              className={`tab-glow relative flex-shrink-0 rounded-full border px-4 py-2 text-[10.5px] uppercase tracking-[0.18em] ${
                on ? 'border-primary/60 text-primary' : 'border-border/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {on && (
                <motion.span
                  layoutId={reduceMotion ? undefined : 'static-logo-view'}
                  transition={HIGHLIGHT_SPRING}
                  className="glow-ring pointer-events-none absolute inset-0 rounded-full bg-primary/12"
                  aria-hidden="true"
                />
              )}
              <span className="relative">{v.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default StaticLogoDemo;
