import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Eye, Download, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from '@/components/motion/Reveal';
import { CreativeGuideHeader } from '@/components/creative-guide/CreativeGuideHeader';
import { CreativeGuideFooter } from '@/components/creative-guide/CreativeGuideFooter';
import { GuideSectionHead } from '@/components/creative-guide/GuideSectionHead';
import { GuideSectionNav, type GuideSection } from '@/components/creative-guide/GuideSectionNav';
import { VenueSurfaceExplorer } from '@/components/creative-guide/VenueSurfaceExplorer';
import { SpecificZoneSelector } from '@/components/creative-guide/SpecificZoneSelector';
import { CreativeTimeline } from '@/components/creative/CreativeTimeline';
import { PIXELMAP_RENDERS as R, VENUE_PHOTOS } from '@/lib/venueSurfaces';

// Same-origin document links: works in preview and on the published domain
// without depending on a deploy having already shipped the file.
const DOCUMENT_VERSION = '2026-08-14c';
const SERVICES_PDF_URL = `/Soleia-Creative-Services-No-Pricing.pdf?v=${DOCUMENT_VERSION}`;
const PRESENTATION_GUIDE_PDF_URL = `/Soleia-Presentation-Guide.pdf?v=${DOCUMENT_VERSION}`;

// Imagery lives in public/ so the printable guide and PDFs can reference the
// same files. Crops in services/ are pre-cut to their display aspect.
const IMG = {
  packageMain: '/creative-guide/services/artist-show.jpg',
  presentationKeynote: '/creative-guide/services/presentation-keynote.jpg',
  creativeDirection: '/creative-guide/services/creative-direction-nano-banana-pro.png',
  onsitePlaybackConsole: '/creative-guide/services/onsite-playback-console.jpg',
  previz: '/creative-guide/services/previz-render.jpg',
  mapping: '/creative-guide/services/mapping-client-content.jpg',
  artist: '/creative-guide/services/artist-show.jpg',
  zones: '/creative-guide/services/zones-outdoor.jpg',
  staticLogo: '/creative-guide/services/static-logo-event.jpg',
  elevatorInterior: '/creative-guide/drive-updates/elevator-arrival.png',
  bungalow: '/creative-guide/venue-photos/soleia-bungalow-spa.jpg',
} as const;

// TV / narrowcasting. The card shows the surface; the pixel map, the loop and
// the delivery spec live on /creative-guide/tv, the way the elevator's do.
const TV_HERO_IMG = '/creative-guide/drive-updates/tv-hero.png';
const TICKER_LOOP_URL = '/creative-guide/ticker/ticker-preview-loop.mp4';
const TICKER_LOOP_POSTER = '/creative-guide/ticker/ticker-preview-poster.jpg';
const STATIC_LOGO_COVER = '/creative-guide/drive-updates/additional-static-logo-cover.png';
const STATIC_LOGO_EXPLAINER = '/creative-guide/drive-updates/static-logo-explainer.mp4';
const TRANSPARENT_LOGO_COVER = '/creative-guide/drive-updates/transparent-logo-cover.mp4';
const TRANSPARENT_LOGO_EXPLAINER = '/creative-guide/drive-updates/transparent-logo-explainer.mp4';
// A real previz render: a minute through the venue model with a client's show
// on every screen. It stays behind a poster and `preload="none"` — 12 MB has
// no business downloading itself on the page a packet link opens.
const PREVIZ_MOVIE_URL = '/creative-guide/services/previz-soleia.mp4';
const PREVIZ_POSTER = '/creative-guide/services/previz-soleia-poster.jpg';

// The mapping previz: the pixel map itself running on the venue model, every
// screen carrying its own labelled slice. Different film from the one above --
// that shows a client's finished show, this shows the mechanism. Same rules:
// poster, preload="none", 9 MB stays put until someone asks for it.
const PIXELMAP_PREVIZ_MOVIE_URL = '/creative-guide/services/pixelmap-previz.mp4';

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

/**
 * The page's spine.
 *
 * The order follows how the creative call is actually run: show them the room,
 * then what their buyout already covers in it, then the upgrade, the focused
 * zone service, the remaining delivery options and what happens
 * after the call. A client reading alone from the pre-call packet gets the same
 * walk, in the same order.
 */
const SECTIONS: GuideSection[] = [
  { id: 'where', label: 'The Room' },
  { id: 'included', label: 'Included' },
  { id: 'package', label: 'Creative Upgrade' },
  { id: 'zones', label: 'Specific Zones' },
  { id: 'own-content', label: 'Own Content' },
  { id: 'next', label: "What's Next" },
];

// Editorial blurbs keyed by exact template title. Each one is written to help
// a client actually understand what they're buying — what it lives on, what
// we deliver, and how they'll experience it in the room.
const BLURBS: Record<string, string> = {
  'Static Logo':
    "Your mark delivered on a transparent background, so it sits over the room rather than replacing it. The in-house visual animations and motion graphics from the club library keep running underneath — mixed in real time by the visual operator — so the room carries the night while your branding holds its place on the screens throughout, with no loop of your own to produce or approve. Your buyout includes ten static logos across the five main LED screens; this line item covers each one beyond that.",
  'Transparent Logo Animation':
    'A refined logo animation delivered with a true alpha channel. Your mark sits cleanly above the venue visuals while the room continues to move underneath, creating an integrated branded moment without covering the full screen.',
  'Mapped by Soleia Creative Team':
    "Mapping of client animations, max 50 GB. Revisions to content after delivery (new files, edits, or re-export) will incur additional fees.",
  'Mapped to Spec by Client':
    "Client maps content to spec and provides to Soleia (no edits needed by Soleia Creative Team), max 50 GB. Revisions after delivery will incur additional fees.",
  'Elevator Dynamic Animation':
    "A custom portrait-oriented animation for the elevator LED — the first branded surface guests see when they arrive. We design a short loop (typically 15–30 seconds) that plays continuously between rides, plus optional variants for arrival/departure states. Delivered mapped, tested, and running on show day. Included with the Creative Package; also available standalone.",
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
    "Custom static or animated content for Soleia's exterior LED marquee. We prepare the creative to the ticker's exact canvas, load it into venue playback, and schedule it for your event window.",
};

const CREATIVE_PACKAGE_SECTIONS: PackageSection[] = [
  {
    body: 'The Soleia Creative Upgrade takes the visual workload off your team. We guide the overall approach from concept through final delivery, create the animation system for the venue, prepare an elevator static logo for arrival, and render a 3D preview on the actual venue model so you can review and approve everything before load-in.',
  },
];

/**
 * What a buyout already includes. Shown before the package so a client reads
 * what they have first, and sees the package as the upgrade on top of it.
 */
const BUYOUT_INCLUSIONS = [
  {
    sub: 'Included',
    title: 'LED Screens',
    intro: 'Every activation includes 10 static logos displayed across the 5 main LED screens:',
    items: [
      '2 Large Horizontal — Nightclub',
      '2 Large Vertical — Beachclub / Outside',
      '1 Beachclub Arch — Beachclub / Stage',
    ],
    surfaces: ['IMAG SR', 'IMAG SL', 'Center', 'Sol Rays', 'Outdoor SR', 'Outdoor SL', 'Outdoor Arch'],
    fine: 'All other LED screens are activated and display in-house visual animations and motion graphics from the club library, mixed in real time by the visual operator.',
  },
  {
    sub: 'Included',
    title: 'TV Screens / Narrowcasting',
    intro: '1 static logo displayed across the TV / narrowcasting network:',
    items: [
      '4 Front Door Entry — Casino Level',
      '9 Bungalows — Beachclub / Outside',
      '15 Cabanas — Beachclub / Outside',
    ],
    fine: 'All TVs are connected and display the same content feed. A dedicated logo per cabana or bungalow is available as a line item below.',
  },
];

/** Counted straight off the inclusions above, so the two cannot drift apart. */
const BUYOUT_AT_A_GLANCE: [string, string][] = [
  ['10', 'Static logos included'],
  ['5', 'Main LED screens'],
  ['28', 'TVs on the network'],
  ['1', 'Shared TV feed'],
];

/**
 * The Creative Package inclusions, kept text-led so the offer reads as one
 * service rather than a catalogue of separate image cards.
 */
const PACKAGE_INCLUDES: {
  title: string;
  body: string;
  /** Present means a restrained text action can open the relevant preview. */
  movie?: string;
}[] = [
  {
    title: 'Creative direction',
    body: 'We read your brand — guidelines, palette, past events — and set how the room should feel on arrival, through the programme and late in the night.',
  },
  {
    title: '1–3 custom looks',
    body: 'Original visuals designed for the whole venue at once, so every surface belongs to the same idea rather than running its own loop.',
  },
  {
    title: 'Pixel-perfect mapping',
    body: 'Every surface built at its own native resolution and placed in the 3840 × 2160 frame — the walls, the curves, the ceiling rays and the beachclub exteriors.',
    movie: PIXELMAP_PREVIZ_MOVIE_URL,
  },
  {
    title: 'Elevator arrival logo',
    body: 'A static portrait logo prepared for the elevator display, giving guests a polished first branded moment on arrival.',
  },
  {
    title: '3D preview before the night',
    body: "Your content rendered on Soleia's real screens from our venue model, so you approve what the room will actually show — pacing, brightness, coverage — before load-in.",
    movie: PREVIZ_MOVIE_URL,
  },
  {
    title: 'Onsite playback',
    body: 'Loaded, checked against the run of show, and operated by our team throughout the night.',
  },
];

const ELEVATOR_TITLES = [
  'Elevator Static Logo',
  'Elevator Dynamic Animation',
  'Elevator Created by Client',
];

/** The card's brief. The numbers it quotes are the buyout inclusions above. */
const TV_BLURB =
  "Twenty-eight televisions run as one narrowcasting network — four at the front door on the casino level, nine bungalows and fifteen cabanas outside. They share a single feed, so one file built at 1920 × 1080 plays on every screen. A dedicated logo on a chosen cabana or bungalow is a line item below.";

/**
 * Add-ons are grouped by the surface they land on, not by the rate card's
 * category.
 *
 * This page used to place cards by looking a title up inside a category — and
 * two of them, Zone Mapping and Performing Artist, sit under "Video Mapping &
 * Load Fees" in the database, so their designed cards never rendered at all and
 * both items instead fell through to the load-fee table, stamped with a
 * "Max 50 GB" limit that applies to neither. Placement is explicit here, and
 * anything this map does not know about lands in `more` rather than vanishing.
 */
type GroupId = 'room' | 'arrival' | 'private' | 'production' | 'more';

const GROUP_OF: Record<string, GroupId> = {
  'LED Screens Specific Zone Mapping': 'room',
  'Static Logo': 'room',
  'Transparent Logo Animation': 'room',
  'Performing Artist — Mapped by Soleia Creative Team': 'room',
  'Individual Cabana / Bungalow Logo': 'private',
  '3D Previz': 'production',
  'Presentation': 'production',
};

/** Titles the load-fee table owns. Everything else is an add-on. */
const LOAD_FEE_TITLES = ['Mapped by Soleia Creative Team', 'Mapped to Spec by Client'];

const GROUPS: { id: GroupId; eyebrow: string; title: string; note: string }[] = [
  {
    id: 'room',
    eyebrow: '',
    title: '',
    note: '',
  },
  {
    id: 'arrival',
    eyebrow: 'On arrival',
    title: 'Before they reach the room',
    note: 'The elevator display carries your first branded moment before guests enter the venue.',
  },
  {
    id: 'private',
    eyebrow: 'Additional service · TV displays',
    title: 'Cabanas and bungalows',
    note: 'Shared narrowcasting or dedicated content for an individual cabana or bungalow screen.',
  },
  {
    id: 'production',
    eyebrow: '',
    title: '',
    note: '',
  },
  {
    id: 'more',
    eyebrow: '',
    title: '',
    note: '',
  },
];

// Per-service media: the image that ties a service to the real venue.
const MEDIA: Record<string, { src: string; alt: string }> = {
  'LED Screens Specific Zone Mapping': {
    src: R.outdoorArch,
    alt: 'The Outdoor Arch alone, labelled at its native 1512 × 504',
  },
  'Performing Artist — Mapped by Soleia Creative Team': {
    src: IMG.onsitePlaybackConsole,
    alt: 'The Soleia playback console operating a performing artist look across the main room screens',
  },
  '3D Previz': {
    src: IMG.previz,
    alt: '3D preview of content rendered from the Soleia venue model',
  },
  'Static Logo': {
    src: R.mainInterior2,
    alt: 'The main-room screens from the floor, each carrying its own slice of the frame',
  },
  'Individual Cabana / Bungalow Logo': {
    src: VENUE_PHOTOS.cabanaInterior,
    alt: 'A Soleia cabana with its own television on the wall, curtains drawn back to the pool',
  },
  'Presentation': {
    src: IMG.presentationKeynote,
    alt: 'A keynote running live at Soleia — the decks on both IMAG walls, the mark across the ceiling rays, a full room',
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
  aspect = 'aspect-[16/9.4]',
}: {
  src: string;
  alt: string;
  aspect?: string;
}) {
  return (
    <div className={`cg-editorial-cover relative overflow-hidden bg-black ${aspect}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
    </div>
  );
}

/** Heading for the remaining surface groups below specific-zone mapping. */
function GroupHead({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return (
    <Reveal className="mb-10 mt-24 sm:mt-28 lg:mt-32">
      <div className="border-b border-primary/15 pb-4">
        <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-primary">{eyebrow}</span>
        <h3 className="mt-2 font-display text-2xl leading-tight text-foreground">{title}</h3>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{note}</p>
      </div>
    </Reveal>
  );
}

/**
 * The venue-plan hero from the first Creative Guide concept. The plan is the
 * first thing a client sees so the rest of the guide reads as a journey through
 * a real place, not a catalogue of disconnected screens.
 */
function HeroVenueArtwork() {
  return (
    <a
      href="#where"
      className="group absolute inset-0 block overflow-hidden bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      aria-label="Explore the complete Soleia venue"
    >
      <img
        src="/creative-guide/venue-layout-sunburst.png"
        alt="Full Soleia venue layout with the golden sunburst screen installation in the main room"
        className="cg-hero-plan absolute inset-0 h-full w-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.015]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,2,2,0.94)_0%,rgba(2,2,2,0.68)_33%,rgba(2,2,2,0.18)_68%,rgba(2,2,2,0.28)_100%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/45" aria-hidden="true" />
    </a>
  );
}

type LogoServiceKind = 'static' | 'animated';

function LogoServiceExplainerCard({
  item,
  kind,
  wide,
  cardShell,
}: {
  item: Item;
  kind: LogoServiceKind;
  wide: boolean;
  cardShell: string;
}) {
  const [slide, setSlide] = useState(0);
  const isStatic = kind === 'static';
  const serviceTitle = isStatic ? 'Additional Static Logo' : 'Transparent Logo Animation';
  const serviceDescription = isStatic
    ? 'Your buyout includes 10 static logos across the five main LED screens. Select this price-sheet service when your event needs more than those 10 included logos. Each additional mark is prepared for clean, reliable display in the venue.'
    : 'Select this price-sheet service when you want the Soleia Creative Team to animate your logo. We create a polished motion treatment with transparency, prepared for the venue playback system so the room can keep moving behind your mark.';

  const showSlide = (nextSlide: number) => setSlide(Math.max(0, Math.min(1, nextSlide)));

  return (
    <Reveal key={item.id} className={wide ? 'md:col-span-2' : ''}>
      <article className={`${cardShell} flex h-full min-h-[520px] flex-col`}>
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {slide === 0 ? (
            <div key="service" className="animate-fade-in-up flex flex-1 flex-col">
              <div className="aspect-[16/9.4] overflow-hidden bg-black">
                {isStatic ? (
                  <img
                    src={STATIC_LOGO_COVER}
                    alt="Opaque and transparent presentations of the Soleia static logo"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={TRANSPARENT_LOGO_COVER}
                    className="h-full w-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    aria-label="Transparent Logo Animation service preview"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between p-7 sm:p-8">
                <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-primary">Price sheet service</span>
                  <h4 className="mt-4 font-display text-3xl leading-[1.08] text-foreground">{serviceTitle}</h4>
                  <p className="mt-5 text-[14.5px] leading-relaxed text-muted-foreground">{serviceDescription}</p>
                </div>
                <div className="mt-8 border-t border-primary/15 pt-4">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
                    Slide 01 · Service
                  </span>
                </div>
              </div>
            </div>
          ) : isStatic ? (
            <div key="static-explainer" className="animate-fade-in-up flex flex-1 flex-col">
              <div className="aspect-[16/9.4] overflow-hidden bg-black">
                <video
                  src={STATIC_LOGO_EXPLAINER}
                  className="h-full w-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  aria-label="Static Logo file preparation explainer"
                />
              </div>
              <div className="flex-1 p-7 sm:p-8">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary">Slide 02 · File preparation</span>
                <h4 className="mb-3 mt-3 font-display text-2xl leading-tight text-foreground">Opaque vs. transparent</h4>
                <p className="text-[14px] leading-relaxed text-muted-foreground">
                  An opaque file carries a solid background that covers the content behind it. A transparent PNG or vector removes that box, allowing Soleia's venue visuals to remain visible around your static logo.
                </p>
              </div>
            </div>
          ) : (
            <div key="animation-explainer" className="animate-fade-in-up flex flex-1 flex-col">
              <div className="aspect-[16/9.4] overflow-hidden bg-black">
                <video
                  src={TRANSPARENT_LOGO_EXPLAINER}
                  className="h-full w-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  aria-label="Transparent logo animation explainer"
                />
              </div>
              <div className="flex-1 p-7 sm:p-8">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary">Slide 02 · Motion transparency</span>
                <h4 className="mb-3 mt-3 font-display text-2xl leading-tight text-foreground">The room keeps moving underneath.</h4>
                <p className="text-[14px] leading-relaxed text-muted-foreground">
                  We animate the logo with a true alpha channel. Unlike an opaque animation that replaces the screen behind it, the transparent motion layer lets the venue's live visuals remain visible around the animated mark.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-primary/15 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2" aria-label={`Slide ${slide + 1} of 2`}>
            {[0, 1].map((dot) => (
              <button
                key={dot}
                type="button"
                onClick={() => showSlide(dot)}
                aria-label={`Show slide ${dot + 1}`}
                aria-current={slide === dot ? 'step' : undefined}
                className={`h-1.5 rounded-full transition-all duration-500 ${slide === dot ? 'w-8 bg-primary' : 'w-3 bg-primary/25 hover:bg-primary/50'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => showSlide(slide - 1)}
              disabled={slide === 0}
              aria-label="Previous slide"
              className="grid h-10 w-10 place-items-center rounded-full border border-primary/20 text-primary transition-colors hover:border-primary/50 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-25"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => showSlide(slide + 1)}
              disabled={slide === 1}
              aria-label="Next slide"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/35 px-4 text-[9px] uppercase tracking-[0.18em] text-primary transition-colors hover:border-primary/65 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-25"
            >
              {slide === 0 ? 'Explainer' : 'Next'} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

/** The Presentation card's two document actions, shared by both card layouts. */
function PresentationActions({ onView }: { onView: () => void }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        onClick={onView}
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

  const loadFeeItems = useMemo(
    () => LOAD_FEE_TITLES.map((t) => items.find((i) => i.title === t)).filter(Boolean) as Item[],
    [items],
  );
  const elevatorItems = useMemo(
    () => ELEVATOR_TITLES.map((t) => items.find((i) => i.title === t)).filter(Boolean) as Item[],
    [items],
  );

  /**
   * Cards per surface group. Anything the map does not recognise lands in
   * `more`, so a new rate-card line shows up on the page instead of silently
   * disappearing the way Zone Mapping did.
   */
  const grouped = useMemo(() => {
    const out: Record<GroupId, Item[]> = { room: [], arrival: [], private: [], production: [], more: [] };
    for (const item of items) {
      if (LOAD_FEE_TITLES.includes(item.title)) continue;
      if (ELEVATOR_TITLES.includes(item.title)) continue; // shown inside the elevator panel
      if (item.title === 'LED Screens Specific Zone Mapping') continue; // the selector below is the single source of truth
      out[GROUP_OF[item.title] ?? 'more'].push(item);
    }
    // Inside the main room, read up from what a buyout already covers: another
    // static logo, then the same mark with an alpha channel, then mapping to a
    // chosen zone, then a whole show built around a performer.
    const roomOrder = [
      'Static Logo',
      'Transparent Logo Animation',
      'Performing Artist — Mapped by Soleia Creative Team',
    ];
    out.room.sort((a, b) => {
      const ia = roomOrder.indexOf(a.title);
      const ib = roomOrder.indexOf(b.title);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return out;
  }, [items]);

  const blurbFor = (item: Item) =>
    BLURBS[item.title] || item.long_description || 'Details available on request.';

  const cardShell =
    'group card-elevated overflow-hidden rounded-3xl border border-primary/15 bg-card/40 surface-elevated transition-colors hover:border-primary/30';

  /** A card that fills its grid cell. `wide` spans both columns, image beside text. */
  const renderServiceCard = (item: Item, wide = false) => {
    const media = MEDIA[item.title];

    if (item.title === '3D Previz') {
      return (
        <Reveal key={item.id} className={wide ? 'md:col-span-2' : ''}>
          <article className={`${cardShell} flex h-full flex-col`}>
            <div className="relative aspect-[16/9] overflow-hidden bg-black">
              <video
                src={PREVIZ_MOVIE_URL}
                poster={PREVIZ_POSTER}
                className="h-full w-full object-cover"
                controls
                playsInline
                preload="none"
                aria-label="3D previz — a run through the Soleia venue model with a client's show on every screen"
              />
            </div>
            <div className="flex-1 p-7 sm:p-8">
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-primary">Price sheet service</span>
              <h4 className="mb-3 mt-3 font-display text-2xl leading-tight text-foreground">{item.title}</h4>
              <p className="text-[14.5px] leading-relaxed text-muted-foreground">{blurbFor(item)}</p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                A real previz · one minute through the room
              </p>
            </div>
          </article>
        </Reveal>
      );
    }

    if (item.title === 'Static Logo') {
      return (
        <LogoServiceExplainerCard key={item.id} item={item} kind="static" wide={wide} cardShell={cardShell} />
      );
    }

    if (item.title === 'Transparent Logo Animation') {
      return (
        <LogoServiceExplainerCard key={item.id} item={item} kind="animated" wide={wide} cardShell={cardShell} />
      );
    }

    if (wide) {
      return (
        <Reveal key={item.id} className="md:col-span-2">
          <article className={`${cardShell} grid h-full lg:grid-cols-[1.25fr_1fr]`}>
            {media && <MediaHeader src={media.src} alt={media.alt} aspect="min-h-[260px] lg:min-h-[300px]" />}
            <div className="self-center p-8 sm:p-9">
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-primary">Price sheet service</span>
              <h4 className="mb-3 mt-3 font-display text-2xl leading-tight text-foreground">{item.title}</h4>
              <p className="text-[14.5px] leading-relaxed text-muted-foreground">{blurbFor(item)}</p>
              {item.title === 'Presentation' && (
                <PresentationActions onView={() => navigate('/creative-guide/doc/presentation')} />
              )}
            </div>
          </article>
        </Reveal>
      );
    }

    return (
      <Reveal key={item.id}>
        <article className={`${cardShell} flex h-full flex-col`}>
          {media && <MediaHeader src={media.src} alt={media.alt} />}
          <div className="flex-1 p-7 sm:p-8">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-primary">Price sheet service</span>
            <h4 className="mb-3 mt-3 font-display text-2xl leading-tight text-foreground">{item.title}</h4>
            <p className="text-[14.5px] leading-relaxed text-muted-foreground">{blurbFor(item)}</p>
            {item.title === 'Presentation' && (
              <PresentationActions onView={() => navigate('/creative-guide/doc/presentation')} />
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

  /** Odd group out: the last card spans both columns so a row never half-empties. */
  const renderGroupCards = (group: Item[]) =>
    group.map((item, i) => renderServiceCard(item, group.length % 2 === 1 && i === group.length - 1));

  return (
    // Services is always presented dark. Scoping the `dark` class to this page
    // rather than flipping the global theme means the palette tokens resolve
    // dark here without changing the visitor's preference for other pages.
    <div className="cg-premium-services dark min-h-screen bg-background text-foreground">
      <CreativeGuideHeader transparentAtTop />

      {/* HERO — restored from the first approved concept: the venue plan leads
          and the service story starts with place, coverage and guest journey. */}
      <section id="top" className="relative min-h-screen overflow-hidden">
        <HeroVenueArtwork />
        <div className="container relative z-10 mx-auto flex min-h-screen max-w-7xl items-end px-6 pb-20 pt-32 sm:px-10 lg:items-center lg:px-14 lg:pb-16">
          <div className="max-w-2xl">
            <Reveal>
              <span className="text-[10px] uppercase tracking-[0.34em] text-primary">
                Soleia Las Vegas · Creative Services Guide
              </span>
            </Reveal>
            <Reveal delay={0.05} className="mt-5">
              <h1 className="font-display text-5xl leading-[0.96] text-foreground sm:text-6xl lg:text-7xl">
                Your venue.<br />
                Your screens.<br />
                <span className="text-gradient-gold">Your story.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1} className="mt-6">
                <p className="max-w-xl text-[15px] leading-relaxed text-white/70 sm:text-base">
                Explore the venue, understand exactly what is included with your buyout, and discover the
                creative services that can transform every guest touchpoint.
              </p>
            </Reveal>
            <Reveal delay={0.15} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#where"
                className="cg-glow-control group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary bg-primary px-6 text-[10.5px] uppercase tracking-[0.2em] text-primary-foreground hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Explore the venue
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href="#included"
                className="cg-glow-control inline-flex min-h-12 items-center justify-center rounded-full border border-primary/35 bg-card/60 px-6 text-[10.5px] uppercase tracking-[0.2em] text-foreground backdrop-blur hover:-translate-y-0.5 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Included &amp; available
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      <GuideSectionNav sections={SECTIONS} />

      <main className="mx-auto max-w-7xl px-5 pb-24 sm:px-10 lg:px-14">
        {/* ══ 01 · WHERE YOUR BRAND LIVES ══ */}
        <section id="where" className="scroll-mt-32 pt-20">
          <GuideSectionHead
            eyebrow="01 — The Room"
            title="Where your brand lives."
            lede="Soleia is one immersive LED environment, not a screen at the front of a room. Before anything else, here is every surface your content can land on — and what each one is actually for."
          />
          <VenueSurfaceExplorer />
        </section>

        {loading ? (
          <div className="py-24 text-center text-sm text-muted-foreground">Loading services…</div>
        ) : (
          <div className="flex flex-col">
            {/* ══ 02 · WHAT THE BUYOUT ALREADY INCLUDES ══ */}
            <section id="included" className="order-1 scroll-mt-32 pt-24">
              <GuideSectionHead
                eyebrow="02 — Included With Your Buyout"
                title="What you already have."
                lede="Every activation carries branding across the venue before any creative work is added. This is the baseline your event starts from."
              />

              <Reveal className="mb-6">
                <div className="grid grid-cols-2 border border-primary/15 md:grid-cols-4">
                  {BUYOUT_AT_A_GLANCE.map(([v, l], i) => (
                    <div
                      key={l}
                      className={`p-5 text-center ${i % 2 === 0 ? 'border-r border-primary/15' : ''} ${
                        i < 2 ? 'border-b border-primary/15 md:border-b-0' : ''
                      } ${i === 1 ? 'md:border-r' : ''} ${i === 2 ? 'md:border-r' : ''}`}
                    >
                      <div className="font-display text-2xl leading-none text-gradient-gold sm:text-3xl">{v}</div>
                      <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">{l}</div>
                    </div>
                  ))}
                </div>
              </Reveal>

              <div className="grid gap-6 md:grid-cols-2">
                {BUYOUT_INCLUSIONS.map((inc, i) => (
                  <Reveal key={inc.title} delay={i * 0.05}>
                    <article className={`${cardShell} h-full p-8`}>
                      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">{inc.sub}</span>
                      <h3 className="mb-3 mt-2.5 font-display text-2xl leading-tight text-foreground">{inc.title}</h3>
                      <p className="text-[14.5px] leading-relaxed text-muted-foreground">{inc.intro}</p>
                      <ul className="mt-4 space-y-2.5">
                        {inc.items.map((item) => (
                          <li key={item} className="relative pl-5 text-[14px] text-foreground">
                            <span className="absolute left-0 top-2 h-1.5 w-1.5 bg-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      {'surfaces' in inc && Array.isArray((inc as { surfaces?: string[] }).surfaces) && (
                        <div className="mt-5 border-t border-primary/15 pt-4">
                          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                            Your logos appear on
                          </span>
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {(inc as { surfaces: string[] }).surfaces.map((sn) => (
                              <a
                                key={sn}
                                href="#zones"
                                className="cg-glow-control rounded-full border border-primary/30 px-2.5 py-1 text-[11.5px] text-foreground transition-[border-color,background-color,color,box-shadow] duration-500 hover:border-primary/70 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_22px_hsl(var(--primary)/0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                {sn}
                              </a>
                            ))}
                          </div>
                          <a
                            href="#zones"
                            className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-primary transition-opacity hover:opacity-80"
                          >
                            Explore specific-zone mapping <ArrowRight className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                      <p className="mt-4 text-[12.5px] italic leading-relaxed text-muted-foreground/80">{inc.fine}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* ══ THE FULL CREATIVE PACKAGE (UPGRADE) ══ */}
            <section id="package" className="order-2 scroll-mt-32 pt-12">
              <GuideSectionHead
                eyebrow="02 — Soleia Creative Upgrade"
                title="Full creative support, handled."
                lede="Add the Creative Upgrade when you want Soleia to guide the visual approach, create the animation system and deliver everything ready for show night."
              />
              <Reveal>
                <div className="edge-gold relative rounded-3xl surface-elevated">
                  <div className="overflow-hidden rounded-3xl bg-card/60">
                    <div className="cg-editorial-cover relative aspect-[21/8] min-h-[250px] overflow-hidden border-b border-primary/15">
                      <img
                        src={IMG.packageMain}
                        alt="Full-venue custom look — sunburst, curves and booth running one design"
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" aria-hidden="true" />
                    </div>
                    <div className="flex max-w-4xl flex-col p-8 sm:p-11">
                      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
                        Soleia Creative Upgrade
                      </span>
                      <h3 className="mb-4 mt-3 font-display text-2xl leading-tight text-foreground sm:text-3xl">
                        From concept to approval, we take care of the visual workflow.
                      </h3>
                      <div className="space-y-4">
                        {CREATIVE_PACKAGE_SECTIONS.map((section, idx) => (
                          <div key={idx}>
                            {section.heading && (
                              <h4 className="mb-2 font-display text-base text-foreground">{section.heading}</h4>
                            )}
                            {section.body && (
                              <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-muted-foreground">
                                {section.body}
                              </p>
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
                  </div>
                </div>
              </Reveal>

              {/* What the package covers — one card, one sub-card per inclusion,
                  divided by hairlines so they read as parts of the same offer
                  rather than six things floating beside it. */}
              <Reveal className="mt-6">
                <article className={`${cardShell} overflow-hidden`}>
                  <div className="border-b border-primary/15 px-6 py-4 sm:px-8">
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                      What's included
                    </span>
                  </div>
                  <div className="grid gap-px bg-primary/15 sm:grid-cols-2 lg:grid-cols-3">
                    {PACKAGE_INCLUDES.map((inc, index) => (
                      <div key={inc.title} className="flex min-h-[230px] flex-col bg-card p-6 sm:p-7">
                        <span className="font-mono text-[9px] tracking-[0.24em] text-primary/70">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h4 className="mb-3 mt-8 font-display text-xl leading-tight text-foreground">
                          {inc.title}
                        </h4>
                        <p className="text-[13.5px] leading-relaxed text-muted-foreground">{inc.body}</p>
                        {inc.movie && (
                          <button
                            type="button"
                            onClick={() => setFullscreenVideo(inc.movie!)}
                            className="mt-auto inline-flex items-center gap-2 pt-6 text-left text-[9.5px] uppercase tracking-[0.19em] text-primary transition-opacity hover:opacity-75"
                          >
                            <Play className="h-3.5 w-3.5" /> View preview
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              </Reveal>
            </section>

            {/* ══ SPECIFIC ZONES + SERVICES, GROUPED BY SURFACE ══ */}
            <section id="add-ons" className="order-3 scroll-mt-32 pt-24">
              {/* Zone mapping is an optional price-sheet service. It appears
                  only after the buyout baseline and package are understood. */}
              <div id="zones" className="mb-16 scroll-mt-32">
                <Reveal className="mb-6">
                  <span className="block font-mono text-[11px] uppercase tracking-[0.34em] text-primary">
                    03 — LED Screens · Specific Zone Mapping
                  </span>
                  <h3 className="mt-3 font-display text-3xl leading-tight text-foreground sm:text-4xl">
                    Choose one focused part of the venue.
                  </h3>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                    After reviewing what your buyout already covers, select a zone only when you want coordinated
                    custom content on that focused group of screens.
                  </p>
                </Reveal>
                <Reveal>
                  <SpecificZoneSelector />
                </Reveal>
              </div>

              {GROUPS.map((g) => {
                const cards = grouped[g.id];
                const isArrival = g.id === 'arrival';
                const isPrivate = g.id === 'private';
                const isProduction = g.id === 'production';
                const isMore = g.id === 'more';
                if (!cards.length && !(isArrival && elevatorItems.length) && !isMore) return null;

                return (
                  <div key={g.id} className={isProduction || isMore ? 'mt-24 sm:mt-28 lg:mt-32' : ''}>
                    {g.id !== 'room' && !isProduction && !isMore && (
                      <GroupHead eyebrow={g.eyebrow} title={g.title} note={g.note} />
                    )}

                    {isArrival ? (
                      <div className="pt-4">
                        {/* Elevator Displays — the interior render with the display
                            close-up at its native 600 × 800 mapping */}
                        {elevatorItems.length > 0 && (
                          <Reveal>
                            <article className={`${cardShell} grid lg:grid-cols-[400px_1fr]`}>
                              <div className="relative min-h-[420px] overflow-hidden border-b border-primary/15 lg:min-h-[520px] lg:border-b-0 lg:border-r">
                                <img
                                  src={IMG.elevatorInterior}
                                  alt="Soleia elevator lobby at guest arrival"
                                  loading="lazy"
                                  className="absolute inset-0 h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex flex-col justify-center">
                                <div className="border-b border-primary/15 px-7 pb-5 pt-7 sm:px-9">
                                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                                    Price sheet services · 600 × 800 portrait
                                  </span>
                                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-4">
                                    <h4 className="font-display text-2xl leading-tight text-foreground sm:text-[1.7rem]">
                                      Elevator Displays
                                    </h4>
                                    <button
                                      onClick={() => navigate('/creative-guide/elevator')}
                                      className="tap-44 inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-[10.5px] uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/10"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      Specs &amp; Mapping
                                    </button>
                                  </div>
                                </div>
                                {elevatorItems.map((item, i) => (
                                  <div
                                    key={item.id}
                                    className={`px-7 py-6 sm:px-9 ${i > 0 ? 'border-t border-primary/15' : ''}`}
                                  >
                                    <h5 className="mb-2 font-display text-xl text-foreground">{item.title}</h5>
                                    <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                                      {blurbFor(item)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </article>
                          </Reveal>
                        )}

                        {cards.length > 0 && (
                          <div className="grid items-stretch gap-6 md:grid-cols-2">{renderGroupCards(cards)}</div>
                        )}
                      </div>
                    ) : isPrivate ? (
                      <div className="space-y-12 pt-4 lg:space-y-16">
                        <Reveal>
                          <article className={cardShell}>
                            <MediaHeader
                              src={TV_HERO_IMG}
                              alt="A cabana television carrying Soleia narrowcasting content"
                              aspect="aspect-[21/9]"
                            />
                            <div className="grid gap-3 p-7 sm:grid-cols-[minmax(180px,0.7fr)_2fr] sm:gap-11 sm:p-8">
                              <div>
                                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-primary">Price sheet service</span>
                                <h4 className="mt-3 font-display text-2xl leading-tight text-foreground">TV Displays / Narrowcasting</h4>
                                <button
                                  onClick={() => navigate('/creative-guide/tv')}
                                  className="tap-44 mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-[10.5px] uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/10"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Specs &amp; Mapping
                                </button>
                              </div>
                              <p className="text-[14.5px] leading-relaxed text-muted-foreground">{TV_BLURB}</p>
                            </div>
                          </article>
                        </Reveal>
                        {cards.length > 0 && (
                          <div className="grid items-stretch gap-6 md:grid-cols-2">{renderGroupCards(cards)}</div>
                        )}
                      </div>
                    ) : isMore ? (
                      <div className="space-y-12 lg:space-y-16">
                        <Reveal>
                          <article className={cardShell}>
                            <div className="aspect-[21/9] overflow-hidden bg-black">
                              <video
                                src={TICKER_LOOP_URL}
                                poster={TICKER_LOOP_POSTER}
                                className="h-full w-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="metadata"
                                aria-label="Soleia LED Marquee ticker loop"
                              />
                            </div>
                            <div className="grid gap-3 p-7 sm:grid-cols-[minmax(180px,0.7fr)_2fr] sm:gap-11 sm:p-8">
                              <div>
                                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-primary">Price sheet service</span>
                                <h4 className="mt-3 font-display text-2xl leading-tight text-foreground">LED Marquee</h4>
                                <button
                                  onClick={() => navigate('/creative-guide/ticker')}
                                  className="tap-44 mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-[10.5px] uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/10"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Specs &amp; Mapping
                                </button>
                              </div>
                              <p className="text-[14.5px] leading-relaxed text-muted-foreground">{BLURBS['LED Marquee']}</p>
                            </div>
                          </article>
                        </Reveal>
                        {cards.length > 0 && (
                          <div className="grid items-stretch gap-6 md:grid-cols-2">{renderGroupCards(cards)}</div>
                        )}
                      </div>
                    ) : (
                      <div className="grid items-stretch gap-6 md:grid-cols-2">{renderGroupCards(cards)}</div>
                    )}
                  </div>
                );
              })}
            </section>

            {/* ══ 06 · BRINGING YOUR OWN CONTENT ══ */}
            {loadFeeItems.length > 0 && (
              <section id="own-content" className="order-4 scroll-mt-32 pt-24">
                <GuideSectionHead
                  eyebrow="04 — Video Mapping & Load Fees"
                  title="Bringing your own content."
                  lede="Client-supplied animations, mapped and loaded into Soleia's playback system. Two paths, depending on who builds to spec."
                />
                <Reveal>
                  <article className={cardShell}>
                    <MediaHeader
                      src={IMG.mapping}
                      alt="Client brand content mapped wall-to-wall across the main-room curve LED"
                      aspect="aspect-[21/8]"
                    />
                    <div>
                      {loadFeeItems.map((item, i) => (
                        <div
                          key={item.id}
                          className={`grid gap-3 p-7 sm:grid-cols-[minmax(200px,0.9fr)_2fr_auto] sm:items-center sm:gap-7 sm:px-8 ${
                            i > 0 ? 'border-t border-primary/15' : ''
                          }`}
                        >
                          <h4 className="font-display text-xl leading-snug text-foreground">{item.title}</h4>
                          <p className="text-[14px] leading-relaxed text-muted-foreground">{blurbFor(item)}</p>
                          <Chip>Max 50 GB</Chip>
                        </div>
                      ))}
                      <button
                        onClick={() => navigate('/creative-guide/content-delivery')}
                        className="group/cd flex w-full flex-wrap items-center gap-x-5 gap-y-2 border-t border-primary/15 px-7 py-6 text-left transition-colors hover:bg-primary/5 sm:px-8"
                      >
                        <span className="font-display text-xl leading-snug text-foreground transition-colors group-hover/cd:text-primary">
                          Content Delivery Guide
                        </span>
                        <span className="min-w-[220px] flex-1 text-[14px] leading-relaxed text-muted-foreground">
                          Every screen's pixel resolution, the DXV3 workflow, the Pixelmap and the
                          After Effects project — everything your team needs to build to spec.
                        </span>
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10.5px] uppercase tracking-[0.18em] text-primary">
                          Open <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    </div>
                  </article>
                </Reveal>

              </section>
            )}

            {/* ══ 07 · WHAT HAPPENS NEXT ══ */}
            <section id="next" className="order-5 scroll-mt-32 pt-24">
              <GuideSectionHead
                eyebrow="05 — After This Call"
                title="What happens from here."
                lede="The schedule below counts forward from kickoff — a signed proposal and your brand assets both in hand — not backwards from your event date."
              />
              <Reveal>
                <article className={`${cardShell} p-8 sm:p-11`}>
                  <CreativeTimeline title="Kickoff to show day." />
                  <div className="mt-9 border-t border-primary/15 pt-7">
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={SERVICES_PDF_URL}
                        download="Soleia-Creative-Services.pdf"
                        className="tap-44 inline-flex items-center gap-2 rounded-full border border-border/70 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download Services PDF
                      </a>
                    </div>
                  </div>
                </article>
              </Reveal>
            </section>
          </div>
        )}
      </main>

      <CreativeGuideFooter />

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
            <video src={fullscreenVideo} className="max-h-full max-w-full" autoPlay loop muted controls playsInline />
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
