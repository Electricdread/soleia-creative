/**
 * The venue's LED and display surfaces — one source of truth.
 *
 * This list was previously copy-pasted into CreativeGuideView (where it had
 * become dead code) and VenueVideoMappingView. Both now read it from here, so
 * a resolution can never be right on one page and stale on another.
 *
 * Resolutions come from the venue pixel map (`/creative-guide/soleia-pixelmap.png`),
 * which is the same 3840 × 2160 layout the playback system and the After Effects
 * template are built against. `region` is that surface's rectangle inside the
 * map — the identical numbers RoomScene feeds its shader, so the guide and the
 * 3D room always agree about where a screen lives in the file.
 */

export type AreaId = 'overview' | 'main' | 'beachclub' | 'arrival' | 'tv';

/**
 * Venue renders with the pixel map itself on the screens — every surface shows
 * its own slice, labelled with its name and native resolution burned into the
 * render. They answer "where does my content go, and how big is that screen?"
 * in one picture, which no photograph of the room can do.
 */
const R = {
  mainInterior: '/creative-guide/pixelmap-renders/main-interior.jpg',
  mainInterior2: '/creative-guide/pixelmap-renders/main-interior-2.jpg',
  curvesInterior: '/creative-guide/pixelmap-renders/curves-interior.jpg',
  stageDjBooth: '/creative-guide/pixelmap-renders/stage-dj-booth.jpg',
  sunrays: '/creative-guide/pixelmap-renders/sunrays.jpg',
  outdoorArch: '/creative-guide/pixelmap-renders/outdoor-arch.jpg',
  outdoorScreens: '/creative-guide/pixelmap-renders/outdoor-screens.jpg',
  outdoorSrSl: '/creative-guide/pixelmap-renders/outdoor-sr-sl.jpg',
  outsidePortrait: '/creative-guide/pixelmap-renders/outside-portrait.jpg',
  beachclub: '/creative-guide/pixelmap-renders/beachclub.jpg',
  tvCabanas: '/creative-guide/pixelmap-renders/tv-cabanas.jpg',
} as const;

export const PIXELMAP_RENDERS = R;

export interface VenueSurface {
  /** Screen name as the crew and the specs call it. */
  name: string;
  /** Native resolution, formatted for display. */
  res: string;
  /** What this surface is for, in a sentence a client can picture. */
  role: string;
  area: AreaId;
  /** Rectangle within the 3840 × 2160 pixel map: [x, y, w, h]. */
  region?: [number, number, number, number];
  /** Grouped under one entry in the guide (the six ceiling rays, the TV network). */
  countNote?: string;
  /**
   * Carries one of the ten static logos every buyout includes, before any
   * creative work is added. Confirmed by the owner; do not infer this from a
   * screen's size or position.
   */
  logoIncluded?: boolean;
}

export const FRAME_W = 3840;
export const FRAME_H = 2160;

export const VENUE_SURFACES: VenueSurface[] = [
  // ── Main room · interior ────────────────────────────────────────────────
  {
    name: 'SR Curves',
    res: '2304 × 272',
    role: 'Stage-right curved LED — wraparound ambient visuals and brand washes.',
    area: 'main',
    region: [0, 794, 2304, 272],
  },
  {
    name: 'IMAG SR',
    logoIncluded: true,
    res: '1216 × 592',
    role: 'Stage-right vertical screen — directional branding and portrait content.',
    area: 'main',
    region: [0, 0, 1216, 592],
  },
  {
    name: 'Center',
    logoIncluded: true,
    res: '640 × 272',
    role: 'Center focal screen — logo reveals and hero moments.',
    area: 'main',
    region: [1216, 0, 640, 272],
  },
  {
    name: 'IMAG SL',
    logoIncluded: true,
    res: '1216 × 592',
    role: 'Stage-left vertical screen — directional branding and portrait content.',
    area: 'main',
    region: [1856, 0, 1216, 592],
  },
  {
    name: 'SL Curves',
    res: '2304 × 272',
    role: 'Stage-left curved LED — wraparound ambient visuals and brand washes.',
    area: 'main',
    region: [0, 1066, 2304, 272],
  },
  {
    name: 'DJ Booth',
    res: '1260 × 168',
    role: 'The booth face — carries the energy of the set out to the floor.',
    area: 'main',
    region: [906, 594, 1260, 168],
  },
  {
    name: 'Sol Rays',
    logoIncluded: true,
    res: '1920 × 128 – 1536 × 128',
    role: 'Six ceiling rays radiating from the sunburst — motion that fills the room overhead.',
    area: 'main',
    region: [0, 1368, 1920, 128],
    countNote: '6 rays',
  },

  // ── Beachclub · exterior ────────────────────────────────────────────────
  {
    name: 'Outdoor SR',
    logoIncluded: true,
    res: '588 × 840',
    role: 'Stage-right exterior tower — high-brightness arrival branding.',
    area: 'beachclub',
    region: [2322, 793, 588, 840],
  },
  {
    name: 'Outdoor SL',
    logoIncluded: true,
    res: '588 × 840',
    role: 'Stage-left exterior tower — high-brightness arrival branding.',
    area: 'beachclub',
    region: [2916, 793, 588, 840],
  },
  {
    name: 'Outdoor Arch',
    logoIncluded: true,
    res: '1512 × 504',
    role: 'Beachclub arch — the immersive entry moment overlooking the Strip.',
    area: 'beachclub',
    region: [2322, 1639, 1512, 504],
  },

  // ── Arrival ─────────────────────────────────────────────────────────────
  {
    name: 'Elevator Display',
    res: '600 × 800',
    role: 'Portrait LED beside the doors — the first branded surface a guest sees.',
    area: 'arrival',
  },
  {
    name: 'LED Marquee',
    res: 'Exterior · street-facing',
    role: "Soleia's marquee on approach — arrivals, step-and-repeat and social capture.",
    area: 'arrival',
  },

  // ── TV / narrowcasting ──────────────────────────────────────────────────
  {
    name: 'TV / Narrowcasting',
    res: '1920 × 1080 or 3840 × 2160',
    role: 'Front-door entry, cabanas and bungalows — logos and sponsor messaging.',
    area: 'tv',
    countNote: '28 screens',
  },
];

export interface VenueArea {
  id: AreaId;
  /** Tab label — short enough to read at a glance. */
  label: string;
  /** Section heading once the area is open. */
  title: string;
  /** One line a client can picture before they look at the image. */
  blurb: string;
  /** Photoreal venue render with the screens labelled inside the image. */
  image: string;
  imageAlt: string;
  /** Further views of the same area, browsable from the thumbnail strip. */
  gallery?: { src: string; alt: string }[];
  /** Looping video for this area, where one exists. */
  video?: string;
  videoPoster?: string;
}

/**
 * Photography of the real venue, area by area — the owner's own shots, not the
 * labelled pixel-map renders this section used to carry.
 *
 * The renders answered "how big is that screen?" and still do, in the mapping
 * section below and on the specs pages. The opening is now what the room
 * actually looks like with content on it, which is the question a client asks
 * first.
 */
const PHOTO = {
  theRoom: '/creative-guide/venue-photos/the-room.jpg',
  beachclubGoldenHour: '/creative-guide/venue-photos/beachclub-golden-hour.jpg',
  outdoorScreensLogo: '/creative-guide/venue-photos/outdoor-screens-logo.jpg',
  beachclubPoolArrival: '/creative-guide/venue-photos/beachclub-pool-arrival.jpg',
  poolDeckAerial: '/creative-guide/venue-photos/pool-deck-aerial.jpg',
  elevatorLobby: '/creative-guide/venue-photos/elevator-lobby.jpg',
  cabanasRow: '/creative-guide/venue-photos/cabanas-row.jpg',
  cabanaBar: '/creative-guide/venue-photos/cabana-bar.jpg',
  cabanaInterior: '/creative-guide/venue-photos/cabana-interior.jpg',
} as const;

export const VENUE_PHOTOS = PHOTO;

export const VENUE_AREAS: VenueArea[] = [
  {
    id: 'overview',
    label: 'Full Venue',
    title: 'The complete venue',
    blurb:
      'Start with the full layout: the nightclub, beachclub, arrival route, cabanas and bungalows all belong to one guest experience. The views that follow show where your brand can live within it.',
    image: '/creative-guide/venue-layout-original.png',
    imageAlt: 'Full Soleia venue layout showing the nightclub, beachclub, arrival route, cabanas and bungalows',
  },
  {
    id: 'main',
    label: 'Main Room',
    title: 'The nightclub',
    blurb:
      'Two curved walls wrap the floor, two IMAG screens face the crowd either side of the center panel, and six lit rays run overhead from the sunburst. Your content plays across all of it at once.',
    image: PHOTO.theRoom,
    imageAlt:
      'The Soleia main room at night — the six ceiling rays, both IMAG walls and the curves all carrying content over the floor',
  },
  {
    id: 'beachclub',
    label: 'Beachclub',
    title: 'Open-air, facing the Strip',
    blurb:
      'Two tall exterior towers flank the pool stage and the arch spans the entry. These are the screens the street sees, so they carry arrival branding at high brightness.',
    image: PHOTO.beachclubPoolArrival,
    imageAlt: 'The Soleia pool deck and cabana bar from the walkway, the exterior LED lit and the Strip skyline behind',
    gallery: [
      { src: PHOTO.beachclubGoldenHour, alt: 'The beachclub at golden hour, the exterior LED lit above the pool with the Strip beyond' },
      { src: PHOTO.outdoorScreensLogo, alt: 'The beachclub exterior LED carrying the Soleia mark beside the palms' },
      { src: PHOTO.poolDeckAerial, alt: 'The pool deck from above at dusk, the round bar and cabanas lit around the water' },
    ],
  },
  {
    id: 'arrival',
    label: 'Arrival',
    title: 'Before they reach the room',
    blurb:
      'The elevator display is the first branded surface a guest sees, and the exterior marquee is what they pass on the way in. Both can carry your event for the night.',
    image: PHOTO.elevatorLobby,
    imageAlt: 'The Soleia elevator lobby, lit red, the branded display beside the doors',
    gallery: [
      { src: '/creative-guide/elevator/interior.jpg', alt: 'Soleia elevator interior with the branded portrait display beside the doors' },
      { src: '/creative-guide/services/marquee-exterior.jpg', alt: 'Soleia exterior LED marquee carrying event branding at street level' },
    ],
  },
  {
    id: 'tv',
    label: 'Cabanas & Bungalows',
    title: 'Private hospitality displays',
    blurb:
      'Twenty-eight televisions across the venue run one shared feed by default. Any of them can be switched to its own dedicated content instead.',
    image: PHOTO.cabanasRow,
    imageAlt: 'A row of Soleia cabanas, each with its own television behind the curtains',
    gallery: [
      { src: PHOTO.cabanaBar, alt: 'The cabana bar, Soleia branding running on the screens behind it' },
    ],
  },
];

export const surfacesIn = (area: AreaId) => VENUE_SURFACES.filter((s) => s.area === area);

/**
 * Every rectangle inside the 3840 × 2160 pixel map, including the six ceiling
 * rays and the DJ booth individually.
 *
 * These are the same numbers RoomScene hands its shader as `uRegion`, and they
 * have been checked against `/creative-guide/soleia-pixelmap.png` — each box
 * lands exactly on its labelled block in the artwork. Anything drawn over that
 * image from this list is telling the truth about where a screen lives in the
 * file.
 */
export interface PixelMapRegion {
  /** Screen name as the pixel map itself labels it. */
  label: string;
  /** [x, y, w, h] in map pixels. */
  rect: [number, number, number, number];
  /** Grouping used for the map legend and its colour. */
  band: 'walls' | 'curves' | 'rays' | 'outdoor';
  /**
   * Carries one of the ten static logos every buyout includes. Owner-confirmed:
   * the two IMAG walls, the Center panel, all six Sol Rays and the three
   * beachclub exteriors. The curves and the DJ booth carry motion only.
   */
  logo?: boolean;
}

export const PIXEL_MAP_REGIONS: PixelMapRegion[] = [
  { label: 'IMAG SR', rect: [0, 0, 1216, 592], band: 'walls', logo: true },
  { label: 'Center', rect: [1216, 0, 640, 272], band: 'walls', logo: true },
  { label: 'IMAG SL', rect: [1856, 0, 1216, 592], band: 'walls', logo: true },
  { label: 'DJ Booth', rect: [906, 594, 1260, 168], band: 'walls' },
  { label: 'SR Curves', rect: [0, 794, 2304, 272], band: 'curves' },
  { label: 'SL Curves', rect: [0, 1066, 2304, 272], band: 'curves' },
  { label: 'Sunray 1', rect: [0, 1368, 1920, 128], band: 'rays', logo: true },
  { label: 'Sunray 2', rect: [0, 1496, 1536, 128], band: 'rays', logo: true },
  { label: 'Sunray 3', rect: [0, 1624, 1792, 128], band: 'rays', logo: true },
  { label: 'Sunray 4', rect: [0, 1752, 1792, 128], band: 'rays', logo: true },
  { label: 'Sunray 5', rect: [0, 1880, 1792, 128], band: 'rays', logo: true },
  { label: 'Sunray 6', rect: [0, 2008, 1536, 128], band: 'rays', logo: true },
  { label: 'Outdoor SR', rect: [2322, 793, 588, 840], band: 'outdoor', logo: true },
  { label: 'Outdoor SL', rect: [2916, 793, 588, 840], band: 'outdoor', logo: true },
  { label: 'Outdoor Arch', rect: [2322, 1639, 1512, 504], band: 'outdoor', logo: true },
];

export const PIXEL_MAP_BANDS: { id: PixelMapRegion['band']; label: string }[] = [
  { id: 'walls', label: 'Room walls & booth' },
  { id: 'curves', label: 'Curved LED' },
  { id: 'rays', label: 'Ceiling sun rays' },
  { id: 'outdoor', label: 'Beachclub exterior' },
];

/** Region as CSS percentages, ready to position over the pixel-map artwork. */
export function regionStyle([x, y, w, h]: PixelMapRegion['rect']) {
  return {
    left: `${(x / FRAME_W) * 100}%`,
    top: `${(y / FRAME_H) * 100}%`,
    width: `${(w / FRAME_W) * 100}%`,
    height: `${(h / FRAME_H) * 100}%`,
  };
}

/**
 * Grouped exactly as the specs pages present them. Kept as a derived view so
 * the underlying list stays the single place a resolution is edited.
 */
export const ZONE_GROUPS = [
  {
    group: 'Main Room — Interior LED',
    note: 'The primary nightclub LED wall, left to right.',
    zones: surfacesIn('main'),
  },
  {
    group: 'Beach Club — Exterior LED',
    note: 'Open-air screens facing the Las Vegas Strip.',
    zones: surfacesIn('beachclub'),
  },
  {
    group: 'TV Displays',
    note: 'Narrowcasting network across the venue.',
    zones: surfacesIn('tv'),
  },
];
