import React, { useCallback, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { Crossfade, FadeSwap, Overlay } from '@/components/motion/Crossfade';
import { HIGHLIGHT_SPRING, useWarmImages } from '@/components/motion/motion';
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
 *
 * Moving between areas and shots crossfades; the area highlight glides; the
 * lightbox fades and scales rather than popping. That is the guide's motion
 * standard (2026-08-26), and it is why nothing here swaps an `src` cold.
 */

type Shot = { src: string; alt: string; kind: 'image' } | { src: string; poster?: string; alt: string; kind: 'video' };

export function VenueSurfaceExplorer() {
  const [areaId, setAreaId] = useState<AreaId>('main');
  const [lightbox, setLightbox] = useState<Shot | null>(null);
  const reduceMotion = useReducedMotion();

  const area = useMemo(() => VENUE_AREAS.find((a) => a.id === areaId) ?? VENUE_AREAS[0], [areaId]);

  const shots = useMemo<Shot[]>(() => {
    const list: Shot[] = [{ src: area.image, alt: area.imageAlt, kind: 'image' }];
    for (const g of area.gallery ?? []) list.push({ src: g.src, alt: g.alt, kind: 'image' });
    if (area.video) list.push({ src: area.video, poster: area.videoPoster, alt: `${area.title} — motion`, kind: 'video' });
    return list;
  }, [area]);

  // Every area's establishing shot, so the first tap on any tab is instant;
  // the current area's alternates, so the strip beneath it is too.
  const warm = useMemo(
    () => [
      ...VENUE_AREAS.map((a) => a.image),
      ...shots.filter((s) => s.kind === 'image').map((s) => s.src),
    ],
    [shots],
  );
  useWarmImages(warm);

  const [shotIdex, setShotIdex] = useState(0);
  const shot = shots[Math.min(shotIdex, shots.length - 1)];

  // Switching area always returns to that area's establishing view.
  const pickArea = useCallback((id: AreaId) => {
    setAreaId(id);
    setShotIdex(0);
  }, []);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  return (
    <>
      {/* Area tabs */}
      <Reveal>
        <div
          role="tablist"
          aria-label="Venue areas"
          className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {VENUE_AREAS.map((a) => {
            const on = a.id === area.id;
            return (
              <button
                key={a.id}
                role="tab"
                aria-selected={on}
                onClick={() => pickArea(a.id)}
                className={`tab-glow tap-44 relative flex-shrink-0 whitespace-nowrap rounded-full border px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] ${
                  on
                    ? 'border-primary/60 text-primary'
                    : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {on && (
                  <motion.span
                    layoutId={reduceMotion ? undefined : 'venue-area-highlight'}
                    transition={HIGHLIGHT_SPRING}
                    className="glow-ring pointer-events-none absolute inset-0 rounded-full bg-primary/15"
                    aria-hidden="true"
                  />
                )}
                <span className="relative">{a.label}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={0.05} className="mt-6">
        <article className="card-elevated overflow-hidden rounded-3xl border border-primary/15 bg-card/40 surface-elevated">
          {/* Establishing view */}
          <button
            type="button"
            onClick={() => setLightbox(shot)}
            aria-label={`Enlarge — ${shot.alt}`}
            className="group relative block w-full cursor-zoom-in overflow-hidden bg-black"
          >
            <Crossfade id={shot.src} className="aspect-[16/9]">
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
                <img src={shot.src} alt={shot.alt} decoding="async" className="h-full w-full object-cover" />
              )}
            </Crossfade>
            <span className="btn-glow pointer-events-none absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-background/80 px-3.5 py-2 text-[10px] uppercase tracking-[0.18em] text-foreground opacity-0 backdrop-blur-sm group-hover:opacity-100 group-focus-visible:opacity-100">
              <Maximize2 className="h-3.5 w-3.5" />
              Enlarge
            </span>
          </button>

          {/* Alternate views for this area */}
          {shots.length > 1 && (
            <div className="flex gap-2 border-t border-primary/15 px-5 py-3 sm:px-7">
              {shots.map((s, i) => (
                <button
                  key={s.src}
                  onClick={() => setShotIdex(i)}
                  aria-label={s.alt}
                  aria-current={i === shotIdex ? 'true' : undefined}
                  className={`tab-glow h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg border ${
                    i === shotIdex ? 'border-primary' : 'border-border/60 hover:border-primary/50'
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
          <div className="border-t border-primary/15 px-6 py-7 sm:px-8">
            <FadeSwap id={area.id}>
              <h3 className="font-display text-2xl leading-tight text-foreground">{area.title}</h3>
              <p className="mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">{area.blurb}</p>
            </FadeSwap>
          </div>
        </article>
      </Reveal>

      {/* Lightbox */}
      <Overlay open={!!lightbox} onClose={closeLightbox} label={lightbox?.alt}>
        {lightbox?.kind === 'video' ? (
          <video
            src={lightbox.src}
            poster={lightbox.poster}
            className="max-h-[92vh] max-w-full"
            autoPlay
            loop
            muted
            controls
            playsInline
          />
        ) : lightbox ? (
          <img src={lightbox.src} alt={lightbox.alt} className="max-h-[92vh] max-w-full object-contain" />
        ) : null}
        <button
          onClick={closeLightbox}
          aria-label="Close"
          className="btn-glow tap-44 fixed right-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white hover:bg-white/10"
        >
          <X className="h-4 w-4" /> Close
        </button>
      </Overlay>
    </>
  );
}

export default VenueSurfaceExplorer;
