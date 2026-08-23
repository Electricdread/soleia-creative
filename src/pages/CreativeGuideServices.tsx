import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Maximize2, Eye, Download, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from '@/components/motion/Reveal';
import { CreativeGuideHeader } from '@/components/creative-guide/CreativeGuideHeader';
import { CreativeGuideFooter } from '@/components/creative-guide/CreativeGuideFooter';
import { GuideSectionHead } from '@/components/creative-guide/GuideSectionHead';
import { GuideSectionNav, type GuideSection } from '@/components/creative-guide/GuideSectionNav';
import { VenueSurfaceExplorer } from '@/components/creative-guide/VenueSurfaceExplorer';
import { PixelMapFold } from '@/components/creative-guide/PixelMapFold';
import { CreativeTimeline } from '@/components/creative/CreativeTimeline';
import { PIXELMAP_RENDERS as R, VENUE_PHOTOS } from '@/lib/venueSurfaces';
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
  presentation: '/creative-guide/services/presentation-takeover.jpg',
  marquee: '/creative-guide/services/marquee-exterior.jpg',
  elevatorInterior: '/creative-guide/elevator/interior.jpg',
  elevatorDisplay: '/creative-guide/elevator/display-600x800.jpg',
  bungalow: '/creative-guide/venue-photos/soleia-bungalow-spa.jpg',
} as const;
const ELEVATOR_LOOP_URL = '/creative-guide/elevator/loop.mp4';

// TV / narrowcasting. The card shows the surface; the pixel map, the loop and
// the delivery spec live on /creative-guide/tv, the way the elevator's do.
const TV_HERO_IMG = '/creative-guide/tv/hero.jpg';
// The logo animation itself (background-examples segment of the explainer),
// trimmed for a clean loop. Tapping the card opens the full explainer.
const TRANSPARENT_LOOP_URL = '/creative-guide/services/transparent-logo-loop.mp4';

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
const PIXELMAP_PREVIZ_POSTER = '/creative-guide/services/pixelmap-previz-poster.jpg';

// Carried by the link, never printed: the guide is public and indexable, so
// the address should not be sitting there as text for a scraper to lift.
const CONTACT_HREF =
  'mailto:luisdreamslv@gmail.com?subject=' +
  encodeURIComponent('Soleia Creative — event enquiry');

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
 * then what their buyout already covers in it, then how content reaches every
 * surface, then the upgrade, then what else can be added, then what happens
 * after the call. A client reading alone from the pre-call packet gets the same
 * walk, in the same order.
 */
const SECTIONS: GuideSection[] = [
  { id: 'where', label: 'The Room' },
  { id: 'included', label: 'Included' },
  { id: 'mapping', label: 'Mapping' },
  { id: 'package', label: 'Package' },
  { id: 'add-ons', label: 'Add-Ons' },
  { id: 'own-content', label: 'Own Content' },
  { id: 'next', label: "What's Next" },
];

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
    body: "We handle everything from concept to show night, so the entire experience feels seamless, intentional, and fully immersive.\n\nContact the Soleia Creative Team with your event date to get started.",
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
 * What the Creative Package covers, each with the thing it actually looks like.
 *
 * These are the package's own inclusion bullets — they used to sit as text
 * inside the card, where "pixel-perfect mapping across all LED surfaces" asked
 * a client to imagine something they have never seen. Every one now carries the
 * image or loop it refers to.
 */
const PACKAGE_INCLUDES: {
  title: string;
  body: string;
  /** Always a still. A tile shows its thumbnail even when it has a movie. */
  src: string;
  alt: string;
  /** Present means the tile plays: click the thumbnail, it opens full screen. */
  movie?: string;
}[] = [
  {
    title: 'Creative direction',
    body: 'We read your brand — guidelines, palette, past events — and set how the room should feel on arrival, through the programme and late in the night.',
    src: IMG.packageEvent,
    alt: 'Event branding running across the main-room screens',
  },
  {
    title: '1–3 custom looks',
    body: 'Original visuals designed for the whole venue at once, so every surface belongs to the same idea rather than running its own loop.',
    src: IMG.artist,
    alt: 'A custom look running live across the room during a performance',
  },
  {
    title: 'Pixel-perfect mapping',
    body: 'Every surface built at its own native resolution and placed in the 3840 × 2160 frame — the walls, the curves, the ceiling rays and the beachclub exteriors.',
    src: R.curvesInterior,
    movie: PIXELMAP_PREVIZ_MOVIE_URL,
    alt: 'SR Curve at 2304 × 272 running alongside IMAG SR, each carrying its own slice of the frame',
  },
  {
    title: 'Dynamic elevator animation',
    body: 'The first branded surface a guest meets. Its custom animation is part of the upgrade — designed with the rest of the look, mapped to the panel and running on show day.',
    // The same interior the elevator's specs page leads with, so the surface
    // reads as one thing across the guide. A still: the loop plays on the
    // elevator's own card further down, and twice on one page is once too many.
    src: IMG.elevatorInterior,
    alt: 'Soleia elevator interior — gold trim with the branded display beside the doors',
  },
  {
    title: '3D preview before the night',
    body: "Your content rendered on Soleia's real screens from our venue model, so you approve what the room will actually show — pacing, brightness, coverage — before load-in.",
    src: PREVIZ_POSTER,
    movie: PREVIZ_MOVIE_URL,
    alt: 'A frame from a 3D previz — a client show running on the venue model',
  },
  {
    title: 'Onsite playback',
    body: 'Loaded, checked against the run of show, and operated by our team throughout the night.',
    src: IMG.packageMain,
    alt: 'The full-venue look running across the sunburst, curves and booth on the night',
  },
];

const ELEVATOR_TITLES = [
  'Elevator Dynamic Animation',
  'Elevator Static Logo',
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
    eyebrow: 'In the main room',
    title: 'On the walls, the curves and the ceiling',
    note: 'Everything that plays across the nightclub surfaces the whole room can see.',
  },
  {
    id: 'arrival',
    eyebrow: 'On arrival',
    title: 'Before they reach the room',
    note: 'The entry televisions, the elevator display and the street-facing marquee — the first branded surfaces of the night. The same TV canvas carries the bungalow and cabana screens outside.',
  },
  {
    id: 'private',
    eyebrow: 'Private displays',
    title: 'Cabanas and bungalows',
    note: 'Individual screens switched off the shared feed and onto their own content.',
  },
  {
    id: 'production',
    eyebrow: 'Before and on the night',
    title: 'Review it early, run it right',
    note: 'Approving the work before load-in, and technical support on your own devices during the event.',
  },
  {
    id: 'more',
    eyebrow: 'Also available',
    title: 'Further options',
    note: 'Additional services on the current rate card.',
  },
];

// Per-service media: the image that ties a service to the real venue.
const MEDIA: Record<string, { src: string; alt: string }> = {
  'LED Screens Specific Zone Mapping': {
    src: R.outdoorArch,
    alt: 'The Outdoor Arch alone, labelled at its native 1512 × 504',
  },
  'Performing Artist — Mapped by Soleia Creative Team': {
    src: R.stageDjBooth,
    alt: 'IMAG SR, the Center panel, IMAG SL and the DJ booth face, each labelled at its native resolution',
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
    src: IMG.presentation,
    alt: 'Client content routed across the sunburst rays and room screens',
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
    <div className={`relative overflow-hidden bg-black ${aspect}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
    </div>
  );
}

/** Heading for one surface group inside Additional Options. */
function GroupHead({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return (
    <Reveal className="mb-6 mt-16 first:mt-0">
      <div className="border-b border-primary/15 pb-4">
        <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-primary">{eyebrow}</span>
        <h3 className="mt-2 font-display text-2xl leading-tight text-foreground">{title}</h3>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{note}</p>
      </div>
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
      out[GROUP_OF[item.title] ?? 'more'].push(item);
    }
    // Inside the main room, read up from what a buyout already covers: another
    // static logo, then the same mark with an alpha channel, then mapping to a
    // chosen zone, then a whole show built around a performer.
    const roomOrder = [
      'Static Logo',
      'Transparent Logo Animation',
      'LED Screens Specific Zone Mapping',
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
              <h4 className="mb-3 font-display text-2xl leading-tight text-foreground">{item.title}</h4>
              <p className="text-[14.5px] leading-relaxed text-muted-foreground">{blurbFor(item)}</p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                A real previz · one minute through the room
              </p>
            </div>
          </article>
        </Reveal>
      );
    }

    if (item.title === 'Transparent Logo Animation') {
      return (
        <Reveal key={item.id} className={wide ? 'md:col-span-2' : ''}>
          <article className={`${cardShell} flex h-full flex-col`}>
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-xs uppercase tracking-[0.18em]">
                  <Maximize2 className="h-3.5 w-3.5" />
                  Tap for fullscreen
                </div>
              </div>
            </div>
            <div className="flex-1 p-7 sm:p-8">
              <h4 className="mb-3 font-display text-2xl leading-tight text-foreground">{item.title}</h4>
              <p className="text-[14.5px] leading-relaxed text-muted-foreground">{blurbFor(item)}</p>
            </div>
          </article>
        </Reveal>
      );
    }

    if (wide) {
      return (
        <Reveal key={item.id} className="md:col-span-2">
          <article className={`${cardShell} grid h-full lg:grid-cols-[1.25fr_1fr]`}>
            {media && <MediaHeader src={media.src} alt={media.alt} aspect="min-h-[260px] lg:min-h-[300px]" />}
            <div className="self-center p-8 sm:p-9">
              <h4 className="mb-3 font-display text-2xl leading-tight text-foreground">{item.title}</h4>
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
            <h4 className="mb-3 font-display text-2xl leading-tight text-foreground">{item.title}</h4>
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
    <div className="dark min-h-screen bg-background text-foreground">
      <CreativeGuideHeader />

      {/* HERO — full-bleed venue photograph */}
      <section className="relative flex min-h-[82vh] items-end overflow-hidden">
        <img
          src={HERO_IMG}
          alt="Soleia main room — sunburst LED ceiling over the dance floor"
          className="absolute inset-0 h-full w-full object-cover"
        />
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
              Custom content, pixel-perfect mapping and show-night playback for Soleia's LED
              environment — designed and run by the Soleia creative team.
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

      <GuideSectionNav sections={SECTIONS} />

      <main className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
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
          <>
            {/* ══ 02 · WHAT THE BUYOUT ALREADY INCLUDES ══ */}
            <section id="included" className="scroll-mt-32 pt-24">
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
                              <span
                                key={sn}
                                className="rounded-full border border-primary/30 px-2.5 py-1 text-[11.5px] text-foreground"
                              >
                                {sn}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => document.getElementById('where')?.scrollIntoView({ behavior: 'smooth' })}
                            className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-primary transition-opacity hover:opacity-80"
                          >
                            See them in the room <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      <p className="mt-4 text-[12.5px] italic leading-relaxed text-muted-foreground/80">{inc.fine}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* ══ 03 · HOW MAPPING WORKS ══ */}
            <section id="mapping" className="scroll-mt-32 pt-24">
              <GuideSectionHead
                eyebrow="03 — How Mapping Works"
                title="One map. Every surface."
                lede="Every screen in the venue is a different shape and resolution, and all of them live on one file. This is the part that makes the rest of the page make sense."
              />
              <PixelMapFold />

              {/* The same idea, moving: the map itself across every surface at
                  once. Behind a poster and preload="none" — 9 MB has no
                  business downloading itself on the page a packet link opens. */}
              <Reveal className="mt-6">
                <article className={cardShell}>
                  <div className="aspect-video overflow-hidden bg-black">
                    <video
                      src={PIXELMAP_PREVIZ_MOVIE_URL}
                      poster={PIXELMAP_PREVIZ_POSTER}
                      className="h-full w-full object-cover"
                      controls
                      playsInline
                      preload="none"
                      aria-label="Mapping previz — the pixel map running across every surface in the Soleia venue model"
                    />
                  </div>
                  <div className="grid gap-3 p-7 sm:grid-cols-[minmax(180px,0.7fr)_2fr] sm:gap-11 sm:p-8">
                    <h4 className="font-display text-2xl leading-tight text-foreground">The map, running</h4>
                    <p className="text-[14.5px] leading-relaxed text-muted-foreground">
                      The map itself, running on the venue model — every screen carrying its own labelled slice
                      of the same 3840 × 2160 frame. The walls take their rectangles, the Sol Rays fan across the
                      ceiling, the beachclub exteriors take theirs, all from one file.
                    </p>
                  </div>
                </article>
              </Reveal>
            </section>

            {/* ══ 04 · THE FULL CREATIVE PACKAGE (UPGRADE) ══ */}
            <section id="package" className="scroll-mt-32 pt-24">
              <GuideSectionHead
                eyebrow="04 — Soleia Creative Package Upgrade"
                title="The room, designed as one canvas."
                lede="The upgrade on top of your buyout: original content designed for every surface at once, previewed in 3D before load-in, and operated live on the night."
              />
              <Reveal>
                <div className="edge-gold relative rounded-3xl surface-elevated">
                  <div className="grid overflow-hidden rounded-3xl bg-card/60 lg:grid-cols-2">
                    <div className="flex flex-col p-8 sm:p-11">
                      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
                        Full Package Upgrade
                      </span>
                      <h3 className="mb-4 mt-3 font-display text-2xl leading-tight text-foreground sm:text-3xl">
                        The Soleia Creative Package Upgrade
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
                    <div className="grid grid-rows-[1fr_auto] border-t border-primary/15 lg:border-l lg:border-t-0">
                      <div className="relative min-h-[260px] overflow-hidden">
                        <img
                          src={IMG.packageMain}
                          alt="Full-venue custom look — sunburst, curves and booth running one design"
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                      <div className="grid grid-cols-3 border-t border-primary/15">
                        {[
                          {
                            src: IMG.packageEvent,
                            cap: 'Event branding',
                            alt: 'Corporate event with branded stage visuals',
                          },
                          {
                            src: IMG.packageTakeover,
                            cap: 'Brand takeover',
                            alt: 'Sponsor takeover across the sunburst rays',
                          },
                          {
                            src: IMG.previz,
                            cap: '3D previz',
                            alt: '3D previsualization of content in the venue model',
                          },
                        ].map((f, i) => (
                          <figure key={f.cap} className={`relative m-0 ${i < 2 ? 'border-r border-primary/15' : ''}`}>
                            <img src={f.src} alt={f.alt} loading="lazy" className="aspect-[16/10] w-full object-cover" />
                          </figure>
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
                    {PACKAGE_INCLUDES.map((inc) => {
                      const playable = !!inc.movie;
                      const Media = (
                        <div className="relative aspect-[16/10] overflow-hidden bg-black">
                          <img
                            src={inc.src}
                            alt={inc.alt}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover/tile:scale-[1.03]"
                          />
                          {playable && (
                            <>
                              <span className="pointer-events-none absolute inset-0 bg-black/10 transition-colors group-hover/tile:bg-black/0" />
                              <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-background/85 px-3 py-1.5 text-[9.5px] uppercase tracking-[0.18em] text-foreground backdrop-blur-sm">
                                <Play className="h-3 w-3 text-primary" />
                                Play
                              </span>
                            </>
                          )}
                        </div>
                      );
                      return (
                        <div key={inc.title} className="group/tile flex flex-col bg-card">
                          {playable ? (
                            <button
                              type="button"
                              onClick={() => setFullscreenVideo(inc.movie!)}
                              aria-label={`Play — ${inc.title}`}
                              className="block w-full cursor-pointer text-left"
                            >
                              {Media}
                            </button>
                          ) : (
                            Media
                          )}
                          <div className="flex-1 p-6">
                            <h4 className="mb-2 font-display text-xl leading-tight text-foreground">
                              {inc.title}
                            </h4>
                            <p className="text-[13.5px] leading-relaxed text-muted-foreground">{inc.body}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              </Reveal>
            </section>

            {/* ══ 05 · ADD-ONS, GROUPED BY SURFACE ══ */}
            <section id="add-ons" className="scroll-mt-32 pt-24">
              <GuideSectionHead
                eyebrow="05 — Additional Options"
                title="Built for the surface it lives on."
                lede="Each option below is grouped by where in the venue it plays, so you can picture it in the room before you price it."
              />

              {GROUPS.map((g) => {
                const cards = grouped[g.id];
                const isArrival = g.id === 'arrival';
                if (!cards.length && !(isArrival && elevatorItems.length)) return null;

                return (
                  <div key={g.id}>
                    <GroupHead eyebrow={g.eyebrow} title={g.title} note={g.note} />

                    {isArrival ? (
                      <div className="space-y-6">
                        {/* TV / Narrowcasting — the surface and a brief; the pixel
                            map, the loop and the spec are on its own page. */}
                        <Reveal>
                          <article className={cardShell}>
                            <MediaHeader
                              src={TV_HERO_IMG}
                              alt="A cabana television running the Soleia TV Guide card, the beachclub beyond the opening"
                              aspect="aspect-[21/9]"
                            />
                            <div className="grid gap-3 p-7 sm:grid-cols-[minmax(180px,0.7fr)_2fr] sm:gap-11 sm:p-8">
                              <div>
                                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                                  1920 × 1080 · Landscape
                                </span>
                                <h4 className="mt-2 font-display text-2xl leading-tight text-foreground">
                                  TV Displays / Narrowcasting
                                </h4>
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

                        {/* Elevator Displays — the interior render with the display
                            close-up at its native 600 × 800 mapping */}
                        {elevatorItems.length > 0 && (
                          <Reveal>
                            <article className={`${cardShell} grid lg:grid-cols-[400px_1fr]`}>
                              <div className="relative min-h-[420px] overflow-hidden border-b border-primary/15 lg:min-h-[520px] lg:border-b-0 lg:border-r">
                                <img
                                  src={IMG.elevatorInterior}
                                  alt="Soleia elevator interior — gold trim with the branded display beside the doors"
                                  loading="lazy"
                                  className="absolute inset-0 h-full w-full object-cover"
                                />
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
                                </div>
                              </div>
                              <div className="flex flex-col justify-center">
                                <div className="border-b border-primary/15 px-7 pb-5 pt-7 sm:px-9">
                                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                                    600 × 800 · Portrait
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

                        {/* LED Marquee — exterior closer. Not a rate-card line item;
                            coordinated per event, so it isn't loaded from the DB. */}
                        <Reveal>
                          <article className={cardShell}>
                            <MediaHeader
                              src={IMG.marquee}
                              alt="Exterior LED marquee carrying event branding at street level"
                              aspect="aspect-[21/9]"
                            />
                            <div className="grid gap-3 p-7 sm:grid-cols-[minmax(180px,0.7fr)_2fr] sm:gap-11 sm:p-8">
                              <div>
                                <h4 className="font-display text-2xl leading-tight text-foreground">LED Marquee</h4>
                                <button
                                  onClick={() => navigate('/creative-guide/ticker')}
                                  className="tap-44 mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-[10.5px] uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/10"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Specs &amp; Mapping
                                </button>
                              </div>
                              <p className="text-[14.5px] leading-relaxed text-muted-foreground">
                                {BLURBS['LED Marquee']}
                              </p>
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
              <section id="own-content" className="scroll-mt-32 pt-24">
                <GuideSectionHead
                  eyebrow="06 — Video Mapping & Load Fees"
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
            <section id="next" className="scroll-mt-32 pt-24">
              <GuideSectionHead
                eyebrow="07 — After This Call"
                title="What happens from here."
                lede="The schedule below counts forward from kickoff — a signed proposal and your brand assets both in hand — not backwards from your event date."
              />
              <Reveal>
                <article className={`${cardShell} p-8 sm:p-11`}>
                  <CreativeTimeline title="Kickoff to show day." />
                  <div className="mt-9 border-t border-primary/15 pt-7">
                    <p className="max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
                      To get started, send the Soleia Creative Team your event date and your brand
                      assets — logos in vector, fonts, palette, key artwork and any guidelines. The
                      earlier those arrive, the more of the fourteen-day window goes into the work
                      rather than the wait.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <a
                        href={CONTACT_HREF}
                        className="tap-44 inline-flex items-center gap-2 rounded-full border border-primary bg-primary/15 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/25"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Contact
                      </a>
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
          </>
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
