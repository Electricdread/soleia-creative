import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from '@/components/motion/Reveal';
import solIcon from '@/assets/sol-icon.png';
import soleiaWideLogo from '@/assets/soleia-wide-logo.png';
import transparentLogoVideo from '@/assets/transparent_logo_explainer_1.mp4.asset.json';

// Real venue references (do not swap for stock)
const VENUE_PHOTO = '/venue-screens.png';
const PIXEL_MAP = '/SOLEIA-Pixel-Map.png';
const PREVIZ_VIDEO = '/venue/previz-vanderpump.mp4';

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

// Editorial blurbs keyed by exact template title.
const BLURBS: Record<string, string> = {
  'Immersive LED Environments & Branded Overlay Design':
    "The Soleia Creative Package: our team designs 1–3 custom looks that live across every venue LED — main room, beachclub, cabana & bungalow TVs, and elevators — plus a 3D previz so you can see your content on the screens before the doors open.",
  'Static Logo':
    "A high-resolution static brand mark, color-graded for LED and placed cleanly across the screens you specify. The simplest, most versatile brand presence in the venue.",
  'Transparent Logo Animation':
    "A transparent, alpha-channel logo animation designed to sit on top of Soleia's live visual environments — your brand breathes through the room without covering the show underneath.",
  'Mapped by Soleia Creative Team':
    "Our creative team maps your content — logos, animations, brand assets — pixel-perfect to every LED zone in the venue, calibrated in Resolume for flawless playback.",
  'Mapped to Spec by Client':
    "You deliver finished, pre-mapped content built to our published pixel maps. We handle load-in, QC, and onsite playback.",
  'Elevator Dynamic Animation':
    "Bespoke portrait animation designed for the elevator LED — up, down, and idle states — a small surface with a strong first impression.",
  'LED Screens Specific Zone Mapping':
    "Custom mapping to specific LED zones outside the main architecture — ideal when a moment needs to live on one screen, one wall, or one custom canvas.",
  'Performing Artist — Mapped by Soleia Creative Team':
    "Show-facing visuals designed and mapped around a performing artist — set graphics, transitions, stage looks — built with the artist's brand at the center.",
  'Elevator Created by Client':
    "You supply the elevator content following our brief and specs. We coordinate playback and onsite testing so it lands correctly on the portrait LED.",
  'Elevator Static Logo':
    "A single static portrait logo for the elevator's idle state — clean, elegant, always-on brand presence.",
  'Individual Cabana / Bungalow Logo':
    "Dedicated logo playback on a specific cabana or bungalow TV — each selected screen runs its own feed instead of the shared narrowcasting loop.",
  '3D Previz':
    "A 3D preview of your content running on the venue's real screens — reviewed and approved before load-in, so there are no surprises on show day.",
  'Client-Supplied Device Presentation Playback':
    "Support for client-provided laptops or devices used for PowerPoint presentations, awards, and other presentation content — including connection, playback coordination, screen routing, and onsite testing for proper display.",
};

// Real venue reference per line item (photo, pixel map, or video)
type Media = { kind: 'image' | 'video'; src: string };
const MEDIA: Record<string, Media> = {
  'Immersive LED Environments & Branded Overlay Design': { kind: 'image', src: VENUE_PHOTO },
  'Static Logo': { kind: 'image', src: VENUE_PHOTO },
  'Mapped by Soleia Creative Team': { kind: 'image', src: VENUE_PHOTO },
  'Mapped to Spec by Client': { kind: 'image', src: PIXEL_MAP },
  'Performing Artist — Mapped by Soleia Creative Team': { kind: 'image', src: VENUE_PHOTO },
  '3D Previz': { kind: 'video', src: PREVIZ_VIDEO },
};

// Zones highlighted by "LED Screens Specific Zone Mapping" — pulled from the real pixel map.
const HIGHLIGHT_ZONES = new Set(['SR IMAG', 'SL IMAG', 'OUTDOOR ARCH']);

// Real pixel-map segments (viewBox 3840×2160). Coordinates match /SOLEIA-Pixel-Map.png.
const PIXEL_SEGMENTS: { name: string; x: number; y: number; w: number; h: number; res: string }[] = [
  { name: 'SR IMAG', x: 0, y: 0, w: 1216, h: 592, res: '1216×592' },
  { name: 'CENTER', x: 1216, y: 0, w: 640, h: 272, res: '640×272' },
  { name: 'SL IMAG', x: 1856, y: 0, w: 1216, h: 592, res: '1216×592' },
  { name: 'DJ BOOTH', x: 906, y: 594, w: 1260, h: 168, res: '1260×168' },
  { name: 'SR CURVE', x: 0, y: 794, w: 2304, h: 272, res: '2304×272' },
  { name: 'SL CURVE', x: 0, y: 1066, w: 2304, h: 272, res: '2304×272' },
  { name: 'SUNRAY 1', x: 0, y: 1368, w: 1920, h: 128, res: '1920×128' },
  { name: 'SUNRAY 2', x: 0, y: 1496, w: 1536, h: 128, res: '1536×128' },
  { name: 'SUNRAY 3', x: 0, y: 1624, w: 1792, h: 128, res: '1792×128' },
  { name: 'SUNRAY 4', x: 0, y: 1752, w: 1792, h: 128, res: '1792×128' },
  { name: 'SUNRAY 5', x: 0, y: 1880, w: 1792, h: 128, res: '1792×128' },
  { name: 'SUNRAY 6', x: 0, y: 2008, w: 1536, h: 128, res: '1536×128' },
  { name: 'OUTDOOR SR', x: 2322, y: 793, w: 588, h: 840, res: '588×840' },
  { name: 'OUTDOOR SL', x: 2916, y: 793, w: 588, h: 840, res: '588×840' },
  { name: 'OUTDOOR ARCH', x: 2322, y: 1639, w: 1512, h: 504, res: '1512×504' },
];

// Zone descriptions for the LED Screens Specific Zone Mapping service.
const ZONE_MAPPING_ZONES = [
  {
    name: 'SR IMAG',
    res: '1216 × 592',
    detail:
      'Stage-right IMAG panel above the DJ booth. Landscape LED for artist-facing visuals, brand keys, and moment-specific graphics that frame the main room.',
  },
  {
    name: 'SL IMAG',
    res: '1216 × 592',
    detail:
      'Stage-left IMAG — mirror to SR. The pair frames the DJ booth and holds directional brand or performance content without interrupting the sunburst above.',
  },
  {
    name: 'Outdoor Arch',
    res: '1512 × 504',
    detail:
      'The exterior arched LED at the beachclub. First impression on arrival — logo animations, welcome loops, or moment-specific creative that greets guests outdoors.',
  },
];

function ZoneMappingDiagram() {
  return (
    <div className="relative w-full aspect-video bg-black overflow-hidden">
      <svg viewBox="0 0 3840 2160" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Base plate */}
        <rect x="0" y="0" width="3840" height="2160" fill="#0a0a0a" />
        {PIXEL_SEGMENTS.map((s) => {
          const highlighted = HIGHLIGHT_ZONES.has(s.name);
          return (
            <g key={s.name}>
              <rect
                x={s.x}
                y={s.y}
                width={s.w}
                height={s.h}
                fill={highlighted ? 'rgba(196,154,60,0.28)' : 'rgba(255,255,255,0.04)'}
                stroke={highlighted ? '#c49a3c' : 'rgba(255,255,255,0.18)'}
                strokeWidth={highlighted ? 6 : 2}
              />
              {highlighted && (
                <text
                  x={s.x + s.w / 2}
                  y={s.y + s.h / 2 + 14}
                  textAnchor="middle"
                  fill="#c49a3c"
                  fontFamily="ui-monospace, monospace"
                  fontSize={42}
                  letterSpacing="4"
                >
                  {s.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.28em] text-primary/80 font-mono">
        Soleia Pixel Map · Highlighted Zones
      </div>
    </div>
  );
}

const CATEGORY_ORDER = [
  'Soleia Creative Package',
  'Video Mapping & Load Fees',
  'Additional Options',
];

export default function CreativeGuideServices() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_rate_card_addons');
      const { data: pkg } = await supabase
        .from('line_item_templates')
        .select('id,title,price,category,ideal_for,long_description,deliverables,sort_order')
        .ilike('title', '%Immersive LED Environments%');
      const merged = [...(pkg || []), ...((data as Item[]) || [])];
      const seen = new Set<string>();
      const unique = merged.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
      setItems(unique);
      setLoading(false);
    })();
  }, []);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: items
      .filter((i) => (i.category || 'Additional Options') === cat)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 sm:px-8 py-4 glass border-b border-primary/15">
        <button onClick={() => navigate('/creative-guide')} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[11px] uppercase tracking-[0.2em]">Creative Guide</span>
        </button>
        <img src={solIcon} alt="Soleia" className="h-9 w-auto object-contain" />
        <div className="w-24" />
      </header>

      {/* HERO */}
      <section className="pt-36 pb-16 px-6 text-center max-w-4xl mx-auto">
        <Reveal>
          <span className="text-[11px] uppercase tracking-[0.34em] text-primary">Services</span>
        </Reveal>
        <Reveal delay={0.05} className="mt-5">
          <img src={soleiaWideLogo} alt="Soleia Las Vegas" className="h-10 sm:h-12 mx-auto object-contain" />
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl mt-8 leading-[1.05]">
            What we build, <span className="text-primary italic">explained.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-6 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            A plain-language breakdown of every line item on your Soleia proposal — what it is, what it lives on, and what you get. All visuals reference the actual Soleia Las Vegas venue and pixel map.
          </p>
        </Reveal>
      </section>

      {/* SERVICES */}
      <section className="px-5 sm:px-8 pb-32 max-w-5xl mx-auto">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Loading services…</div>
        ) : (
          grouped.map((group) => (
            <div key={group.category} className="mb-20">
              <Reveal className="mb-10">
                <span className="block text-[11px] uppercase tracking-[0.34em] text-primary mb-3">Category</span>
                <h2 className="font-display text-2xl sm:text-3xl text-foreground">{group.category}</h2>
                <div className="mt-4 h-px w-16 bg-primary/40" />
              </Reveal>

              <div className="space-y-8">
                {group.items.map((item) => {
                  const isTransparent = item.title === 'Transparent Logo Animation';
                  const isZoneMapping = item.title === 'LED Screens Specific Zone Mapping';
                  const media = MEDIA[item.title];
                  return (
                    <Reveal key={item.id}>
                      <article className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
                        {isTransparent ? (
                          <div
                            className="relative w-full aspect-video bg-black cursor-pointer group"
                            onClick={() => setFullscreenVideo(transparentLogoVideo.url)}
                          >
                            <video
                              src={transparentLogoVideo.url}
                              className="w-full h-full object-cover"
                              autoPlay
                              loop
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/90 text-xs uppercase tracking-[0.18em]">
                                <Maximize2 className="w-3.5 h-3.5" />
                                Tap for fullscreen
                              </div>
                            </div>
                          </div>
                        ) : isZoneMapping ? (
                          <ZoneMappingDiagram />
                        ) : media?.kind === 'video' ? (
                          <div
                            className="relative w-full aspect-video bg-black cursor-pointer group"
                            onClick={() => setFullscreenVideo(media.src)}
                          >
                            <video
                              src={media.src}
                              className="w-full h-full object-cover"
                              autoPlay
                              loop
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/90 text-xs uppercase tracking-[0.18em]">
                                <Maximize2 className="w-3.5 h-3.5" />
                                Tap for fullscreen
                              </div>
                            </div>
                          </div>
                        ) : media?.kind === 'image' ? (
                          <div
                            className="relative w-full aspect-video bg-black cursor-pointer group overflow-hidden"
                            onClick={() => setFullscreenImage(media.src)}
                          >
                            <img
                              src={media.src}
                              alt={item.title}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/90 text-xs uppercase tracking-[0.18em]">
                                <Maximize2 className="w-3.5 h-3.5" />
                                Tap for fullscreen
                              </div>
                            </div>
                          </div>
                        ) : null}

                        <div className="p-6 sm:p-8">
                          <h3 className="font-display text-xl sm:text-2xl text-foreground mb-3">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground text-[15px] leading-relaxed">
                            {BLURBS[item.title] || item.long_description || 'Details available on request.'}
                          </p>

                          {/* Zone breakdown for LED Screens Specific Zone Mapping */}
                          {isZoneMapping && (
                            <div className="mt-7 border-t border-border/60 pt-6">
                              <span className="text-[10px] uppercase tracking-[0.28em] text-primary">
                                Applicable Screen Zones
                              </span>
                              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                {ZONE_MAPPING_ZONES.map((z) => (
                                  <div
                                    key={z.name}
                                    className="rounded-xl border border-primary/20 bg-primary/5 p-4"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                                        <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-primary">
                                          {z.name}
                                        </span>
                                      </div>
                                      <span className="font-mono text-[10px] text-muted-foreground">
                                        {z.res}
                                      </span>
                                    </div>
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                      {z.detail}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.deliverables && item.deliverables.length > 0 && (
                            <ul className="mt-5 space-y-1.5">
                              {item.deliverables.map((d, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex gap-2">
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
                })}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Fullscreen video modal */}
      {fullscreenVideo && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setFullscreenVideo(null)}
        >
          <video
            src={fullscreenVideo}
            className="max-w-full max-h-full"
            autoPlay
            loop
            controls
            playsInline
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-5 right-5 text-white"
            onClick={() => setFullscreenVideo(null)}
          >
            Close
          </Button>
        </div>
      )}

      {/* Fullscreen image modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <img
            src={fullscreenImage}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-5 right-5 text-white"
            onClick={() => setFullscreenImage(null)}
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
