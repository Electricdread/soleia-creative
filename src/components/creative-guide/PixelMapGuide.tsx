import React, { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Map as MapIcon, X } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { FadeSwap, Overlay } from '@/components/motion/Crossfade';
import { HIGHLIGHT_SPRING, MOTION_EASE } from '@/components/motion/motion';
import { PIXEL_MAP_REGIONS, regionStyle, type PixelMapRegion } from '@/lib/venueSurfaces';

/**
 * One map, every surface — walked one step at a time.
 *
 * The playback pixel map is a loud piece of artwork: fifteen coloured blocks,
 * fifteen labels, and a legend. Shown whole, it reads as a spec sheet and the
 * client stops looking. So the frame here is drawn in code, in the guide's own
 * palette: one dark 3840 × 2160 canvas, every screen a quiet outline, and the
 * step being talked about lit in gold. The steps use the same five zones the
 * zone-mapping card uses — Main Stage, Curves, Sunburst, Outdoor, Arch — so a
 * client meets one vocabulary for the room, not two.
 *
 * The real playback map stays one tap away for whoever needs the exact
 * artwork, and the full resolution table folds open beneath for the same
 * reason. Neither is in the way of the first read.
 */

const PLAYBACK_MAP = '/creative-guide/soleia-pixelmap.png';
const LOGO = '/soleia-logo-color.png';
const MAP_RUNNING_URL = '/creative-guide/services/pixelmap-previz.mp4';
const MAP_RUNNING_POSTER = '/creative-guide/services/pixelmap-previz-poster.jpg';

type Step = {
  id: string;
  label: string;
  title: string;
  body: string;
  /** Region labels lit for this step. Empty lights nothing and outlines all. */
  regions: string[];
  /** Show the mark on the lit screens. */
  logo?: boolean;
  /** The last step: the map running on the venue model. */
  video?: boolean;
};

const byLabel = (labels: string[]) => PIXEL_MAP_REGIONS.filter((r) => labels.includes(r.label)).map((r) => r.label);

const STEPS: Step[] = [
  {
    id: 'frame',
    label: 'One frame',
    title: 'Everything lives on one file.',
    body: 'Every LED surface in the venue is a rectangle inside a single 3840 × 2160 frame. Build to this map once, and every screen takes its own slice.',
    regions: [],
  },
  {
    id: 'stage',
    label: 'Main stage',
    title: 'The walls take their rectangles.',
    body: 'IMAG SR and IMAG SL at 1216 × 592 either side of the 640 × 272 Center panel, with the DJ Booth face beneath — the four screens that frame the stage.',
    regions: byLabel(['IMAG SR', 'Center', 'IMAG SL', 'DJ Booth']),
  },
  {
    id: 'curves',
    label: 'Curves',
    title: 'The curves wrap the room.',
    body: 'Two 2304 × 272 strips, SR and SL, carry motion around the floor — long, low and continuous.',
    regions: byLabel(['SR Curves', 'SL Curves']),
  },
  {
    id: 'sunburst',
    label: 'Sunburst',
    title: 'Six rays fan across the ceiling.',
    body: 'Sunray 1 to 6, each 128 pixels tall and up to 1920 wide, spread from the centre of the room overhead.',
    regions: byLabel(['Sunray 1', 'Sunray 2', 'Sunray 3', 'Sunray 4', 'Sunray 5', 'Sunray 6']),
  },
  {
    id: 'outdoor',
    label: 'Outdoor',
    title: 'The beachclub verticals.',
    body: 'Outdoor SR and SL — 588 × 840, portrait — face the pool and the day beds.',
    regions: byLabel(['Outdoor SR', 'Outdoor SL']),
  },
  {
    id: 'arch',
    label: 'Arch',
    title: 'The arch over the Strip.',
    body: 'Outdoor Arch at 1512 × 504 — the widest single surface outside, and the one the Strip sees.',
    regions: byLabel(['Outdoor Arch']),
  },
  {
    id: 'logo',
    label: 'Your logo',
    title: 'Where your ten included logos land.',
    body: 'The two IMAG walls, the Center panel, all six rays and the three beachclub exteriors carry a static logo with every buyout — before any creative work is added.',
    regions: PIXEL_MAP_REGIONS.filter((r) => r.logo).map((r) => r.label),
    logo: true,
  },
  {
    id: 'room',
    label: 'In the room',
    title: 'The map, running.',
    body: 'The same frame on the venue model — every screen carrying its own labelled slice, all from one file.',
    regions: [],
    video: true,
  },
];

const fmt = (r: PixelMapRegion) => `${r.rect[2]} × ${r.rect[3]}`;

export function PixelMapGuide() {
  const [index, setIndex] = useState(0);
  const [hot, setHot] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const reduceMotion = useReducedMotion();

  const step = STEPS[index];
  const lit = useMemo(() => new Set(step.regions), [step]);
  const hotRegion = useMemo(() => PIXEL_MAP_REGIONS.find((r) => r.label === hot) ?? null, [hot]);

  const go = useCallback((i: number) => setIndex(Math.max(0, Math.min(STEPS.length - 1, i))), []);
  const prev = useCallback(() => go(index - 1), [go, index]);
  const next = useCallback(() => go(index + 1), [go, index]);

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let n: number | undefined;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % STEPS.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + STEPS.length) % STEPS.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = STEPS.length - 1;
    if (n === undefined) return;
    e.preventDefault();
    go(n);
    requestAnimationFrame(() => document.getElementById(`pixel-step-${STEPS[n!].id}`)?.focus());
  };

  const closeMap = useCallback(() => setShowMap(false), []);
  useEffect(() => {
    if (!showMap) setHot(null);
  }, [showMap]);

  const ease = { duration: 0.5, ease: MOTION_EASE };

  return (
    <>
      <Reveal>
        <article className="card-elevated overflow-hidden rounded-3xl border border-primary/15 bg-card/40 surface-elevated">
          <div className="grid lg:grid-cols-[236px_1fr]">
            {/* Steps */}
            <div
              role="tablist"
              aria-label="How mapping works"
              aria-orientation="vertical"
              className="flex gap-1.5 overflow-x-auto border-b border-primary/15 px-4 py-3 scrollbar-hide lg:flex-col lg:gap-1 lg:overflow-visible lg:border-b-0 lg:border-r lg:px-4 lg:py-5"
            >
              {STEPS.map((s, i) => {
                const on = i === index;
                return (
                  <button
                    key={s.id}
                    id={`pixel-step-${s.id}`}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls="pixel-step-panel"
                    tabIndex={on ? 0 : -1}
                    onClick={() => go(i)}
                    onKeyDown={(e) => onTabKey(e, i)}
                    className={`tab-glow relative flex-shrink-0 rounded-full px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.16em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:rounded-xl lg:px-3.5 ${
                      on ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {on && (
                      <motion.span
                        layoutId={reduceMotion ? undefined : 'pixel-step-highlight'}
                        transition={HIGHLIGHT_SPRING}
                        className="glow-ring pointer-events-none absolute inset-0 rounded-full bg-primary/12 lg:rounded-xl"
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative inline-flex items-center gap-2.5">
                      <span className="font-mono text-[10px] opacity-60">{String(i + 1).padStart(2, '0')}</span>
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* The frame */}
            <div id="pixel-step-panel" role="tabpanel" aria-labelledby={`pixel-step-${step.id}`}>
              <div className="relative aspect-video overflow-hidden bg-[#0b0a08]">
                {/* faint grid so the frame reads as a canvas, not a void */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.07]"
                  style={{
                    backgroundImage:
                      'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
                    backgroundSize: '8.333% 12.5%',
                  }}
                  aria-hidden="true"
                />

                {/* Every screen, as a rectangle in the 3840 × 2160 frame */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ opacity: step.video ? 0 : 1 }}
                  transition={ease}
                  style={{ pointerEvents: step.video ? 'none' : 'auto' }}
                  aria-hidden={step.video}
                >
                  {PIXEL_MAP_REGIONS.map((r) => {
                    const isLit = lit.has(r.label);
                    const isHot = hot === r.label;
                    const showLogo = step.logo && isLit;
                    return (
                      <motion.button
                        key={r.label}
                        type="button"
                        style={regionStyle(r.rect)}
                        onMouseEnter={() => setHot(r.label)}
                        onMouseLeave={() => setHot(null)}
                        onFocus={() => setHot(r.label)}
                        onBlur={() => setHot(null)}
                        aria-label={`${r.label} — ${fmt(r)}`}
                        className="absolute flex items-center justify-center overflow-hidden rounded-[3px] border"
                        initial={false}
                        animate={{
                          opacity: isLit || isHot ? 1 : lit.size ? 0.34 : 0.75,
                          backgroundColor: isLit
                            ? 'hsl(var(--primary) / 0.32)'
                            : isHot
                              ? 'hsl(var(--primary) / 0.16)'
                              : 'hsl(var(--primary) / 0.06)',
                          borderColor: isLit || isHot ? 'hsl(var(--primary) / 0.85)' : 'hsl(var(--primary) / 0.32)',
                          boxShadow: isLit
                            ? '0 0 0 1px hsl(var(--primary) / 0.35), 0 0 24px -4px hsl(var(--primary) / 0.55)'
                            : '0 0 0 0 transparent',
                        }}
                        transition={reduceMotion ? { duration: 0 } : ease}
                      >
                        {showLogo ? (
                          <motion.img
                            src={LOGO}
                            alt=""
                            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ ...ease, delay: 0.1 }}
                            className="max-h-[78%] w-[62%] object-contain"
                            style={{ filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.7))' }}
                          />
                        ) : (
                          <span
                            className={`pointer-events-none truncate px-1 font-mono text-[7px] uppercase tracking-[0.12em] sm:text-[8.5px] lg:text-[9.5px] ${
                              isLit || isHot ? 'text-primary' : 'text-primary/55'
                            }`}
                          >
                            {r.label}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>

                {/* The hovered screen's size. Nothing else sits on the frame: the
                    rectangles fill it edge to edge, and a chip over IMAG SR was
                    hiding the very thing it labelled on a phone. */}
                <motion.span
                  animate={{ opacity: hotRegion && !step.video ? 1 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-white/15 bg-black/75 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-white backdrop-blur-sm"
                >
                  {hotRegion ? `${hotRegion.label} · ${fmt(hotRegion)}` : ''}
                </motion.span>

                {/* Last step: the map running on the venue model */}
                <motion.div
                  className="absolute inset-0 bg-black"
                  initial={false}
                  animate={{ opacity: step.video ? 1 : 0 }}
                  transition={ease}
                  style={{ pointerEvents: step.video ? 'auto' : 'none' }}
                  aria-hidden={!step.video}
                >
                  {step.video && (
                    <video
                      src={MAP_RUNNING_URL}
                      poster={MAP_RUNNING_POSTER}
                      className="h-full w-full object-cover"
                      controls
                      playsInline
                      preload="none"
                      aria-label="The pixel map running across every surface in the Soleia venue model"
                    />
                  )}
                </motion.div>
              </div>

              {/* What this step says, and the way on */}
              <div className="flex flex-col gap-5 border-t border-primary/15 px-6 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-8">
                <FadeSwap id={step.id} className="min-w-0 max-w-2xl">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                    {String(index + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')} — {step.label} · 3840 × 2160
                  </span>
                  <h4 className="mt-2 font-display text-2xl leading-tight text-foreground">{step.title}</h4>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{step.body}</p>
                </FadeSwap>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={prev}
                    disabled={index === 0}
                    aria-label="Previous step"
                    className="btn-glow tap-44 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:shadow-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    disabled={index === STEPS.length - 1}
                    className="btn-glow tap-44 inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-primary hover:bg-primary/20 disabled:opacity-30 disabled:shadow-none"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* The exact artwork and the full table, for whoever needs them */}
          <div className="flex flex-wrap items-center gap-2 border-t border-primary/15 px-6 py-3.5 sm:px-8">
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="btn-glow tap-44 inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2.5 text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              <MapIcon className="h-3.5 w-3.5" />
              Open the playback map
            </button>
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              aria-expanded={showTable}
              aria-controls="pixel-map-table"
              className="btn-glow tap-44 inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2.5 text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              {showTable ? 'Hide' : 'Every screen’s resolution'}
            </button>
            <p className="ml-auto hidden text-[12px] text-muted-foreground/80 lg:block">
              Hover any screen in the frame to see its size.
            </p>
          </div>

          <div
            id="pixel-map-table"
            className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ gridTemplateRows: showTable ? '1fr' : '0fr' }}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="border-t border-primary/15 px-6 py-6 sm:px-8">
                <div className="grid gap-x-6 gap-y-px sm:grid-cols-2 lg:grid-cols-3">
                  {PIXEL_MAP_REGIONS.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onMouseEnter={() => setHot(r.label)}
                      onMouseLeave={() => setHot(null)}
                      onFocus={() => setHot(r.label)}
                      onBlur={() => setHot(null)}
                      className={`flex items-baseline justify-between gap-4 rounded-md px-2.5 py-2 text-left transition-colors duration-300 ${
                        hot === r.label ? 'bg-primary/10' : 'hover:bg-primary/5'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2.5 text-[13.5px] text-foreground">
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/70" />
                        {r.label}
                        {r.logo && (
                          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-primary/70">logo</span>
                        )}
                      </span>
                      <span className="whitespace-nowrap font-mono text-[11.5px] tabular-nums text-primary">{fmt(r)}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-5 text-[12.5px] leading-relaxed text-muted-foreground/80">
                  These are the exact coordinates the playback system reads, and the same ones in the After
                  Effects template in the Content Delivery Guide. Screens tagged{' '}
                  <span className="text-primary">logo</span> carry one of the ten static logos every buyout
                  includes.
                </p>
              </div>
            </div>
          </div>
        </article>
      </Reveal>

      <Overlay open={showMap} onClose={closeMap} label="Soleia venue pixel map, full size">
        <img src={PLAYBACK_MAP} alt="The Soleia venue pixel map at full size" className="max-h-[92vh] max-w-full object-contain" />
        <button
          onClick={closeMap}
          aria-label="Close"
          className="btn-glow tap-44 fixed right-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white hover:bg-white/10"
        >
          <X className="h-4 w-4" /> Close
        </button>
      </Overlay>
    </>
  );
}

export default PixelMapGuide;
