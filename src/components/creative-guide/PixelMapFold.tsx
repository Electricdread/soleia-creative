import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapIcon, Maximize2, Play, Sparkles, X } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import {
  PIXEL_MAP_BANDS,
  PIXEL_MAP_REGIONS,
  regionStyle,
  type PixelMapRegion,
} from '@/lib/venueSurfaces';

/**
 * How one file covers fifteen differently-shaped screens.
 *
 * This is the mechanism, not a product, and it is what turns three confusing
 * price lines — Mapped by Soleia, Mapped to Spec by Client, Zone Mapping — into
 * one obvious idea. Placed after the buyout and before the add-ons, the rest of
 * the page reads as consequences of it.
 *
 * The card holds two faces of the same thing, deliberately in the same 16:9
 * frame so one dissolves straight into the other:
 *
 *  · **Reference map** — the pixel-map artwork with every screen's rectangle
 *    drawn from the real playback coordinates. Static, instant and hoverable,
 *    which is what you want when someone asks "so where does my logo sit?" and
 *    you need to point at it.
 *  · **Step through it** — the video-map explainer in presenter mode. It opens
 *    on that same colour map and then spreads it across the venue one chapter
 *    at a time: the walls take their rectangles, the Sol Rays fan into the
 *    ceiling array, the pool side takes its own, and it folds back to the
 *    single file you hand over. It waits on each chapter until you advance it,
 *    and keeps moving while it waits.
 *
 * Because the explainer opens on the same artwork, the crossfade lands on the
 * same picture and only then starts moving — the map appears to come alive
 * rather than be replaced.
 *
 * It arms on scroll so the fold is already running by the time anyone looks at
 * it, and the toggle goes back to the reference map. Under
 * `prefers-reduced-motion` it stays on the map until asked.
 *
 * The explainer is code-split: Services is the page the pre-call packet opens,
 * and it should not carry a 55-second composition in its first payload.
 */

const VideoMapExplainer = lazy(() => import('@/components/venue/VideoMapExplainer'));

const PIXEL_MAP = '/creative-guide/soleia-pixelmap.png';
// The mark itself, so highlighting a screen shows what actually lands on it.
// Same asset the explainer uses, inverted to read white over the colour blocks.
const LOGO = '/soleia-logo-black.png';

const BAND_BORDER: Record<PixelMapRegion['band'], string> = {
  walls: 'border-primary',
  curves: 'border-sky-300',
  rays: 'border-amber-400',
  outdoor: 'border-fuchsia-300',
};

/** Slice highlight for a screen that carries motion only. */
const BAND_CLASS: Record<PixelMapRegion['band'], string> = {
  walls: 'border-primary bg-primary/25',
  curves: 'border-sky-300 bg-sky-300/25',
  rays: 'border-amber-400 bg-amber-400/25',
  outdoor: 'border-fuchsia-300 bg-fuchsia-300/25',
};

const BAND_DOT: Record<PixelMapRegion['band'], string> = {
  walls: 'bg-primary',
  curves: 'bg-sky-300',
  rays: 'bg-amber-400',
  outdoor: 'bg-fuchsia-300',
};

type Face = 'map' | 'fold';

export function PixelMapFold() {
  const [hot, setHot] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const [face, setFace] = useState<Face>('map');
  /** Light every screen that carries an included logo, all at once. */
  const [showAllLogos, setShowAllLogos] = useState(false);
  /** The explainer stays unmounted until it is first wanted. */
  const [foldMounted, setFoldMounted] = useState(false);
  const mediaRef = useRef<HTMLDivElement>(null);

  const reduceMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const showFold = (on: boolean) => {
    if (on) setFoldMounted(true);
    if (on) setShowAllLogos(false);
    setFace(on ? 'fold' : 'map');
  };

  const showEveryLogo = () => {
    setFace('map');
    setHot(null);
    setShowAllLogos(true);
  };

  const backToMap = () => {
    setFace('map');
    setShowAllLogos(false);
  };

  // Arm when the map frame itself is half on screen. Observing the whole card
  // does not work — it is map + toggles + a fifteen-row legend, so the frame can
  // fill the viewport while the card is nowhere near its threshold. Tying it to
  // the frame also means the clock starts as the map comes into view, so the
  // dissolve lands on the flat map and only then begins to move.
  useEffect(() => {
    if (reduceMotion) return;
    const el = mediaRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setFoldMounted(true);
          setFace('fold');
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduceMotion]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoom(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);

  const onMap = face === 'map';

  return (
    <>
      {/* The map itself — reference, or folding out into the room */}
      <Reveal>
        <article className="card-elevated overflow-hidden rounded-3xl border border-primary/15 bg-card/40 surface-elevated">
          <div ref={mediaRef} className="relative aspect-[16/9] bg-black">
            {/* Reference map */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${
                onMap ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
              aria-hidden={!onMap}
            >
              <img
                src={PIXEL_MAP}
                alt="The Soleia venue pixel map — every LED screen's rectangle inside one 3840 × 2160 frame"
                className="absolute inset-0 h-full w-full object-contain"
                loading="lazy"
              />
              <div className="absolute inset-0">
                {PIXEL_MAP_REGIONS.map((r) => {
                  const on = showAllLogos ? !!r.logo : hot === r.label;
                  return (
                    <button
                      key={r.label}
                      type="button"
                      tabIndex={onMap ? 0 : -1}
                      style={regionStyle(r.rect)}
                      onMouseEnter={() => setHot(r.label)}
                      onMouseLeave={() => setHot(null)}
                      onFocus={() => setHot(r.label)}
                      onBlur={() => setHot(null)}
                      onClick={() => setHot((v) => (v === r.label ? null : r.label))}
                      aria-label={`${r.label} — ${r.rect[2]} by ${r.rect[3]} pixels at ${r.rect[0]}, ${r.rect[1]}`}
                      className={`absolute flex items-center justify-center border transition-all duration-200 ${
                        !on
                          ? 'border-transparent bg-transparent opacity-0'
                          : r.logo
                            // Filled solid: the screen is showing the mark, so the
                            // map's colour underneath should not read through it.
                            ? `${BAND_BORDER[r.band]} bg-[#08070a] opacity-100`
                            : `${BAND_CLASS[r.band]} opacity-100`
                      }`}
                    >
                      {on && r.logo && (
                        <img
                          src={LOGO}
                          alt=""
                          className="max-h-[76%] w-[56%] object-contain"
                          style={{
                            filter:
                              'brightness(0) invert(1) drop-shadow(0 2px 10px rgba(0,0,0,0.85))',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setZoom(true)}
                className="tap-44 absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/80 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-primary backdrop-blur-sm transition-colors hover:bg-primary/15"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Full size
              </button>
            </div>

            {/* The same map, spreading out across the venue */}
            {foldMounted && (
              <div
                className={`absolute inset-0 transition-opacity duration-700 ${
                  onMap ? 'pointer-events-none opacity-0' : 'opacity-100'
                }`}
                aria-hidden={onMap}
              >
                <Suspense fallback={null}>
                  <VideoMapExplainer mode="steps" />
                </Suspense>
              </div>
            )}
          </div>

          {/* Which face, and why you would want each */}
          <div className="flex flex-wrap items-center gap-2 border-t border-primary/15 px-6 py-3.5 sm:px-8">
            <button
              type="button"
              onClick={backToMap}
              aria-pressed={onMap && !showAllLogos}
              className={`tap-44 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[10.5px] uppercase tracking-[0.18em] transition-colors ${
                onMap && !showAllLogos
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              Reference map
            </button>
            <button
              type="button"
              onClick={showEveryLogo}
              aria-pressed={showAllLogos}
              className={`tap-44 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[10.5px] uppercase tracking-[0.18em] transition-colors ${
                showAllLogos
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              All logo screens
            </button>
            <button
              type="button"
              onClick={() => showFold(true)}
              aria-pressed={!onMap}
              className={`tap-44 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[10.5px] uppercase tracking-[0.18em] transition-colors ${
                !onMap
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <Play className="h-3.5 w-3.5" />
              Step through it
            </button>
            <p className="ml-auto hidden text-[12px] text-muted-foreground/80 lg:block">
              {!onMap
                ? 'Ten steps. Advance them as you talk — each one keeps moving while it waits.'
                : showAllLogos
                  ? 'Every screen your ten included logos land on, at once.'
                  : 'Hover a screen below to light up its slice of the frame.'}
            </p>
          </div>

          {/* Legend + every rectangle, hover-linked to the map above */}
          <div className="border-t border-primary/15 px-6 py-6 sm:px-8">
            <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2">
              {PIXEL_MAP_BANDS.map((b) => (
                <span key={b.id} className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${BAND_DOT[b.id]}`} />
                  {b.label}
                </span>
              ))}
            </div>

            <div className="grid gap-x-6 gap-y-px sm:grid-cols-2 lg:grid-cols-3">
              {PIXEL_MAP_REGIONS.map((r) => {
                const on = hot === r.label;
                // Reaching for a screen name means you want to point at it, so
                // the card comes back to the reference map to be pointed at.
                const focusMap = () => {
                  if (showAllLogos) return;
                  setHot(r.label);
                  showFold(false);
                };
                return (
                  <button
                    key={r.label}
                    type="button"
                    onMouseEnter={focusMap}
                    onMouseLeave={() => setHot(null)}
                    onFocus={focusMap}
                    onBlur={() => setHot(null)}
                    className={`flex items-baseline justify-between gap-4 rounded-md px-2.5 py-2 text-left transition-colors ${
                      on ? 'bg-primary/10' : 'hover:bg-primary/5'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2.5 text-[13.5px] text-foreground">
                      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${BAND_DOT[r.band]}`} />
                      {r.label}
                      {r.logo && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-primary/70">
                          logo
                        </span>
                      )}
                    </span>
                    <span className="whitespace-nowrap font-mono text-[11.5px] tabular-nums text-primary">
                      {r.rect[2]} × {r.rect[3]}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-5 text-[12.5px] leading-relaxed text-muted-foreground/80">
              Hover any screen to see the slice of the frame it occupies, and where your mark
              lands on the ones tagged <span className="text-primary">logo</span> — the ten static
              logos every buyout includes. These are the exact coordinates the playback system
              reads, and the same ones in the After Effects template in the Content Delivery Guide.
            </p>
          </div>
        </article>
      </Reveal>

      {/* Full-size map */}
      {zoom && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Soleia venue pixel map, full size"
        >
          <img
            src={PIXEL_MAP}
            alt="The Soleia venue pixel map at full size"
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setZoom(false)}
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

export default PixelMapFold;
