import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import { Crossfade, FadeSwap } from '@/components/motion/Crossfade';
import { HIGHLIGHT_SPRING, useWarmImages } from '@/components/motion/motion';

/**
 * Static Logo, shown rather than described.
 *
 * The service is a still mark held on the main screens while the club library
 * keeps the rest of the room moving. The clip that used to sit here was a pass
 * through the venue model — handsome, but at card size it read as "a video",
 * not "your logo, there". This puts the Soleia mark on the actual screens in
 * photographs of the actual room, on the surfaces the buyout's ten logos land
 * on: the two IMAG walls and the Center panel indoors, the two verticals and
 * the arch outside. The photographs and the screen positions are the zone
 * card's, so the room reads the same way twice on one page.
 *
 * Nothing animates on the screens — that is the point of a static logo. The
 * highlight glides between the views and the photo crossfades; the mark stays.
 */

const MARK = '/soleia-logo-color.png';

type View = {
  id: string;
  label: string;
  image: string;
  alt: string;
  note: string;
  /**
   * The face of each screen in this photograph, as percentages of the 16:9
   * frame: centre x/y, width and height. Measured on the render itself, not
   * taken from the zone card's label pins, which point at a screen from above.
   */
  marks: { x: number; y: number; w: number; h: number }[];
};

const VIEWS: View[] = [
  {
    id: 'stage',
    label: 'Main room',
    image: '/creative-guide/specific-zones/zone-1-main-stage.jpg',
    alt: 'The main stage screens carrying the Soleia mark — IMAG SR, Center and IMAG SL',
    note: 'IMAG SR · Center · IMAG SL',
    marks: [
      { x: 25.2, y: 38.6, w: 23, h: 27 },
      { x: 50.8, y: 42.8, w: 13.3, h: 17 },
      { x: 74.4, y: 38.6, w: 24, h: 27 },
    ],
  },
  {
    id: 'outdoor',
    label: 'Beachclub',
    image: '/creative-guide/specific-zones/zone-4-outdoor.jpg',
    alt: 'The two outdoor verticals carrying the Soleia mark',
    note: 'Outdoor SR · Outdoor SL',
    marks: [
      { x: 19.1, y: 45.8, w: 9.4, h: 36 },
      { x: 82, y: 35, w: 19.5, h: 45 },
    ],
  },
  {
    id: 'arch',
    label: 'Arch',
    image: '/creative-guide/specific-zones/zone-5-arch.jpg',
    alt: 'The outdoor arch carrying the Soleia mark',
    note: 'Outdoor Arch',
    marks: [{ x: 48.6, y: 38.2, w: 45.7, h: 27.8 }],
  },
];

const IMAGES = VIEWS.map((v) => v.image);

export interface StaticLogoDemoProps {
  /** Opens the real pass through the venue model full screen. */
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
        {/* The mark, held still on the face of each included screen */}
        {view.marks.map((m, i) => (
          <div
            key={i}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2px] bg-[#0a0908]/92 shadow-[0_0_0_1px_hsl(var(--primary)/0.4),0_0_26px_-4px_hsl(var(--primary)/0.55)]"
            style={{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%` }}
          >
            <img
              src={MARK}
              alt=""
              className="max-h-[62%] w-[78%] object-contain"
              style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary) / 0.35))' }}
            />
          </div>
        ))}
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
      <div className="flex items-center gap-2 border-t border-primary/15 px-5 py-3 sm:px-7" role="tablist" aria-label="Where a static logo lands">
        {VIEWS.map((v) => {
          const on = v.id === view.id;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setViewId(v.id)}
              className={`tab-glow relative rounded-full border px-4 py-2 text-[10.5px] uppercase tracking-[0.18em] ${
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
        <span className="ml-auto hidden text-[12px] text-muted-foreground/80 sm:block">Held still, all night.</span>
      </div>
    </div>
  );
}

export default StaticLogoDemo;
