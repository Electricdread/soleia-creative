import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from '@/components/motion/Reveal';
import solIcon from '@/assets/sol-icon.png';
import soleiaWideLogo from '@/assets/soleia-wide-logo.png';
import transparentLogoVideo from '@/assets/transparent_logo_explainer_1.mp4.asset.json';


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
    "A single high-resolution static logo, color-graded and re-sized for LED so it reads cleanly on the venue's large-format displays. We place it on the screens you choose — main room, TVs, elevator, or a specific zone — and program it into the show file. The simplest way to put your brand in the room without commissioning motion content.",
  'Transparent Logo Animation':
    "A short-form logo animation delivered with a real alpha channel (transparent background), so your brand sits on top of Soleia's live environments instead of blocking them. The room keeps moving underneath — light, atmosphere, textures — and your logo breathes in and out over it. See the explainer above for exactly how the transparency layer behaves on the wall.",
  'Mapped by Soleia Creative Team':
    "You supply the raw assets — logos, animations, brand videos — and our team handles the technical work: reformatting for each LED zone's exact resolution, color-correcting for the panels, pixel-perfect mapping in Resolume, QC on venue hardware, and onsite playback. You focus on the creative; we make sure it lands correctly on every screen.",
  'Mapped to Spec by Client':
    "For teams delivering their own finished, pre-mapped content. You build to Soleia's published pixel maps (we send exact dimensions and specs per zone). We handle intake, technical QC, loading into the show system, and onsite playback. No creative work on our side — pure technical execution.",
  'Elevator Dynamic Animation':
    "A custom portrait-oriented animation for the elevator LED — the first branded surface guests see when they arrive. We design a short loop (typically 15–30 seconds) that plays continuously between rides, plus optional variants for arrival/departure states. Delivered mapped, tested, and running on show day.",
  'LED Screens Specific Zone Mapping':
    "Custom mapping to specific LED zones outside the main sunburst architecture — designed for moments that need to live on one focused surface instead of the whole room. Typically applied to the SR IMAG wall, SL IMAG wall, and the outdoor arch (see below). Includes creative treatment, exact-resolution build-out, and onsite playback for the zones you select.",
  'Performing Artist — Mapped by Soleia Creative Team':
    "Show-facing visuals designed around a headlining performer or DJ — set graphics, transitions, drops, artist branding, and stage-cued moments — mapped across the IMAG walls, center panel, DJ booth strip, and stage curves. Built in coordination with the artist's team so the visuals belong to the performance, not just play behind it.",
  'Elevator Created by Client':
    "You deliver the finished elevator content built to our portrait spec, and we handle the rest: intake, QC on the actual elevator LED, mapping into the playback system, and onsite testing so it plays back correctly the day of the event.",
  'Elevator Static Logo':
    "A single static portrait logo built for the elevator LED's idle state — always-on brand presence between rides. Color-graded and sized for the exact panel, tested onsite before doors.",
  'Individual Cabana / Bungalow Logo':
    "Dedicated logo playback on a specific cabana or bungalow TV — that screen gets its own feed instead of running the shared narrowcasting loop. Ideal for sponsor activations, private hosts, or VIP tables that need their own on-screen identity.",
  '3D Previz':
    "A full 3D preview of your content running on Soleia's real screens, rendered from our venue model. You review the actual visuals in the actual room before load-in — pacing, brightness, brand placement, coverage — and approve or request revisions. Included with the Creative Package; also available standalone.",
  'Client-Supplied Device Presentation Playback':
    "Onsite technical support for client-provided laptops or devices running PowerPoint decks, keynote videos, award reels, or live presentation content. Covers signal connection, screen routing to the correct LED zones, playback coordination with the show operator, and pre-event testing so your presentation lands correctly the moment you cue it.",
};

const CREATIVE_PACKAGE_SECTIONS: PackageSection[] = [
  {
    body: "Soleia is not a standard screen setup. The venue runs one of the more advanced LED layouts you'll find anywhere: the main-room IMAG walls, curves, and sunburst (sky ceiling panels); the outdoor arch (wide aspect ratio) and outdoor side panels (portrait aspect ratios); and carrying through the rest of the property, the cabana and bungalow TVs and the elevator displays — each surface a different shape, resolution, and position in the room. Content that isn't built for this layout shows it immediately. Content that is built for it turns the entire venue into one connected, immersive environment. That is exactly what this package covers, handled end to end by our team.",
  },
  {
    heading: 'Built by a Team Proven in Immersive Experiences',
    body: "Designing for an immersive room is a different discipline than making video for a screen. It takes understanding how the room actually works — how energy moves through the space, where guests' attention lands, and how each surface either builds that energy or breaks it. The content has to flow with the night: pacing that rises and settles with the room, moments of intensity balanced with moments of rest, every screen adding to the engagement instead of competing for it. That understanding is what our team brings — it's the difference between screens that play content and a room that carries a feeling. When you book the Full Creative Package, that load — creative, technical, and show-night — is ours to carry, not yours.",
  },
  {
    heading: 'What We Deliver',
    body: 'For your event, we design one to three custom looks: cinematic moving environments created specifically for your night and your brand, built to play across every LED surface in the venue in sync. Each look is composed for the actual layout — nothing stretched, cropped, or repurposed from a generic frame. The package includes the complete pipeline:',
    bullets: [
      'Creative direction. We work from your event\'s brief and brand to define the looks before animation begins.',
      'Custom animation. Each look is produced as broadcast-quality motion content, with branded overlays integrated into the environment.',
      'Pixel-perfect Resolume mapping. Every surface — the main-room IMAG walls, curves, and sunburst sky ceiling panels; the wide-aspect outdoor arch; the portrait outdoor side panels; the cabana and bungalow TVs; and the elevator displays — receives content mapped to its exact pixel dimensions and position.',
      '3D previz approval. Before load-in, you review the content on a 3D model of the actual venue screens.',
      'Onsite playback. Our operator runs the show the night of the event, managing playback and transitions from start to finish.',
    ],
  },
  {
    heading: 'Why It Matters',
    body: 'A room this connected only works when one team owns the whole picture. Splitting design, mapping, and playback across vendors is where immersive shows break. We deliver it as one package because that\'s how the result stays consistent. It\'s the part of the event we take the most pride in: guests walk into a space where everything flows, and it simply works.',
  },
  {
    body: 'Included: creative direction, one to three custom looks, pixel-perfect Resolume mapping to all LED surfaces, 3D previz approval, and onsite playback the night of the event. Contact the Soleia creative team with your event date to begin.',
  },
];


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
  

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_rate_card_addons');
      const pkg: Item = {
        id: 'pkg-immersive',
        title: 'The Full Soleia Creative Package',
        price: 3000,
        category: 'Soleia Creative Package',
        ideal_for: null,
        long_description: null,
        deliverables: null,
        sort_order: 0,
      };
      setItems([pkg, ...((data as Item[]) || [])]);
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
            Soleia Creative Team Services
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
                  return (
                    <Reveal key={item.id}>
                      <article className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
                        {isTransparent && (
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
                        )}

                        <div className="p-6 sm:p-8">
                          <h3 className="font-display text-xl sm:text-2xl text-foreground mb-3">
                            {item.title}
                          </h3>
                          {item.title === 'The Full Soleia Creative Package' ? (
                            <div className="space-y-5">
                              {CREATIVE_PACKAGE_SECTIONS.map((section, idx) => (
                                <div key={idx}>
                                  {section.heading && (
                                    <h4 className="font-display text-base text-foreground mb-2">
                                      {section.heading}
                                    </h4>
                                  )}
                                  <p className="text-muted-foreground text-[15px] leading-relaxed">
                                    {section.body}
                                  </p>
                                  {section.bullets && section.bullets.length > 0 && (
                                    <ul className="mt-4 space-y-2">
                                      {section.bullets.map((bullet, bIdx) => (
                                        <li key={bIdx} className="text-[15px] text-muted-foreground flex gap-3">
                                          <span className="text-primary flex-shrink-0">—</span>
                                          <span>{bullet}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-[15px] leading-relaxed whitespace-pre-wrap">
                              {BLURBS[item.title] || item.long_description || 'Details available on request.'}
                            </p>
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

    </div>
  );
}
