import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { VENUE_AREAS, surfacesIn, type AreaId } from '@/lib/venueSurfaces';

/**
 * Where a client's brand actually lands, area by area.
 *
 * The renders used here have the screens labelled inside the image — the main
 * room with the rays and both IMAG walls carrying a logo, the beachclub towers
 * marked at 588 × 840, the arch at night over the pool. They already existed in
 * `public/creative-guide/`, wired only to a specs view that is imported nowhere,
 * so until now no client could reach the one set of pictures that answers
 * "where would my logo be?".
 *
 * The image leads and is deliberately large: this section gets talked over on a
 * screenshared creative call, so the render has to read at meeting size before
 * any of the numbers beside it matter.
 */

type Shot = { src: string; alt: string; kind: 'image' } | { src: string; poster?: string; alt: string; kind: 'video' };

export function VenueSurfaceExplorer() {
  const [areaId, setAreaId] = useState<AreaId>('main');
  const [lightbox, setLightbox] = useState<Shot | null>(null);

  const area = useMemo(() => VENUE_AREAS.find((a) => a.id === areaId) ?? VENUE_AREAS[0], [areaId]);
  const surfaces = useMemo(() => surfacesIn(area.id), [area.id]);

  const shots = useMemo<Shot[]>(() => {
    const list: Shot[] = [{ src: area.image, alt: area.imageAlt, kind: 'image' }];
    if (area.image2) list.push({ src: area.image2, alt: area.image2Alt ?? area.imageAlt, kind: 'image' });
    if (area.video) list.push({ src: area.video, poster: area.videoPoster, alt: `${area.title} — motion`, kind: 'video' });
    return list;
  }, [area]);

  const [shotIdex, setShotIdex] = useState(0);
  const shot = shots[Math.min(shotIdex, shots.length - 1)];

  // Switching area always returns to that area's establishing view.
  const pickArea = useCallback((id: AreaId) => {
    setAreaId(id);
    setShotIdex(0);
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
                className={`tap-44 flex-shrink-0 whitespace-nowrap rounded-full border px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  on
                    ? 'border-primary/60 bg-primary/15 text-primary'
                    : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {a.label}
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
            <div className="aspect-[16/9]">
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
                <img src={shot.src} alt={shot.alt} className="h-full w-full object-cover" loading="lazy" />
              )}
            </div>
            <span className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-background/80 px-3.5 py-2 text-[10px] uppercase tracking-[0.18em] text-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
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
                  className={`h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg border transition-colors ${
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
            <h3 className="font-display text-2xl leading-tight text-foreground">{area.title}</h3>
            <p className="mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">{area.blurb}</p>
            {surfaces.some((s) => s.logoIncluded) && (
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground/80">
                Surfaces marked <span className="text-primary">Logo included</span> carry one of the
                ten static logos every buyout comes with — before any creative work is added.
              </p>
            )}
          </div>

          {/* Every surface in it, at its real resolution */}
          <div className="border-t border-primary/15">
            {surfaces.map((s, i) => (
              <div
                key={s.name}
                className={`grid grid-cols-1 items-baseline gap-1 px-6 py-4 sm:grid-cols-[190px_1fr_auto] sm:items-center sm:gap-6 sm:px-8 ${
                  i > 0 ? 'border-t border-primary/10' : ''
                }`}
              >
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="text-[14.5px] font-medium text-foreground">{s.name}</span>
                  {s.countNote && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                      {s.countNote}
                    </span>
                  )}
                  {s.logoIncluded && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-primary">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      Logo included
                    </span>
                  )}
                </div>
                <p className="text-[13px] leading-snug text-muted-foreground">{s.role}</p>
                <span className="whitespace-nowrap text-left font-mono text-[12.5px] tabular-nums text-primary sm:text-right">
                  {s.res}
                </span>
              </div>
            ))}
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
