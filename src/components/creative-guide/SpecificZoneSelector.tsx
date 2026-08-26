import { useState, type KeyboardEvent } from 'react';
import { Check, MapPin } from 'lucide-react';

type ZoneLabel = {
  label: string;
  x: number;
  y: number;
};

type SpecificZone = {
  id: number;
  shortName: string;
  title: string;
  image: string;
  imageAlt: string;
  summary: string;
  screens: string[];
  bestFor: string;
  labels: ZoneLabel[];
};

const SPECIFIC_ZONES: SpecificZone[] = [
  {
    id: 1,
    shortName: 'Main Stage',
    title: 'IMAG SR, IMAG SL, Center + DJ Booth',
    image: '/creative-guide/specific-zones/zone-1-main-stage.jpg',
    imageAlt: 'Zone 1 main stage screens with IMAG SR, IMAG SL, Center and DJ Booth labeled',
    summary: 'Four coordinated canvases frame the performance area and keep your brand at the visual center of the room.',
    screens: ['IMAG SR', 'IMAG SL', 'Center', 'DJ Booth'],
    bestFor: 'Hero brand moments, speaker or performer support, logo reveals and synchronized stage content.',
    labels: [
      { label: 'IMAG SR', x: 32, y: 40 },
      { label: 'CENTER', x: 51, y: 28 },
      { label: 'IMAG SL', x: 70, y: 40 },
      { label: 'DJ BOOTH', x: 51, y: 58 },
    ],
  },
  {
    id: 2,
    shortName: 'Curves',
    title: 'Curves SR + SL',
    image: '/creative-guide/specific-zones/zone-2-curves.jpg',
    imageAlt: 'Zone 2 interior view with the stage-right and stage-left curved LED screens labeled',
    summary: 'The curved side screens extend the visual story beyond the stage and wrap the room in a unified look.',
    screens: ['SR Curve', 'SL Curve'],
    bestFor: 'Ambient motion, panoramic brand textures, color washes and wide-format campaign extensions.',
    labels: [
      { label: 'SR CURVE', x: 16, y: 31 },
      { label: 'SL CURVE', x: 88, y: 31 },
    ],
  },
  {
    id: 3,
    shortName: 'Sunburst',
    title: 'Ceiling Sunburst',
    image: '/creative-guide/specific-zones/zone-3-sunburst.jpg',
    imageAlt: 'Zone 3 ceiling sunburst LED rays radiating from the center of the room',
    summary: 'The overhead LED rays transform the ceiling into a high-impact motion surface visible across the room.',
    screens: ['Ceiling Sunburst'],
    bestFor: 'Radiating motion, rhythmic accents, immersive color changes and overhead brand atmospheres.',
    labels: [{ label: 'CEILING SUNBURST', x: 50, y: 12 }],
  },
  {
    id: 4,
    shortName: 'Outdoor',
    title: 'Outdoor SR + SL',
    image: '/creative-guide/specific-zones/zone-4-outdoor.jpg',
    imageAlt: 'Zone 4 beach club view with Outdoor SR and Outdoor SL vertical LED screens labeled',
    summary: 'A pair of high-visibility vertical displays introduces your brand throughout the open-air beach club.',
    screens: ['Outdoor SR', 'Outdoor SL'],
    bestFor: 'Arrival branding, sponsor visibility, portrait creative and repeated outdoor messaging.',
    labels: [
      { label: 'OUTDOOR SR', x: 19, y: 43 },
      { label: 'OUTDOOR SL', x: 82, y: 31 },
    ],
  },
  {
    id: 5,
    shortName: 'Arch',
    title: 'Outdoor Arch',
    image: '/creative-guide/specific-zones/zone-5-arch.jpg',
    imageAlt: 'Zone 5 outdoor arch LED display labeled above the beach club opening',
    summary: 'The panoramic arch creates a singular branded gateway overlooking the Las Vegas Strip.',
    screens: ['Outdoor Arch'],
    bestFor: 'Welcome moments, wide logo animations, scenic loops and a signature exterior statement.',
    labels: [{ label: 'OUTDOOR ARCH', x: 50, y: 31 }],
  },
];

export function SpecificZoneSelector() {
  const [selectedZoneId, setSelectedZoneId] = useState(1);
  const selectedZone = SPECIFIC_ZONES.find((zone) => zone.id === selectedZoneId) ?? SPECIFIC_ZONES[0];

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
    <div className="overflow-hidden rounded-3xl border border-primary/20 bg-card/50 surface-elevated">
      <div className="border-b border-primary/15 px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-primary">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Price sheet service
            </div>
            <h3 className="font-display text-2xl text-foreground sm:text-3xl">LED Screens — Specific Zone Mapping</h3>
            <p className="mt-2 text-sm font-medium text-primary">Choose one zone. Make it unmistakably yours.</p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground sm:text-sm">
              Select a zone below to see the screens included. This service maps custom content to the exact LED screens in one targeted venue area, giving your most important guest moment a focused, coordinated visual identity.
            </p>
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
                className={`min-w-[132px] flex-1 rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isSelected
                    ? 'border-primary/60 bg-primary/10 text-foreground'
                    : 'border-primary/10 bg-background/30 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                <span className={`block text-[10px] uppercase tracking-[0.2em] ${isSelected ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  Zone {zone.id}
                </span>
                <span className="mt-1 block text-sm font-medium">{zone.shortName}</span>
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
        <div className="relative aspect-video overflow-hidden bg-black lg:aspect-auto lg:min-h-[430px]">
          <img
            key={selectedZone.image}
            src={selectedZone.image}
            alt={selectedZone.imageAlt}
            className="h-full w-full animate-fade-in-up object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" aria-hidden="true" />
          <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur-md sm:left-5 sm:top-5">
            Zone {selectedZone.id} · {selectedZone.shortName}
          </div>
          {selectedZone.labels.map((item) => (
            <div
              key={item.label}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${item.x}%`, top: `${item.y}%` }}
            >
              <span className="relative block whitespace-nowrap rounded-full border border-primary/70 bg-black/80 px-2 py-1 text-[8px] font-semibold tracking-[0.12em] text-primary shadow-lg backdrop-blur sm:px-2.5 sm:text-[9px]">
                {item.label}
              </span>
              <span className="mx-auto block h-3 w-px bg-primary/80" aria-hidden="true" />
              <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-primary ring-4 ring-primary/20" aria-hidden="true" />
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-between border-t border-primary/15 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div>
            <span className="text-[10px] uppercase tracking-[0.22em] text-primary">Zone {selectedZone.id}</span>
            <h4 className="mt-2 font-display text-2xl leading-tight text-foreground">{selectedZone.title}</h4>
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">{selectedZone.summary}</p>

            <div className="mt-7">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Screens included</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedZone.screens.map((screen) => (
                  <span key={screen} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] text-foreground">
                    {screen}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-primary/15 pt-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-primary/80">Best for</div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{selectedZone.bestFor}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
