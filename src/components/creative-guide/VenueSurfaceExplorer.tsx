import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Reveal } from '@/components/motion/Reveal';
import { VENUE_AREAS, type AreaId } from '@/lib/venueSurfaces';

/**
 * Where a client's brand actually lands, area by area.
 *
 * These are photographs of the real venue with content on the screens, and the
 * thumbnail strip walks the rest of the area from there. They replaced the
 * labelled pixel-map renders this section used to open with: those answer "how
 * big is that screen?", which is the mapping section's job and the specs pages'
 * job, not the first thing a client wants from the room.
 *
 * The image is the whole point and is deliberately large: this section gets
 * talked over on a screenshared creative call, so it has to read at meeting
 * size. Resolutions and logo placement deliberately live further down in the
 * pixel-map legend — repeating them here made the opening a spec sheet.
 */

type Shot = { src: string; alt: string; kind: 'image' } | { src: string; poster?: string; alt: string; kind: 'video' };

export function VenueSurfaceExplorer() {
  const [areaId, setAreaId] = useState<AreaId>('overview');
  const [lightbox, setLightbox] = useState<Shot | null>(null);
  const reduceMotion = useReducedMotion();

  const area = useMemo(() => VENUE_AREAS.find((a) => a.id === areaId) ?? VENUE_AREAS[0], [areaId]);

  const shots = useMemo<Shot[]>(() => {
    const list: Shot[] = [{ src: area.image, alt: area.imageAlt, kind: 'image' }];
    for (const g of area.gallery ?? []) list.push({ src: g.src, alt: g.alt, kind: 'image' });
    if (area.video) list.push({ src: area.video, poster: area.videoPoster, alt: `${area.title} — motion`, kind: 'video' });
    return list;
  }, [area]);

  const [shotIndex, setShotIndex] = useState(0);
  const shot = shots[Math.min(shotIndex, shots.length - 1)];

  // Switching area always returns to that area's establishing view.
  const pickArea = useCallback((id: AreaId) => {
    setAreaId(id);
    setShotIndex(0);
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLightbox(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  return (
    <>
      {/* Area tabs */}
      <Reveal>
        <div
          role="tablist"
          aria-label="Venue areas"
          className="flex gap-7 overflow-x-auto border-b border-primary/15 pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {VENUE_AREAS.map((a) => {
            const on = a.id === area.id;
            return (
              <button
                key={a.id}
                role="tab"
                aria-selected={on}
                onClick={() => pickArea(a.id)}
                className={`tap-44 relative flex-shrink-0 whitespace-nowrap border-b px-0 py-4 text-[10px] uppercase tracking-[0.22em] transition-colors ${
                  on
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={0.05} className="mt-8">
        <article className="overflow-hidden border-y border-primary/15 bg-transparent">
          {/* Establishing view */}
          <button
            type="button"
            onClick={() => setLightbox(shot)}
            aria-label={`Enlarge — ${shot.alt}`}
            className="cg-editorial-cover group relative block w-full cursor-zoom-in overflow-hidden bg-black"
          >
            <div className="relative aspect-[16/9] lg:aspect-[2/1]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${area.id}-${shot.src}`}
                  className="absolute inset-0"
                  initial={reduceMotion ? false : { opacity: 0, scale: 1.012 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  {shot.kind === 'video' ? (
                    <video
                      src={shot.src}
                      poster={shot.poster}
                      className="h-full w-full object-contain"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={shot.src}
                      alt={shot.alt}
                      className={`h-full w-full ${area.id === 'overview' ? 'object-contain p-3 sm:p-5' : 'object-cover'}`}
                      loading="lazy"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <span className="pointer-events-none absolute right-5 top-5 inline-flex items-center gap-2 border border-white/20 bg-black/55 px-3.5 py-2 text-[9px] uppercase tracking-[0.2em] text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Maximize2 className="h-3.5 w-3.5" />
              Enlarge
            </span>
          </button>

          {/* Alternate views for this area */}
          {shots.length > 1 && (
            <div className="flex gap-2 border-t border-primary/15 px-0 py-4">
              {shots.map((s, i) => (
                <button
                  key={s.src}
                  onClick={() => setShotIndex(i)}
                  aria-label={s.alt}
                  aria-current={i === shotIndex ? 'true' : undefined}
                  className={`h-12 w-20 flex-shrink-0 overflow-hidden border transition-colors ${
                    i === shotIndex ? 'border-primary' : 'border-border/60 hover:border-primary/50'
                  }`}
                >
                  {s.kind === 'video' ? (
                    <video src={s.src} poster={s.poster} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    <img src={s.src} alt="" className="h-full w-full object-cover" loading="lazy" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* What this area is */}
          <div className="grid gap-4 border-t border-primary/15 py-8 sm:grid-cols-[minmax(180px,0.7fr)_2fr] sm:gap-12 sm:py-10">
            <h3 className="font-display text-3xl leading-tight text-foreground">{area.title}</h3>
            <p className="max-w-2xl text-[14.5px] font-light leading-[1.8] text-muted-foreground">{area.blurb}</p>
          </div>

        </article>
      </Reveal>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.alt}
        >
          {lightbox.kind === 'video' ? (
            <video
              src={lightbox.src}
              poster={lightbox.poster}
              className="max-h-full max-w-full"
              autoPlay
              loop
              muted
              controls
              playsInline
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightbox.src}
              alt={lightbox.alt}
              className="max-h-full max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="tap-44 absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10"
          >
            <X className="h-4 w-4" /> Close
          </button>
        </div>
      )}
    </>
  );
}

export default VenueSurfaceExplorer;
