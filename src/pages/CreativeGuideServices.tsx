import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Maximize2, Eye, Download, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from '@/components/motion/Reveal';
import { Overlay } from '@/components/motion/Crossfade';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION_EASE } from '@/components/motion/motion';
import { CreativeGuideHeader } from '@/components/creative-guide/CreativeGuideHeader';
import { CreativeGuideFooter } from '@/components/creative-guide/CreativeGuideFooter';
import { GuideSectionHead } from '@/components/creative-guide/GuideSectionHead';
import { GuideSectionNav, type GuideSection } from '@/components/creative-guide/GuideSectionNav';
import { VenueSurfaceExplorer } from '@/components/creative-guide/VenueSurfaceExplorer';
import { SpecificZoneSelector } from '@/components/creative-guide/SpecificZoneSelector';
import { PixelMapGuide } from '@/components/creative-guide/PixelMapGuide';
import { TransparentLogoDemo } from '@/components/creative-guide/TransparentLogoDemo';
import { StaticLogoDemo } from '@/components/creative-guide/StaticLogoDemo';
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
// The page opens on the venue from above — nightclub, beachclub and the
// cabana rows in one render — and the same view sits in Meet the Venue. The
// main-room photograph that used to lead now covers the Creative Package.
const HERO_IMG = '/creative-guide/venue-layout-sunburst.jpg';
const MAIN_ROOM_IMG = '/creative-guide/services/hero-main-room.jpg';
const IMG = {
  packageMain: '/creative-guide/services/package-full-look.jpg',
  presentationKeynote: '/creative-guide/services/presentation-keynote.jpg',
  creativeDirection: '/creative-guide/services/creative-direction.jpg',
  onsitePlaybackConsole: '/creative-guide/services/onsite-playback-console.jpg',
  packageEvent: '/creative-guide/services/static-logo-event.jpg',
  packageTakeover: '/creative-guide/services/presentation-takeover.jpg',
  previz: '/creative-guide/services/previz-render.jpg',
  mapping: '/creative-guide/services/mapping-client-content.jpg',
  artist: '/creative-guide/services/artist-show.jpg',
  zones: '/creative-guide/services/zones-outdoor.jpg',
  staticLogo: '/creative-guide/services/static-logo-event.jpg',
  marquee: '/creative-guide/services/marquee-exterior.jpg',
  elevatorInterior: '/creative-guide/elevator/interior.jpg',
  elevatorDisplay: '/creative-guide/elevator/display-600x800.jpg',
  bungalow: '/creative-guide/venue-photos/soleia-bungalow-spa.jpg',
} as const;
const ELEVATOR_LOOP_URL = '/creative-guide/elevator/loop.mp4';

// TV / narrowcasting. The card shows the surface; the pixel map, the loop and
// the delivery spec live on /creative-guide/tv, the way the elevator's do.
const TV_HERO_IMG = '/creative-guide/tv/hero.jpg';
// The transparent-logo card is drawn in code (TransparentLogoDemo); tapping
// "See it on the wall" opens the full explainer clip.

// The static-logo example: a pass through the venue model with a client's mark
// held on the screens. It reads as a card of its own, not a still of one, so it
// runs the same way the transparent-logo card beside it does.
const STATIC_LOGO_LOOP_URL = '/creative-guide/services/static-logo-loop.mp4';

// A real previz render: a minute through the venue model with a client's show
// on every screen. It stays behind a poster and `preload="none"` — 12 MB has
// no business downloading itself on the page a packet link opens.
const PREVIZ_MOVIE_URL = '/creative-guide/services/previz-soleia.mp4';
const PREVIZ_POSTER = '/creative-guide/services/previz-soleia-poster.jpg';

// The mapping previz — the map itself running on the venue model — is the
// last step of PixelMapGuide, and the Package's mapping tile opens it.
const PIXELMAP_PREVIZ_MOVIE_URL = '/creative-guide/services/pixelmap-previz.mp4';

// Carried by the link, never printed: the guide is public and indexable, so
// the address should not be sitting there as text for a scraper to lift.
const CONTACT_MAILTO = 'mailto:luisdreamslv@gmail.com?subject=';
const CALL_HREF = CONTACT_MAILTO + encodeURIComponent('Soleia Creative — schedule my creative call');
const PROPOSAL_QUESTION_HREF = CONTACT_MAILTO + encodeURIComponent('Soleia Creative — a question about my proposal');

/** The rate-card title of the zone-mapping service; its card is the selector. */
const ZONE_MAPPING_TITLE = 'LED Screens Specific Zone Mapping';

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

/**
 * The page's spine — the owner's seven sections (2026-08-26), in their order:
 *
 *   01 Welcome        what the guide helps the client decide
 *   02 Meet the Venue condensed layout, the two worlds, explore the room
 *   03 Included       establish the buyout's value before any upgrade
 *   04 Enhance        the package, then every additional price-sheet service
 *   05 Production     assets, deadlines, production, QC, load-in
 *   06 Own Content    route technical teams to specs and downloads
 *   07 Next Step      review the proposal, or schedule the creative call
 *
 * A client reading alone from the pre-call packet gets the same walk the
 * creative team drives live on the call.
 */
const SECTIONS: GuideSection[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'venue', label: 'Venue' },
  { id: 'included', label: 'Included' },
  { id: 'enhance', label: 'Package' },
  { id: 'production', label: 'Production' },
  { id: 'own-content', label: 'Own Content' },
  { id: 'next', label: 'Next Step' },
];

/** What the walk is for, step by step — the Welcome section's map of the page. */
const WALK_TITLES: Record<string, string> = {
  venue: 'The venue',
  included: 'Included with your buyout',
  enhance: 'Soleia Creative Upgrade Package',
  production: 'How creative production works',
  'own-content': 'Providing your own content?',
  next: 'Next step',
};
const WALK_PURPOSE: Record<string, string> = {
  venue: 'The layout, the two worlds, and every surface your content can land on.',
  included: 'The branding every activation already carries — your starting point.',
  enhance: 'Full creative support, handled — and every additional price-sheet service.',
  production: 'Assets, deadlines, production, QC and load-in — what to expect.',
  'own-content': 'Specifications and downloads for your technical team.',
  next: 'Review your proposal, or schedule the creative call.',
};

/** The two worlds, and the private one between them. */
const VENUE_WORLDS = [
  {
    k: 'Indoor',
    title: 'The Nightclub',
    body: 'Club stage, Bar 1 & Bar 2, Mezzanine Levels 1 & 2, the Rotunda and the 800s — tiered tables from the 100s to the 700s around the dance floor, under the sunburst ceiling.',
  },
  {
    k: 'Open-air',
    title: 'Beachclub & Pool',
    body: 'Pool stage, day beds, the LV Strip Bar and Cabana Bar, with the vertical outdoor screens and the arch overlooking the Strip.',
  },
  {
    k: 'Private',
    title: 'Cabanas & Bungalows',
    body: '9 Bungalows and 15 Cabanas with private TV displays — ideal for VIP hosting, breakouts and branded suites.',
  },
];

/** Production, in the five words a client asks about. */
const PRODUCTION_STEPS: { title: string; body: string }[] = [
  {
    title: 'Assets',
    body: 'Logos in vector, fonts, palette, key artwork, brand guidelines — and any content you want on the screens. Production starts when these and a signed proposal are with us.',
  },
  {
    title: 'Deadlines',
    body: 'Fourteen days from kickoff to your first review cut; three days for one consolidated set of notes; one included revision round; final cut-off seven business days before the show.',
  },
  {
    title: 'Production',
    body: 'We study the brand, set the creative direction, then build the looks on the real venue geometry — every surface at its native resolution, in one 3840 × 2160 frame.',
  },
  {
    title: 'QC',
    body: 'Every file is checked on the actual pixel map, and with the package previewed in 3D on the venue model before load-in — pacing, brightness, coverage, placement.',
  },
  {
    title: 'Load-in',
    body: 'Content is loaded into the playback system, checked against the run of show, and operated by our team throughout the night.',
  },
];

/** Where a technical team goes next. */
const SPEC_LINKS: { kind: string; title: string; body: string; to: string; download?: string }[] = [
  {
    kind: 'Guide',
    title: 'Content Delivery Guide',
    body: "Every screen's pixel resolution, the DXV3 workflow, the Pixelmap and the After Effects project.",
    to: '/creative-guide/content-delivery',
  },
  {
    kind: 'Specs',
    title: 'TV Network',
    body: 'One 1920 × 1080 feed across the twenty-eight televisions — the pixel map, the loop and the delivery spec.',
    to: '/creative-guide/tv',
  },
  {
    kind: 'Specs',
    title: 'Elevator Display',
    body: 'The 600 × 800 portrait panel beside the doors — mapping, loop and delivery spec.',
    to: '/creative-guide/elevator',
  },
  {
    kind: 'Specs',
    title: 'LED Marquee',
    body: 'The street-facing sign — its resolution and how a static or animated graphic is scheduled into playback.',
    to: '/creative-guide/ticker',
  },
  {
    kind: 'PDF',
    title: 'Presentation Guide',
    body: 'Running your own decks, keynotes and reels on the room: signal, routing, playback coordination, testing.',
    to: PRESENTATION_GUIDE_PDF_URL,
    download: 'Soleia-Presentation-Guide.pdf',
  },
  {
    kind: 'PDF',
    title: 'Services',
    body: 'This guide as a document, for forwarding to whoever needs it.',
    to: SERVICES_PDF_URL,
    download: 'Soleia-Creative-Services.pdf',
  },
];

// Editorial blurbs keyed by exact template title. Each one is written to help
// a client actually understand what they're buying — what it lives on, what
// we deliver, and how they'll experience it in the room.
const BLURBS: Record<string, string> = {
  'Static Logo':
    "Your mark delivered on a transparent background, so it sits over the room rather than replacing it. The in-house visual animations and motion graphics from the club library keep running underneath — mixed in real time by the visual operator — so the room carries the night while your branding holds its place on the screens throughout, with no loop of your own to produce or approve. Your buyout includes ten static logos across the five main LED screens; this line item covers each one beyond that.",
  'Transparent Logo Animation':
    "A refined logo animation delivered with a true alpha channel, allowing it to sit cleanly over live content and environmental footage without blocking the screen. Your mark remains visible while the room continues to move underneath — ideal for branding moments that need to feel integrated, not interruptive. Tap the preview above to see how the transparency layer behaves on the wall.",
  'Mapped by Soleia Creative Team':
    "Mapping of client animations, max 50 GB. Revisions to content after delivery (new files, edits, or re-export) will incur additional fees.",
  'Mapped to Spec by Client':
    "Client maps content to spec and provides to Soleia (no edits needed by Soleia Creative Team), max 50 GB. Revisions after delivery will incur additional fees.",
  'Elevator Dynamic Animation':
    "A custom portrait-oriented animation for the elevator LED — the first branded surface guests see when they arrive. We design a short loop (typically 15–30 seconds) that plays continuously between rides, plus optional variants for arrival/departure states. Delivered mapped, tested, and running on show day. Available standalone, or alongside the Creative Package, whose inclusion is the elevator static logo.",
  'LED Screens Specific Zone Mapping':
    "Custom mapping to specific LED zones outside the main sunburst architecture — designed for moments that need to live on one focused surface instead of the whole room. Typically applied to the SR IMAG wall, SL IMAG wall, and the outdoor arch. Includes creative treatment, exact-resolution build-out, and onsite playback for the zones you select.",
  'Performing Artist — Mapped by Soleia Creative Team':
    "Show-facing visuals designed around a headlining performer or DJ — set graphics, transitions, drops, artist branding, and stage-cued moments — mapped across the IMAG walls, center panel, DJ booth strip, and stage curves. Built in coordination with the artist's team so the visuals belong to the performance, not just play behind it.",
  'Elevator Created by Client':
    "You deliver the finished elevator content built to our portrait spec, and we handle the rest: intake, QC on the actual elevator LED, mapping into the playback system, and onsite testing so it plays back correctly the day of the event.",
  'Elevator Static Logo':
    "A single static portrait logo built for the elevator LED's idle state — always-on brand presence between rides. Color-graded and sized for the exact panel, tested onsite before doors. Included with the Creative Package; also available standalone.",
  'Individual Cabana / Bungalow Logo':
    "Branded content assigned to a specific cabana or bungalow TV — each selected screen runs its own dedicated player feed instead of the shared network. Supported formats: still image PNG or video .MOV.",
  '3D Previz':
    "A full 3D preview of your content running on Soleia's real screens, rendered from our venue model. You review the actual visuals in the actual room before load-in — pacing, brightness, brand placement, coverage — and approve or request revisions. Included with the Creative Package; also available standalone.",
  'Presentation':
    "Onsite technical support for client-provided laptops or devices running PowerPoint decks, keynote videos, award reels, or live presentation content. Covers signal connection, screen routing to the correct LED zones, playback coordination with the show operator, and pre-event testing so your presentation lands correctly the moment you cue it.",
  'LED Marquee':
    "Soleia's exterior LED marquee — the street-facing sign guests see on approach — can carry your event's branding for the night. We build a marquee-formatted graphic (static or short animated loop) sized to the sign's exact resolution and schedule it into the venue's marquee playback so it runs during your event window. Great for arrivals, step-and-repeat moments, and social capture outside the venue. Available on request through the Soleia creative team — not billed on the rate card, coordinated directly per event.",
};

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
    body: 'We set the visual approach — how the room should feel on arrival, through the programme and late in the night — so nobody on your side has to art-direct fifteen screens.',
    src: IMG.packageMain,
    alt: 'Full-venue custom look — sunburst, curves and booth running one design',
  },
  {
    title: 'Custom animation',
    body: 'Original visuals designed and animated for every surface at once, from concept through final delivery. You approve; we build.',
    src: IMG.artist,
    alt: 'A custom look running live across the room during a performance',
  },
  {
    title: 'Pixel-perfect mapping',
    body: 'Every surface built at its own native resolution and placed in the frame. Nothing for your team to cut, resize or export.',
    src: R.curvesInterior,
    movie: PIXELMAP_PREVIZ_MOVIE_URL,
    alt: 'SR Curve at 2304 × 272 running alongside IMAG SR, each carrying its own slice of the frame',
  },
  {
    title: 'Elevator static logo',
    body: 'Your mark on the elevator display for arrival — the first branded surface a guest meets — sized to the panel, tested onsite and running before doors.',
    // The same interior the elevator's specs page leads with, so the surface
    // reads as one thing across the guide.
    src: IMG.elevatorInterior,
    alt: 'Soleia elevator interior — gold trim with the branded display beside the doors',
  },
  {
    title: '3D preview before the night',
    body: 'Your content on a model of the actual venue screens. Review and approve everything before load-in — pacing, brightness, coverage — from wherever you are.',
    src: PREVIZ_POSTER,
    movie: PREVIZ_MOVIE_URL,
    alt: 'A frame from a 3D previz — a client show running on the venue model',
  },
  {
    title: 'Onsite playback',
    body: 'Loaded, checked against the run of show and operated by our team throughout the night. You watch the room.',
    src: IMG.onsitePlaybackConsole,
    alt: 'The playback desk during a show — clip columns and slice list on the console, the artist look running on the screens above',
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
    src: IMG.onsitePlaybackConsole,
    alt: 'The playback desk during a show — clip columns and slice list on the console, the artist look running on the screens above',
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
    <div className={`relative overflow-hidden bg-black ${aspect}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="media-grade h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <div className="media-veil absolute inset-0" aria-hidden="true" />
    </div>
  );
}

/**
 * A block inside a section — the explorer, the mapping walk — set with the
 * same weight as a section head, minus the number, so it never reads as a
 * footnote to the card above it. Generous top margin on purpose.
 */
function SubHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <Reveal className="mb-8 mt-20">
      <span className="block font-mono text-[11px] uppercase tracking-[0.34em] text-primary">{eyebrow}</span>
      <h3 className="mt-3 font-display text-2xl leading-tight text-foreground sm:text-3xl lg:text-4xl">{title}</h3>
      <div className="mt-4 h-px w-16 bg-gradient-to-r from-primary to-transparent" />
      {lede && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{lede}</p>}
    </Reveal>
  );
}

/** Heading for one surface group inside Additional Options. */
function GroupHead({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return (
    <Reveal className="mb-8 mt-20 first:mt-0">
      <div className="border-b border-primary/15 pb-5">
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
  const closeVideo = useCallback(() => setFullscreenVideo(null), []);
  const reduceMotion = useReducedMotion();

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

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 92;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const cardShell =
    'group card-elevated overflow-hidden rounded-3xl border border-primary/15 bg-card/40 surface-elevated transition-colors hover:border-primary/30';

  /** A card that fills its grid cell. `wide` spans both columns, image beside text. */
  const renderServiceCard = (item: Item, wide = false) => {
    const media = MEDIA[item.title];

    // The zone-mapping service is its own interactive card: five zones, one
    // photograph each, the screens labelled — the client picks a zone by
    // looking at the room. It always spans the row.
    if (item.title === ZONE_MAPPING_TITLE) {
      return (
        <Reveal key={item.id} className="md:col-span-2">
          <div id="zones" className="scroll-mt-32">
            <SpecificZoneSelector description={blurbFor(item)} onFullscreen={(src) => setFullscreenVideo(src)} />
          </div>
        </Reveal>
      );
    }

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
            <TransparentLogoDemo onFullscreen={() => setFullscreenVideo(transparentLogoVideo.url)} />
            <div className="flex-1 p-7 sm:p-8">
              <h4 className="mb-3 font-display text-2xl leading-tight text-foreground">{item.title}</h4>
              <p className="text-[14.5px] leading-relaxed text-muted-foreground">{blurbFor(item)}</p>
            </div>
          </article>
        </Reveal>
      );
    }

    if (item.title === 'Static Logo') {
      return (
        <Reveal key={item.id} className={wide ? 'md:col-span-2' : ''}>
          <article className={`${cardShell} flex h-full flex-col`}>
            <StaticLogoDemo onFullscreen={() => setFullscreenVideo(STATIC_LOGO_LOOP_URL)} />
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

  /**
   * The zone card always spans the row. Of the rest, an odd last card spans
   * too, so a row never half-empties.
   */
  const renderGroupCards = (group: Item[]) => {
    const narrow = group.filter((i) => i.title !== ZONE_MAPPING_TITLE);
    const lastNarrow = narrow.length % 2 === 1 ? narrow[narrow.length - 1] : undefined;
    return group.map((item) => renderServiceCard(item, item === lastNarrow));
  };

  return (
    // Services is always presented dark. Scoping the `dark` class to this page
    // rather than flipping the global theme means the palette tokens resolve
    // dark here without changing the visitor's preference for other pages.
    <div className="dark min-h-screen bg-background text-foreground">
      <CreativeGuideHeader />

      {/* HERO — full-bleed venue photograph */}
      <section className="relative flex min-h-[82vh] items-end overflow-hidden">
        <motion.img
          src={HERO_IMG}
          alt="Soleia from above — the nightclub's sunburst, the beachclub pools and the cabana rows in one render"
          initial={reduceMotion ? false : { opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: MOTION_EASE }}
          className="media-grade absolute inset-0 h-full w-full object-cover object-[62%_50%]"
        />
        {/* The schema's colour over the photograph: a gold veil in soft light,
            then a warm multiply from the top so the LED whites read amber. */}
        <div className="media-veil absolute inset-0" aria-hidden="true" />
        <div
          className="absolute inset-0 mix-blend-multiply"
          style={{ background: 'linear-gradient(180deg, hsl(var(--primary) / 0.55) 0%, hsl(var(--primary) / 0.18) 45%, transparent 75%)' }}
          aria-hidden="true"
        />
        {/* Scrim resolves to the page background so the headline always sits on
            near-solid theme color — legible in light and dark alike. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-background" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative mx-auto w-full max-w-5xl px-6 pb-20 pt-40">
          <Reveal>
            <span className="font-mono text-[11px] uppercase tracking-[0.34em] text-primary">Soleia Creative Guide</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-5 max-w-3xl font-display text-4xl leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
              Your brand, <span className="text-gradient-gold">on every surface.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              How the room works, what your buyout already puts on its screens, and every way the
              Soleia creative team can take it further — in the order you'll decide it.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => goTo('welcome')}
                className="btn-glow tap-44 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/40 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-primary backdrop-blur-sm hover:bg-primary/10"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Start the guide
              </button>
              <a
                href={SERVICES_PDF_URL}
                download="Soleia-Creative-Services.pdf"
                className="btn-glow tap-44 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/40 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm hover:border-primary/40 hover:text-foreground"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <GuideSectionNav sections={SECTIONS} />

      <main className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        {/* ══ 01 · WELCOME ══ */}
        <section id="welcome" className="scroll-mt-32 pt-20">
          <GuideSectionHead
            eyebrow="01 — Welcome"
            title="What this guide helps you decide."
            lede="Soleia is one immersive LED environment, and your event already has a place on it. This guide walks what the room already does for your brand, what you can add, and how the work gets made — and hands your technical team what they need if they are building content themselves."
          />

          {/* The walk, as a list a client can hold in their head. */}
          <Reveal>
            <article className={`${cardShell} grid gap-px bg-primary/15 sm:grid-cols-2 lg:grid-cols-3`}>
              {SECTIONS.slice(1).map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(s.id)}
                  className="group/step flex items-start gap-4 bg-card p-7 text-left transition-colors duration-500 hover:bg-primary/5 sm:p-8"
                >
                  <span className="shrink-0 font-display text-2xl leading-8 text-primary">{String(i + 2).padStart(2, '0')}</span>
                  <span>
                    <span className="block font-display text-xl leading-tight text-foreground transition-colors duration-500 group-hover/step:text-primary sm:text-[1.35rem]">
                      {WALK_TITLES[s.id] ?? s.label}
                    </span>
                    <span className="mt-2 block text-[14px] leading-relaxed text-muted-foreground">{WALK_PURPOSE[s.id]}</span>
                  </span>
                </button>
              ))}
            </article>
          </Reveal>
        </section>

        {/* ══ 02 · THE VENUE ══ */}
        <section id="venue" className="scroll-mt-32 pt-24">
          <GuideSectionHead
            eyebrow="02 — The Venue"
            title="One venue, two worlds."
            lede="Indoors and out, here is every surface your content can land on — and what each one is actually for."
          />

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            {VENUE_WORLDS.map((w, i) => (
              <Reveal key={w.title} delay={i * 0.05}>
                <div className={`${cardShell} h-full p-7`}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">{w.k}</div>
                  <h3 className="mb-3 mt-2 font-display text-2xl text-foreground">{w.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-muted-foreground">{w.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mb-8">
            <article className="group card-elevated overflow-hidden rounded-3xl border border-primary/15 bg-black surface-elevated">
              <div className="relative aspect-[1737/905] bg-black">
                <img
                  src={HERO_IMG}
                  alt="Soleia from above — the nightclub's sunburst, the beachclub pools and the cabana rows"
                  loading="lazy"
                  className="media-grade absolute inset-0 h-full w-full object-contain"
                />
                <div className="media-veil absolute inset-0" aria-hidden="true" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/15 px-6 py-4 sm:px-8">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">The venue from above</span>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
                    The nightclub under its sunburst on the right, the beachclub pools and cabana rows on the left, the marquee wrapping the corner between.
                  </p>
                </div>
              </div>
            </article>
          </Reveal>

          <SubHead
            eyebrow="Explore the room"
            title="Every surface, photographed."
            lede="Real photographs with content on the screens. Choose an area, walk its views, and tap any photo to see it full size."
          />
          <VenueSurfaceExplorer />
        </section>

        {/* ══ 03 · INCLUDED WITH YOUR BUYOUT ══ */}
        <section id="included" className="scroll-mt-32 pt-24">
          <GuideSectionHead
            eyebrow="03 — Included With Your Buyout"
            title="What you already have."
            lede="Every activation carries branding across the venue before any creative work is added. This is the baseline your event starts from — read it first, and the upgrades below make sense."
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
                        {(inc as { surfaces: string[] }).surfaces.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => goTo('zones')}
                            aria-label={`${s} — see it in LED Screens: Specific Zone Mapping`}
                            className="btn-glow inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[11.5px] text-foreground hover:border-primary/60 hover:text-primary"
                          >
                            {s}
                            <ArrowRight className="h-3 w-3 text-primary" />
                          </button>
                        ))}
                      </div>
                      <p className="mt-2.5 text-[12px] text-muted-foreground/80">Tap a screen to see its zone mapped.</p>
                    </div>
                  )}
                  <p className="mt-5 text-[12.5px] italic leading-relaxed text-muted-foreground/80">{inc.fine}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══ 04 · SOLEIA CREATIVE UPGRADE PACKAGE ══ */}
        <section id="enhance" className="scroll-mt-32 pt-24">
          <GuideSectionHead
            eyebrow="04 — Soleia Creative Upgrade Package"
            title="Full creative support, handled."
            lede="Below the package, every additional price-sheet service, grouped by where in the venue it plays."
          />

          {/* The package: what it is, in a line; then what it includes, each
              with the thing it looks like. One card, so it reads as one offer. */}
          <Reveal>
            <article className="edge-gold group relative rounded-3xl surface-elevated">
              <div className="overflow-hidden rounded-3xl bg-card/60">
                <div className="relative aspect-[21/9] overflow-hidden bg-black sm:aspect-[21/7.5]">
                  <img
                    src={MAIN_ROOM_IMG}
                    alt="Soleia main room — sunburst LED ceiling over the dance floor"
                    loading="lazy"
                    className="media-grade absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]"
                  />
                  <div className="media-veil absolute inset-0" aria-hidden="true" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/55 to-transparent" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
                    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Full Package Upgrade</span>
                    <h3 className="mt-2.5 font-display text-2xl leading-tight text-foreground sm:text-3xl lg:text-4xl">
                      The Soleia Creative Package Upgrade
                    </h3>
                    <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground sm:text-[15px]">
                      Full creative direction and animation — we guide the visual approach from concept through
                      final delivery, so your team doesn't have to. It includes an elevator static logo for arrival
                      and a 3D preview of your content on a model of the actual venue screens, so you review and
                      approve everything before load-in.
                    </p>
                  </div>
                </div>

                <div className="grid gap-px bg-primary/15 sm:grid-cols-2 lg:grid-cols-3">
                  {PACKAGE_INCLUDES.map((inc, i) => (
                    <div key={inc.title} className="flex flex-col bg-card p-7 sm:p-8">
                      <span className="font-mono text-[11px] text-primary">{String(i + 1).padStart(2, '0')}</span>
                      <h4 className="mb-2.5 mt-3 font-display text-xl leading-tight text-foreground sm:text-[1.35rem]">{inc.title}</h4>
                      <p className="text-[14px] leading-relaxed text-muted-foreground">{inc.body}</p>
                      {inc.movie && (
                        <button
                          type="button"
                          onClick={() => setFullscreenVideo(inc.movie!)}
                          className="btn-glow tap-44 mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-[10.5px] uppercase tracking-[0.2em] text-primary hover:bg-primary/10"
                        >
                          <Play className="h-3 w-3" />
                          Watch
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </Reveal>

          {/* Every additional price-sheet service, by surface. */}
          <div id="add-ons" className="mt-10 scroll-mt-32">

            {loading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">Loading services…</div>
            ) : (
              GROUPS.map((g) => {
                const cards = grouped[g.id];
                const isArrival = g.id === 'arrival';
                if (!cards.length && !(isArrival && elevatorItems.length)) return null;

                return (
                  <div key={g.id} className={g.id === 'room' ? 'mt-6' : ''}>
                    {g.id !== 'room' && <GroupHead eyebrow={g.eyebrow} title={g.title} note={g.note} />}

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
                                  className="btn-glow tap-44 mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-[10.5px] uppercase tracking-[0.2em] text-primary hover:bg-primary/10"
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
                                      className="btn-glow tap-44 inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-[10.5px] uppercase tracking-[0.2em] text-primary hover:bg-primary/10"
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
                                  className="btn-glow tap-44 mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-[10.5px] uppercase tracking-[0.2em] text-primary hover:bg-primary/10"
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
              })
            )}
          </div>
        </section>

        {/* ══ 05 · HOW CREATIVE PRODUCTION WORKS ══ */}
        <section id="production" className="scroll-mt-32 pt-24">
          <GuideSectionHead
            eyebrow="05 — How Creative Production Works"
            title="From your assets to show night."
            lede="What we need from you, when we need it, and what happens to it between kickoff and doors — so nothing on the night is a surprise."
          />

          <Reveal className="mb-6">
            <article className={`${cardShell} grid gap-px bg-primary/15 sm:grid-cols-2 lg:grid-cols-5`}>
              {PRODUCTION_STEPS.map((s, i) => (
                <div key={s.title} className="flex flex-col bg-card p-6">
                  <span className="font-mono text-[11px] text-primary">{String(i + 1).padStart(2, '0')}</span>
                  <h4 className="mt-2 font-display text-xl leading-tight text-foreground">{s.title}</h4>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </article>
          </Reveal>

          <SubHead
            eyebrow="How mapping works"
            title="One map. Every surface."
            lede="Every screen is a different shape, and all of them live on one file. Eight short steps — the same five zones as the room, then where your logo lands, then the map running."
          />
          <PixelMapGuide />

          <Reveal className="mt-14">
            <article className={`${cardShell} p-8 sm:p-11`}>
              <CreativeTimeline title="Kickoff to show day." />
              <p className="mt-9 max-w-2xl border-t border-primary/15 pt-7 text-[14.5px] leading-relaxed text-muted-foreground">
                The schedule counts forward from kickoff — a signed proposal and your brand assets both in hand —
                not backwards from your event date. The earlier those arrive, the more of the fourteen-day window
                goes into the work rather than the wait.
              </p>
            </article>
          </Reveal>
        </section>

        {/* ══ 06 · PROVIDING YOUR OWN CONTENT? ══ */}
        <section id="own-content" className="scroll-mt-32 pt-24">
          <GuideSectionHead
            eyebrow="06 — Providing Your Own Content?"
            title="Build to spec. We load it and run it."
            lede="For agencies and in-house teams producing their own animations: the two ways content reaches the screens, and every specification and download your technical team will ask for."
          />

          <Reveal>
            <article className={cardShell}>
              <MediaHeader
                src={IMG.mapping}
                alt="Client brand content mapped wall-to-wall across the main-room curve LED"
                aspect="aspect-[21/8]"
              />
              <div>
                {loading ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">Loading services…</div>
                ) : (
                  loadFeeItems.map((item, i) => (
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
                  ))
                )}
              </div>
            </article>
          </Reveal>

          <Reveal className="mt-6">
            <article className={`${cardShell} grid gap-px bg-primary/15 sm:grid-cols-2 lg:grid-cols-3`}>
              {SPEC_LINKS.map((l) => {
                const inner = (
                  <>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">{l.kind}</span>
                    <span className="mt-2 block font-display text-xl leading-tight text-foreground transition-colors duration-500 group-hover/spec:text-primary">
                      {l.title}
                    </span>
                    <span className="mt-2 block flex-1 text-[13px] leading-relaxed text-muted-foreground">{l.body}</span>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-primary">
                      {l.download ? <Download className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                      {l.download ? 'Download' : 'Open'}
                    </span>
                  </>
                );
                const cls = 'group/spec flex h-full flex-col bg-card p-6 text-left transition-colors duration-500 hover:bg-primary/5';
                return l.download ? (
                  <a key={l.title} href={l.to} download={l.download} className={cls}>
                    {inner}
                  </a>
                ) : (
                  <button key={l.title} type="button" onClick={() => navigate(l.to)} className={cls}>
                    {inner}
                  </button>
                );
              })}
            </article>
          </Reveal>
        </section>

        {/* ══ 07 · NEXT STEP ══ */}
        <section id="next" className="scroll-mt-32 pt-24">
          <GuideSectionHead
            eyebrow="07 — Next Step"
            title="Review your proposal, or book the call."
            lede="Two ways forward, depending on where you are."
          />
          <div className="grid gap-6 md:grid-cols-2">
            <Reveal>
              <article className={`${cardShell} flex h-full flex-col p-8 sm:p-10`}>
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Have a proposal?</span>
                <h3 className="mb-3 mt-2.5 font-display text-2xl leading-tight text-foreground sm:text-3xl">
                  Review and sign it.
                </h3>
                <p className="flex-1 text-[14.5px] leading-relaxed text-muted-foreground">
                  Open your proposal from the link in your email. Tick the services you want, set the quantities,
                  and sign — what you select there is the scope we build. You can revisit it any time before
                  signing, and questions are welcome first.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a
                    href={PROPOSAL_QUESTION_HREF}
                    className="btn-glow tap-44 inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-primary hover:bg-primary/10"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Ask about my proposal
                  </a>
                </div>
              </article>
            </Reveal>
            <Reveal delay={0.05}>
              <article className="edge-gold relative flex h-full flex-col rounded-3xl surface-elevated">
                <div className="flex h-full flex-col rounded-3xl bg-card/60 p-8 sm:p-10">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Not yet?</span>
                  <h3 className="mb-3 mt-2.5 font-display text-2xl leading-tight text-foreground sm:text-3xl">
                    Schedule your creative call.
                  </h3>
                  <p className="flex-1 text-[14.5px] leading-relaxed text-muted-foreground">
                    Send us your event date. We book the call, walk this guide with you in the room, and follow
                    with a proposal built around what you choose. Bring your brand assets if you have them —
                    logos in vector, fonts, palette, key artwork — and the clock starts sooner.
                  </p>
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <a
                      href={CALL_HREF}
                      className="btn-glow tap-44 inline-flex items-center gap-2 rounded-full border border-primary bg-primary/15 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-primary hover:bg-primary/25"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Schedule the creative call
                    </a>
                    <a
                      href={SERVICES_PDF_URL}
                      download="Soleia-Creative-Services.pdf"
                      className="btn-glow tap-44 inline-flex items-center gap-2 rounded-full border border-border/70 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Services PDF
                    </a>
                  </div>
                </div>
              </article>
            </Reveal>
          </div>
        </section>
      </main>

      <CreativeGuideFooter />

      {/* Fullscreen video */}
      <Overlay open={!!fullscreenVideo} onClose={closeVideo} label="Video">
        {fullscreenVideo && (
          <video src={fullscreenVideo} className="max-h-[85vh] max-w-full" autoPlay loop muted controls playsInline />
        )}
        <button
          onClick={closeVideo}
          aria-label="Close"
          className="btn-glow tap-44 fixed right-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white hover:bg-white/10"
        >
          Close
        </button>
      </Overlay>
    </div>
  );
}
