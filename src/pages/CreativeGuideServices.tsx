import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize2, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from '@/components/motion/Reveal';
import solIcon from '@/assets/sol-icon.png';
import transparentLogoVideo from '@/assets/transparent_logo_explainer_1.mp4.asset.json';

// Same-origin document links: works in preview and on the published domain
// without depending on a deploy having already shipped the file.
const DOCUMENT_VERSION = '2026-08-14c';
const SERVICES_PDF_URL = `/Soleia-Creative-Services-No-Pricing.pdf?v=${DOCUMENT_VERSION}`;
const PRESENTATION_GUIDE_PDF_URL = `/Soleia-Presentation-Guide.pdf?v=${DOCUMENT_VERSION}`;

// Imagery lives in public/ so the printable guide and PDFs can reference the
// same files. Crops in services/ are pre-cut to their display aspect.
const HERO_IMG = '/creative-guide/services/hero-main-room.jpg';
const IMG = {
  packageMain: '/creative-guide/services/package-full-look.jpg',
  packageEvent: '/creative-guide/services/static-logo-event.jpg',
  packageTakeover: '/creative-guide/services/presentation-takeover.jpg',
  previz: '/creative-guide/services/previz-render.jpg',
  mapping: '/creative-guide/services/mapping-client-content.jpg',
  artist: '/creative-guide/services/artist-show.jpg',
  zones: '/creative-guide/services/zones-outdoor.jpg',
  staticLogo: '/creative-guide/services/static-logo-event.jpg',
  tvNetwork: '/creative-guide/services/tv-network-still.jpg',
  presentation: '/creative-guide/services/presentation-takeover.jpg',
  marquee: '/creative-guide/services/marquee-exterior.jpg',
  elevatorInterior: '/creative-guide/services/elevator-interior.jpg',
  elevatorDisplay: '/creative-guide/services/elevator-display-600x800.jpg',
} as const;
const ELEVATOR_LOOP_URL = '/creative-guide/Elevator_Still_Soleia.mp4';
// The logo animation itself (background-examples segment of the explainer),
// trimmed for a clean loop. Tapping the card opens the full explainer.
const TRANSPARENT_LOOP_URL = '/creative-guide/services/transparent-logo-loop.mp4';

type Item = {
  id: string;
  title: string;
  price: number;
  category: string | null;
  ideal_for: string | null;
  long_description: string | null;
  deliverables: string[] | null;
  sort_order: number | null;
};

type PackageSection = {
  heading?: string;
  body: string;
  bullets?: string[];
};

// Editorial blurbs keyed by exact template title. Each one is written to help
// a client actually understand what they're buying — what it lives on, what
// we deliver, and how they'll experience it in the room.
const BLURBS: Record<string, string> = {
  'Static Logo':
    "Your contract includes up to ten static logos across the LED screens. This line item covers each additional static logo beyond that allotment.",
  'Transparent Logo Animation':
    "A refined logo animation delivered with a true alpha channel, allowing it to sit cleanly over live content and environmental footage without blocking the screen. Your mark remains visible while the room continues to move underneath — ideal for branding moments that need to feel integrated, not interruptive. Tap the preview above to see how the transparency layer behaves on the wall.",
  'Mapped by Soleia Creative Team':
    "Mapping of client animations, max 50 GB. Revisions to content after delivery (new files, edits, or re-export) will incur additional fees.",
  'Mapped to Spec by Client':
    "Client maps content to spec and provides to Soleia (no edits needed by Soleia Creative Team), max 50 GB. Revisions after delivery will incur additional fees.",
  'Elevator Dynamic Animation':
    "A custom portrait-oriented animation for the elevator LED — the first branded surface guests see when they arrive. We design a short loop (typically 15–30 seconds) that plays continuously between rides, plus optional variants for arrival/departure states. Delivered mapped, tested, and running on show day.",
  'LED Screens Specific Zone Mapping':
    "Custom mapping to specific LED zones outside the main sunburst architecture — designed for moments that need to live on one focused surface instead of the whole room. Typically applied to the SR IMAG wall, SL IMAG wall, and the outdoor arch. Includes creative treatment, exact-resolution build-out, and onsite playback for the zones you select.",
  'Performing Artist — Mapped by Soleia Creative Team':
    "Show-facing visuals designed around a headlining performer or DJ — set graphics, transitions, drops, artist branding, and stage-cued moments — mapped across the IMAG walls, center panel, DJ booth strip, and stage curves. Built in coordination with the artist's team so the visuals belong to the performance, not just play behind it.",
  'Elevator Created by Client':
    "You deliver the finished elevator content built to our portrait spec, and we handle the rest: intake, QC on the actual elevator LED, mapping into the playback system, and onsite testing so it plays back correctly the day of the event.",
  'Elevator Static Logo':
    "A single static portrait logo built for the elevator LED's idle state — always-on brand presence between rides. Color-graded and sized for the exact panel, tested onsite before doors.",
  'Individual Cabana / Bungalow Logo':
    "Branded content assigned to a specific cabana or bungalow TV — each selected screen runs its own dedicated player feed instead of the shared network. Supported formats: still image PNG or video .MOV.",
  '3D Previz':
    "A full 3D preview of your content running on Soleia's real screens, rendered from our venue model. You review the actual visuals in the actual room before load-in — pacing, brightness, brand placement, coverage — and approve or request revisions. Included with the Creative Package; also available standalone.",
  'Presentation':
    "Onsite technical support for client-provided laptops or devices running PowerPoint decks, keynote videos, award reels, or live presentation content. Covers signal connection, screen routing to the correct LED zones, playback coordination with the show operator, and pre-event testing so your presentation lands correctly the moment you cue it.",
  'LED Marquee':
    "Soleia's exterior LED marquee — the street-facing sign guests see on approach — can carry your event's branding for the night. We build a marquee-formatted graphic (static or short animated loop) sized to the sign's exact resolution and schedule it into the venue's marquee playback so it runs during your event window. Great for arrivals, step-and-repeat moments, and social capture outside the venue. Available on request through the Soleia creative team — not billed on the rate card, coordinated directly per event.",
};

const CREATIVE_PACKAGE_SECTIONS: PackageSection[] = [
  {
    body: "Soleia is a fully immersive LED environment — not a standard screen setup. Every surface in the venue has a different shape, size, and purpose. Content that isn't built for it feels disconnected. Content that is built for it transforms the entire space.\n\nThat's what we deliver.",
  },
  {
    body: "Our team designs and produces custom visuals specifically for Soleia's full LED layout — from the main room and ceiling panels to outdoor screens and interior displays — all working together as one cohesive experience.",
  },
  {
    heading: "What's included",
    body: '',
    bullets: [
      'Creative direction based on your event and brand',
      '1–3 custom visual looks built for the full venue',
      'Pixel-perfect mapping across all LED surfaces',
      '3D preview of your content before the event',
      'Onsite playback and show operation',
    ],
  },
  {
    body: "We handle everything from concept to show night, so the entire experience feels seamless, intentional, and fully immersive.\n\nContact the Soleia Creative Team with your event date to get started.",
  },
];

const CATEGORY_ORDER = [
  'Soleia Creative Package',
  'Video Mapping & Load Fees',
  'Additional Options',
];

const ELEVATOR_TITLES = [
  'Elevator Dynamic Animation',
  'Elevator Static Logo',
  'Elevator Created by Client',
];

// Per-service media: image header + the mono spec chip that ties it to the
// venue's real pixel language.
const MEDIA: Record<string, { src: string; alt: string; chip: string }> = {
  'Performing Artist — Mapped by Soleia Creative Team': {
    src: IMG.artist,
    alt: 'Show visuals across the sunburst and IMAG walls during a performance',
    chip: 'Show-cued · IMAG + booth + curves',
  },
  '3D Previz': {
    src: IMG.previz,
    alt: '3D preview of content rendered from the Soleia venue model',
    chip: 'Rendered from the venue model',
  },
  'Static Logo': {
    src: IMG.staticLogo,
    alt: 'Event logo running on the main-room LED screens',
    chip: '10 included with your buyout',
  },
  'Individual Cabana / Bungalow Logo': {
    src: '/creative-guide/venue-photos/soleia-bungalow-spa.jpg',
    alt: 'Bungalow spa with private TV displays either side of the plunge pool',
    chip: '15 cabanas · 9 bungalows',
  },
  'Presentation': {
    src: IMG.presentation,
    alt: 'Client content routed across the sunburst rays and room screens',
    chip: 'Onsite support · screen routing',
  },
};

function Chip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/75 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary backdrop-blur-sm whitespace-nowrap ${className}`}
    >
      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
      {children}
    </span>
  );
}

function MediaHeader({
  src,
  alt,
  chip,
  chip2,
  aspect = 'aspect-[16/9.4]',
}: {
  src: string;
  alt: string;
  chip?: string;
  chip2?: string;
  aspect?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-black ${aspect}`}>
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
      {chip && <Chip className="absolute bottom-4 left-4">{chip}</Chip>}
      {chip2 && <Chip className="absolute bottom-4 right-4">{chip2}</Chip>}
    </div>
  );
}

function SectionHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <Reveal className="mb-11">
      <span className="block font-mono text-[11px] uppercase tracking-[0.34em] text-primary">{eyebrow}</span>
      <h2 className="mt-3.5 font-display text-3xl leading-tight text-foreground sm:text-4xl lg:text-[2.6rem]">{title}</h2>
      <div className="mt-4 h-px w-16 bg-gradient-to-r from-primary to-transparent" />
      {lede && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{lede}</p>}
    </Reveal>
  );
}

export default function CreativeGuideServices() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_rate_card_addons');
      setItems((data as Item[]) || []);
      setLoading(false);
    })();
  }, []);

  const byCategory = (cat: string) =>
    items
      .filter((i) => (i.category || 'Additional Options') === cat)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

  const mappingItems = byCategory('Video Mapping & Load Fees');
  const additional = byCategory('Additional Options');

  const findByTitle = (title: string) => additional.find((i) => i.title === title);
  const zonesItem = findByTitle('LED Screens Specific Zone Mapping');
  const transparentItem = findByTitle('Transparent Logo Animation');
  const elevatorItems = ELEVATOR_TITLES.map(findByTitle).filter(Boolean) as Item[];
  const staticItem = findByTitle('Static Logo');
  const handledTitles = new Set([
    'LED Screens Specific Zone Mapping',
    'Transparent Logo Animation',
    'Static Logo',
    'LED Marquee',
    ...ELEVATOR_TITLES,
  ]);
  // Explicit grid order: Static Logo beside the transparent-logo video,
  // then Performing Artist paired with 3D Previz, then the private-display row.
  const GRID_ORDER = [
    'Performing Artist — Mapped by Soleia Creative Team',
    '3D Previz',
    'Individual Cabana / Bungalow Logo',
    'Presentation',
  ];
  const gridItems = additional
    .filter((i) => !handledTitles.has(i.title))
    .sort((a, b) => {
      const ia = GRID_ORDER.indexOf(a.title);
      const ib = GRID_ORDER.indexOf(b.title);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

  const blurbFor = (item: Item) => BLURBS[item.title] || item.long_description || 'Details available on request.';

  const cardShell =
    'group card-elevated overflow-hidden rounded-3xl border border-primary/15 bg-card/40 surface-elevated transition-colors hover:border-primary/30';

  const renderServiceCard = (item: Item) => {
                const media = MEDIA[item.title];
                return (
                  <Reveal key={item.id}>
                    <article className={`${cardShell} flex h-full flex-col`}>
                      {media && <MediaHeader src={media.src} alt={media.alt} chip={media.chip} />}
                      <div className="flex-1 p-7 sm:p-8">
                        <h3 className="mb-3 font-display text-2xl leading-tight text-foreground">{item.title}</h3>
                        <p className="text-[14.5px] leading-relaxed text-muted-foreground">{blurbFor(item)}</p>

                        {item.title === 'Presentation' && (
                          <div className="mt-6 flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => navigate('/creative-guide/doc/presentation')}
                              className="tap-44 inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/10"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Presentation Guide
                            </button>
                            <a
                              href={PRESENTATION_GUIDE_PDF_URL}
                              download="Soleia-Presentation-Guide.pdf"
                              className="tap-44 inline-flex items-center gap-2 rounded-full border border-border/70 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </a>
                          </div>
                        )}

                        {item.deliverables && item.deliverables.length > 0 && (
                          <ul className="mt-5 space-y-1.5">
                            {item.deliverables.map((d, i) => (
                              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                                <span className="text-primary">—</span>
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </article>
                  </Reveal>
                );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="glass fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-primary/15 px-5 py-4 sm:px-8">
        <button onClick={() => navigate('/creative-guide')} className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-[0.2em]">Creative Guide</span>
        </button>
        <img src={solIcon} alt="Soleia" className="h-9 w-auto object-contain" />
        <div className="w-24" />
      </header>

      {/* HERO — full-bleed venue photograph */}
      <section className="relative flex min-h-[82vh] items-end overflow-hidden">
        <img src={HERO_IMG} alt="Soleia main room — sunburst LED ceiling over the dance floor" className="absolute inset-0 h-full w-full object-cover" />
        {/* Scrim resolves to the page background so the headline always sits on
            near-solid theme color — legible in light and dark alike. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-background" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative mx-auto w-full max-w-5xl px-6 pb-20 pt-40">
          <Reveal>
            <span className="font-mono text-[11px] uppercase tracking-[0.34em] text-primary">Services</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-5 max-w-3xl font-display text-4xl leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
              Soleia Creative <span className="text-gradient-gold">Team Services</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Custom content, pixel-perfect mapping and show-night playback for Soleia's LED environment — designed and run by the Soleia creative team.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/creative-guide/doc/services')}
                className="tap-44 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/40 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-primary backdrop-blur-sm transition-colors hover:bg-primary/10"
              >
                <Eye className="h-3.5 w-3.5" />
                View Services
              </button>
              <a
                href={SERVICES_PDF_URL}
                download="Soleia-Creative-Services.pdf"
                className="tap-44 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/40 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5 pb-32 sm:px-8">
        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">Loading services…</div>
        ) : (
          <>
            {/* ══ 01 · THE FULL CREATIVE PACKAGE ══ */}
            <section className="pt-24">
              <SectionHead eyebrow="01 — Soleia Creative Package" title="The room, designed as one canvas." />
              <Reveal>
                <div className="edge-gold relative rounded-3xl surface-elevated">
                  <div className="grid overflow-hidden rounded-3xl bg-card/60 lg:grid-cols-2">
                    <div className="flex flex-col p-8 sm:p-11">
                      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Full Package</span>
                      <h3 className="mb-4 mt-3 font-display text-2xl leading-tight text-foreground sm:text-3xl">
                        The Full Soleia Creative Package
                      </h3>
                      <div className="space-y-4">
                        {CREATIVE_PACKAGE_SECTIONS.map((section, idx) => (
                          <div key={idx}>
                            {section.heading && (
                              <h4 className="mb-2 font-display text-base text-foreground">{section.heading}</h4>
                            )}
                            {section.body && (
                              <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-muted-foreground">{section.body}</p>
                            )}
                            {section.bullets && section.bullets.length > 0 && (
                              <ul className="mt-2 space-y-2">
                                {section.bullets.map((bullet, bIdx) => (
                                  <li key={bIdx} className="flex gap-3 text-[14px] text-foreground">
                                    <span className="flex-shrink-0 text-primary">—</span>
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-rows-[1fr_auto] border-t border-primary/15 lg:border-l lg:border-t-0">
                      <div className="relative min-h-[260px] overflow-hidden">
                        <img src={IMG.packageMain} alt="Full-venue custom look — sunburst, curves and booth running one design" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
                        <Chip className="absolute bottom-4 left-4">One look · every surface</Chip>
                      </div>
                      <div className="grid grid-cols-3 border-t border-primary/15">
                        {[
                          { src: IMG.packageEvent, cap: 'Event branding', alt: 'Corporate event with branded stage visuals' },
                          { src: IMG.packageTakeover, cap: 'Brand takeover', alt: 'Sponsor takeover across the sunburst rays' },
                          { src: IMG.previz, cap: '3D previz', alt: '3D previsualization of content in the venue model' },
                        ].map((f, i) => (
                          <figure key={f.cap} className={`relative m-0 ${i < 2 ? 'border-r border-primary/15' : ''}`}>
                            <img src={f.src} alt={f.alt} loading="lazy" className="aspect-[16/10] w-full object-cover" />
                            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pb-2 pt-4 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-primary">
                              {f.cap}
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* ══ 02 · ADDITIONAL OPTIONS ══ */}
            <section className="pt-24">
              <SectionHead eyebrow="02 — Additional Options" title="Built for the surface it lives on." />

              {/* LED Zone Mapping — signature wide card */}
              {zonesItem && (
                <Reveal>
                  <article className={`${cardShell} grid lg:grid-cols-[1.35fr_1fr]`}>
                    <MediaHeader src={IMG.zones} alt="Outdoor arch and side panels over the beachclub pool at sunset" chip="Arch 1512 × 504 · Sides 588 × 840" aspect="min-h-[280px] lg:min-h-[320px]" />
                    <div className="self-center p-8 sm:p-9">
                      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Zone Mapping</span>
                      <h3 className="mb-3 mt-2.5 font-display text-2xl leading-tight text-foreground">{zonesItem.title}</h3>
                      <p className="text-[14.5px] leading-relaxed text-muted-foreground">{blurbFor(zonesItem)}</p>
                    </div>
                  </article>
                </Reveal>
              )}

              {/* Transparent Logo + remaining services, two-up */}
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {staticItem && renderServiceCard(staticItem)}

                {transparentItem && (
                  <Reveal>
                    <article className={cardShell}>
                      <div
                        className="relative aspect-[16/9.4] cursor-pointer overflow-hidden bg-black"
                        onClick={() => setFullscreenVideo(transparentLogoVideo.url)}
                      >
                        <video
                          src={TRANSPARENT_LOOP_URL}
                          className="h-full w-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-xs uppercase tracking-[0.18em]">
                            <Maximize2 className="h-3.5 w-3.5" />
                            Tap for fullscreen
                          </div>
                        </div>
                        <Chip className="absolute bottom-4 left-4">DXV Alpha · true transparency</Chip>
                      </div>
                      <div className="p-7 sm:p-8">
                        <h3 className="mb-3 font-display text-2xl leading-tight text-foreground">{transparentItem.title}</h3>
                        <p className="text-[14.5px] leading-relaxed text-muted-foreground">{blurbFor(transparentItem)}</p>
                      </div>
                    </article>
                  </Reveal>
                )}

                {gridItems.map(renderServiceCard)}
              </div>

              {/* Elevator Displays — grouped panel with the interior render and
                  the display close-up at its native 600×800 mapping */}
              {elevatorItems.length > 0 && (
                <Reveal className="mt-6">
                  <article className={`${cardShell} grid lg:grid-cols-[400px_1fr]`}>
                    <div className="relative min-h-[420px] overflow-hidden border-b border-primary/15 lg:min-h-[520px] lg:border-b-0 lg:border-r">
                      <img src={IMG.elevatorInterior} alt="Soleia elevator interior — gold trim with the branded display beside the doors" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
                      {/* Close-up of the elevator video display — true 600×800 (3:4) */}
                      <div className="absolute bottom-6 left-6 z-[2] aspect-[3/4] w-[168px] overflow-hidden rounded-[10px] border border-primary/50 bg-black shadow-[0_0_34px_-6px_hsl(var(--primary)/0.5),0_14px_30px_-10px_rgba(0,0,0,0.8)]">
                        <video
                          src={ELEVATOR_LOOP_URL}
                          poster={IMG.elevatorDisplay}
                          className="absolute inset-0 h-full w-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1 pb-2 pt-4 text-center font-mono text-[8.5px] uppercase tracking-[0.16em] text-primary">
                          Display · 600 × 800
                        </span>
                      </div>
                      <Chip className="absolute bottom-6 right-5 z-[2]">Mapped 1:1 · Portrait</Chip>
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="border-b border-primary/15 px-7 pb-5 pt-7 sm:px-9">
                        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Arrival</span>
                        <h3 className="mt-2.5 font-display text-2xl leading-tight text-foreground sm:text-[1.7rem]">Elevator Displays</h3>
                      </div>
                      {elevatorItems.map((item, i) => (
                        <div key={item.id} className={`px-7 py-6 sm:px-9 ${i > 0 ? 'border-t border-primary/15' : ''}`}>
                          <h4 className="mb-2 font-display text-xl text-foreground">{item.title}</h4>
                          <p className="text-[13.5px] leading-relaxed text-muted-foreground">{blurbFor(item)}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                </Reveal>
              )}

              {/* LED Marquee — exterior closer. Not a rate-card line item;
                  coordinated per event, so it isn't loaded from the DB. */}
              <Reveal className="mt-6">
                <article className={cardShell}>
                  <MediaHeader src={IMG.marquee} alt="Exterior LED marquee carrying event branding at street level" chip="Exterior · street-facing" chip2="On request" aspect="aspect-[21/9]" />
                  <div className="grid gap-3 p-7 sm:grid-cols-[minmax(180px,0.7fr)_2fr] sm:gap-11 sm:p-8">
                    <h3 className="font-display text-2xl leading-tight text-foreground">LED Marquee</h3>
                    <p className="text-[14.5px] leading-relaxed text-muted-foreground">{BLURBS['LED Marquee']}</p>
                  </div>
                </article>
              </Reveal>
            </section>

            {/* ══ 03 · VIDEO MAPPING & LOAD FEES ══ */}
            {mappingItems.length > 0 && (
              <section className="pt-24">
                <SectionHead
                  eyebrow="03 — Video Mapping & Load Fees"
                  title="Bringing your own content."
                  lede="Client-supplied animations, mapped and loaded into Soleia's playback system. Two paths, depending on who builds to spec."
                />
                <Reveal>
                  <article className={cardShell}>
                    <MediaHeader
                      src={IMG.mapping}
                      alt="Client brand content mapped wall-to-wall across the main-room curve LED"
                      chip="Client content · mapped wall-to-wall"
                      aspect="aspect-[21/8]"
                    />
                    <div>
                      {mappingItems.map((item, i) => (
                        <div key={item.id} className={`grid gap-3 p-7 sm:grid-cols-[minmax(200px,0.9fr)_2fr_auto] sm:items-center sm:gap-7 sm:px-8 ${i > 0 ? 'border-t border-primary/15' : ''}`}>
                          <h4 className="font-display text-xl leading-snug text-foreground">{item.title}</h4>
                          <p className="text-[14px] leading-relaxed text-muted-foreground">{blurbFor(item)}</p>
                          <Chip>Max 50 GB</Chip>
                        </div>
                      ))}
                    </div>
                  </article>
                </Reveal>
              </section>
            )}
          </>
        )}
      </main>

      {/* Fullscreen video modal */}
      {fullscreenVideo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setFullscreenVideo(null)}
        >
          <div
            className="relative flex h-full max-h-[80vh] w-full max-w-5xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={fullscreenVideo}
              className="max-h-full max-w-full"
              autoPlay
              loop
              muted
              controls
              playsInline
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-5 top-5 text-white"
            onClick={() => setFullscreenVideo(null)}
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
