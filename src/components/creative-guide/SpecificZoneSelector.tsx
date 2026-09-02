import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, MapPin, Play } from 'lucide-react';
import { Crossfade, FadeSwap } from '@/components/motion/Crossfade';
import { HIGHLIGHT_SPRING, useWarmImages } from '@/components/motion/motion';

/**
 * LED Screens — Specific Zone Mapping puts a client's content on one focused
 * part of the room.
 *
 * Three focused zones, each with one moving view of the real venue model — cut from the
 * owner's zone previz (Logo_ZonePreviz, 2026-08-27), with the Soleia mark on
 * the screens that zone covers. The mapping is the owner's:
 *
 *   Zone 1 Main Stage  IMAG SR, IMAG SL, Center, DJ Booth
 *   Zone 2 Outdoor     Outdoor SR, Outdoor SL
 *   Zone 3 Arch        Outdoor Arch
 *
 * Each clip is a few seconds, 1280 wide, muted, looping — small enough to
 * autoplay the moment a tab is chosen, behind a still cut from the same
 * frame so nothing ever shows black. The full one-minute walkthrough is
 * behind a button. Motion follows the guide's standard: the highlight glides
 * between tabs, the view crossfades, the copy beside it fades up.
 */

type SpecificZone = {
  id: number;
  shortName: string;
  title: string;
  /** A few seconds of the previz, the camera on this zone. */
  video: string;
  /** A frame from the same clip; the poster and the reduced-motion view. */
  poster: string;
  /** Read by assistive tech, and by the tests. */
  label: string;
  summary: string;
  screens: string[];
  bestFor: string;
};

const DIR = '/creative-guide/specific-zones';

const SPECIFIC_ZONES: SpecificZone[] = [
  {
    id: 1,
    shortName: 'Main Stage',
    title: 'IMAG SR, IMAG SL, Center + DJ Booth',
    video: `${DIR}/zone-1-main-stage.mp4`,
    poster: `${DIR}/zone-1-main-stage.jpg`,
    label: 'Zone 1 — the main stage: IMAG SR, IMAG SL, the Center panel and the DJ Booth, with the mark on each',
    summary: 'Four coordinated canvases frame the performance area and keep your brand at the visual center of the room.',
    screens: ['IMAG SR', 'IMAG SL', 'Center', 'DJ Booth'],
    bestFor: 'Hero brand moments, speaker or performer support, logo reveals and synchronized stage content.',
  },
  {
    id: 2,
    shortName: 'Outdoor',
    title: 'Outdoor SR + SL',
    video: `${DIR}/zone-4-outdoor.mp4`,
    poster: `${DIR}/zone-4-outdoor.jpg`,
    label: 'Zone 2 — Outdoor SR and Outdoor SL, the beachclub verticals',
    summary: 'A pair of high-visibility vertical displays introduces your brand throughout the open-air beach club.',
    screens: ['Outdoor SR', 'Outdoor SL'],
    bestFor: 'Arrival branding, sponsor visibility, portrait creative and repeated outdoor messaging.',
  },
  {
    id: 3,
    shortName: 'Arch',
    title: 'Outdoor Arch',
    video: `${DIR}/zone-5-arch.mp4`,
    poster: `${DIR}/zone-5-arch.jpg`,
    label: 'Zone 3 — the outdoor arch over the Strip',
    summary: 'The panoramic arch creates a singular branded gateway overlooking the Las Vegas Strip.',
    screens: ['Outdoor Arch'],
    bestFor: 'Welcome moments, wide logo animations, scenic loops and a signature exterior statement.',
  },
];

const WALKTHROUGH = `${DIR}/zones-walkthrough.mp4`;
const POSTERS = SPECIFIC_ZONES.map((z) => z.poster);

export interface SpecificZoneSelectorProps {
  /** Optional label above the title. */
  eyebrow?: string;
  /**
   * The paragraph under the title. The Services page passes the rate card's
   * own description so the card says the same thing the proposal will.
   */
  description?: string;
  /** Opens a video full screen; the card offers the one-minute walkthrough. */
  onFullscreen?: (src: string) => void;
  /**
   * Select a zone from outside — the buyout section's zone pills. The nonce
   * changes on every request, so asking for the zone already shown still
   * counts as a request.
   */
  selectZone?: { id: number; nonce: number } | null;
  className?: string;
}

export function SpecificZoneSelector({
  eyebrow,
  description = 'Select a zone below to see the screens included. This service maps custom content to the exact LED screens in one targeted venue area, giving your most important guest moment a focused, coordinated visual identity.',
  onFullscreen,
  selectZone,
  className = '',
}: SpecificZoneSelectorProps) {
  const [selectedZoneId, setSelectedZoneId] = useState(1);

  useEffect(() => {
    if (selectZone && SPECIFIC_ZONES.some((z) => z.id === selectZone.id)) setSelectedZoneId(selectZone.id);
  }, [selectZone]);
  const selectedZone = SPECIFIC_ZONES.find((zone) => zone.id === selectedZoneId) ?? SPECIFIC_ZONES[0];
  const reduceMotion = useReducedMotion();

  const posters = useMemo(() => POSTERS, []);
  useWarmImages(posters);

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, zoneIndex: number) => {
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (zoneIndex + 1) % SPECIFIC_ZONES.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (zoneIndex - 1 + SPECIFIC_ZONES.length) % SPECIFIC_ZONES.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = SPECIFIC_ZONES.length - 1;

    if (nextIndex === undefined) return;

    event.preventDefault();
    const nextZone = SPECIFIC_ZONES[nextIndex];
    setSelectedZoneId(nextZone.id);
    requestAnimationFrame(() => document.getElementById(`specific-zone-tab-${nextZone.id}`)?.focus());
  };

  return (
    <div className={`overflow-hidden rounded-3xl border border-primary/20 bg-card/50 surface-elevated ${className}`}>
      <div className="border-b border-primary/15 px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            {eyebrow && (
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {eyebrow}
              </div>
            )}
            <h3 className="font-display text-2xl text-foreground sm:text-3xl">LED Screens — Specific Zone Mapping</h3>
            <p className="mt-2 text-sm font-medium text-primary">Choose one zone. Make it unmistakably yours.</p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground sm:text-sm">{description}</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Check className="h-3 w-3" aria-hidden="true" />
            </span>
            One service selection covers one zone
          </div>
        </div>
      </div>

      <div className="border-b border-primary/15 px-3 py-3 sm:px-5" role="tablist" aria-label="Specific venue zones">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SPECIFIC_ZONES.map((zone, zoneIndex) => {
            const isSelected = zone.id === selectedZone.id;
            return (
              <button
                key={zone.id}
                id={`specific-zone-tab-${zone.id}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls="specific-zone-panel"
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setSelectedZoneId(zone.id)}
                onKeyDown={(event) => handleTabKeyDown(event, zoneIndex)}
                className={`tab-glow relative min-w-[132px] flex-1 rounded-2xl border px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isSelected
                    ? 'border-primary/60 text-foreground'
                    : 'border-primary/10 bg-background/30 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {/* The highlight is one element that glides to whichever tab is
                    selected, rather than five that switch on and off. */}
                {isSelected && (
                  <motion.span
                    layoutId={reduceMotion ? undefined : 'specific-zone-tab-highlight'}
                    transition={HIGHLIGHT_SPRING}
                    className="glow-ring pointer-events-none absolute inset-0 rounded-2xl bg-primary/10"
                    aria-hidden="true"
                  />
                )}
                <span className={`relative block font-mono text-[10px] uppercase tracking-[0.2em] ${isSelected ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  Zone {zone.id}
                </span>
                <span className="relative mt-1 block text-sm font-medium">{zone.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="specific-zone-panel"
        role="tabpanel"
        aria-labelledby={`specific-zone-tab-${selectedZone.id}`}
        className="grid lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]"
      >
        <div className="relative">
          <Crossfade id={selectedZone.id} className="aspect-video overflow-hidden bg-black lg:aspect-auto lg:h-full lg:min-h-[430px]">
            {reduceMotion ? (
              <img src={selectedZone.poster} alt={selectedZone.label} className="h-full w-full object-cover" />
            ) : (
              <video
                src={selectedZone.video}
                poster={selectedZone.poster}
                aria-label={selectedZone.label}
                className="h-full w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" aria-hidden="true" />
            <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur-md sm:left-5 sm:top-5">
              Zone {selectedZone.id} · {selectedZone.shortName}
            </div>
          </Crossfade>
          {onFullscreen && (
            <button
              type="button"
              onClick={() => onFullscreen(WALKTHROUGH)}
              className="btn-glow tap-44 absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3.5 py-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white backdrop-blur-sm hover:bg-black/80"
            >
              <Play className="h-3.5 w-3.5" />
              Watch the full walkthrough
            </button>
          )}
        </div>

        <div className="flex flex-col justify-between border-t border-primary/15 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <FadeSwap id={selectedZone.id}>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Zone {selectedZone.id}</span>
            <h4 className="mt-2 font-display text-2xl leading-tight text-foreground">{selectedZone.title}</h4>
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">{selectedZone.summary}</p>

            <div className="mt-7">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Screens included</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedZone.screens.map((screen) => (
                  <span key={screen} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] text-foreground">
                    {screen}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-primary/15 pt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/80">Best for</div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{selectedZone.bestFor}</p>
            </div>
          </FadeSwap>
        </div>
      </div>
    </div>
  );
}

export default SpecificZoneSelector;
