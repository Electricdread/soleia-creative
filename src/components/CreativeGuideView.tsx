import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Compass, Maximize2, Printer, Download, FileVideo, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PoweredByShowBlox } from '@/components/PoweredByShowBlox';
import { InteractiveVenueMap } from '@/components/creative-guide/InteractiveVenueMap';
import { ALL_LED_ZONES } from '@/lib/creativeGuide';
import soleiaWideLogo from '@/assets/soleia-wide-logo.png';
import solIcon from '@/assets/sol-icon.png';

const TOUR_360_URL = 'https://360virtualtour.invisionstudio.com/tours/sVpoz23SHC-';
const RESOLUME_URL = 'https://resolume.com';
const RESOLUME_ALLEY_URL = 'https://resolume.com/software/alley';
const AE_PROJECT_URL = 'https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/creative-guide-template/CREATIVE_GUIDE_June2026_Soleia.zip';
const PIXELMAP_URL = '/creative-guide/soleia-pixelmap.png';

const CONTENT_DELIVERY = [
  { title: 'After Effects Project', desc: 'Pre-built AE template mapped to every screen — drop in your content and render.', cta: 'Download .zip', href: AE_PROJECT_URL, icon: FileVideo, download: true },
  { title: 'Pixelmap', desc: 'Master pixel map of the full venue display layout.', cta: 'Download .png', href: PIXELMAP_URL, icon: Download, download: true },
  { title: 'Resolume Alley', desc: 'Free encoder to convert your renders to the required DXV3 codec.', cta: 'resolume.com', href: RESOLUME_ALLEY_URL, icon: ExternalLink, download: false },
];

// Content Delivery Guide — DXV3 for Resolume media servers
const DELIVERY_STEPS = [
  { n: '1', t: 'Prepare your video', d: 'Export your final video from After Effects, Premiere, or your editing tool in ProRes 422 or high-quality H.264.' },
  { n: '2', t: 'Download Resolume Alley (free)', d: 'Our venue runs on Resolume media servers, which require DXV3-encoded files. Download the free encoder.' },
  { n: '3', t: 'Encode to DXV3', d: 'Open your video in Resolume Alley and encode using the DXV3 codec. For content with transparency, select “DXV3 Alpha.”' },
  { n: '4', t: 'Check specs', d: 'TV Displays: 1920×1080 or 3840×2160 · MOV · DXV3 · Max 8GB.  LED Pixel Map: 3840×2160 · MOV w/ Alpha · DXV3 · 60fps · Max 30GB.' },
  { n: '5', t: 'Submit content', d: 'Submit your encoded files at least 21 business days before your event so we can test and approve playback.' },
];

const DELIVERY_SPECS = [
  { type: 'Television Displays', res: '1920×1080 or 3840×2160', format: 'MOV', codec: 'DXV3', fps: '—' },
  { type: 'LED Pixel Map', res: '3840×2160', format: 'MOV with Alpha', codec: 'DXV3', fps: '60 fps' },
];

const NAV_LINKS = [
  { href: '#venue', label: 'Venue' },
  { href: '#layout', label: 'Layout' },
  { href: '#tour', label: '360° Tour' },
  { href: '#branding', label: 'Branding' },
  { href: '#specs', label: 'Specs' },
];

const STATS = [
  { v: '60,000', l: 'Sq ft rooftop venue' },
  { v: '300–4,000', l: 'Guests per buyout' },
  { v: '5,000', l: 'Sq ft digital realm' },
  { v: '20+', l: 'Television screens' },
];

const SPEC_LIST = [
  ['1,785 sq ft', 'LED Lighting System'],
  ['4 Massive Bars', 'with 4 Service Bars'],
  ['2 full', 'Gourmet Kitchens'],
  ['2 DJ Booths', "with a customizable 30'x20' Concert Stage"],
];

const LAYOUT_STATS = [
  ['15', 'Cabanas'],
  ['9', 'Bungalows'],
  ['2', 'Mezzanine Levels'],
  ['30+', 'Display Zones'],
];

const WORLDS = [
  {
    k: 'Indoor',
    title: 'The Nightclub',
    body: 'Club stage, Bar 1 & Bar 2, Mezzanine Levels 1 & 2, the Rotunda and the 800s — tiered tables from the 100s to the 700s around the dance floor.',
  },
  {
    k: 'Open-air',
    title: 'Beachclub & Pool',
    body: 'Pool stage, day beds, the LV Strip Bar and Cabana Bar, with a large outdoor LED screen overlooking the Strip.',
  },
  {
    k: 'Private',
    title: 'Cabanas & Bungalows',
    body: '9 Bungalows and 15 Cabanas with private TV displays — ideal for VIP hosting, breakouts and branded suites.',
  },
];

const INCLUSIONS = [
  {
    sub: 'Included',
    title: 'LED Screens',
    intro: 'Already included in your agreement with Soleia is the inclusion of 10 Static Logos to be displayed on 5 Main LED Screens:',
    items: ['2 Large Horizontal, Nightclub', '2 Large Vertical, Beachclub / Outside', '1 Beachclub Arch, Beachclub / Stage'],
    fine: 'All other LED screens will be activated, and display in-house visual animations and motion graphics from the club library (mixed in real-time, by visual operator).',
  },
  {
    sub: 'Included · Pricing on request',
    title: 'TV Screens / Narrowcasting',
    intro: '1 Static Logo to be displayed on TV Screens / Narrowcasting:',
    items: ['4 Front Door Entry, Casino Level', '9 Bungalows, Beachclub / Outside', '15 Cabanas, Beachclub / Outside'],
    fine: 'All TVs are connected displaying the same content feed; individual player feed setup is required per TV for different content (e.g. different client logos per cabana / bungalow). Pricing provided upon request.',
  },
];

const STEPS = [
  { n: '01', t: 'Static Logos', d: "Your logos displayed across the 5 main LED screens and the venue's TV / narrowcasting network from the moment doors open." },
  { n: '02', t: 'Custom Animations', d: "Bespoke motion graphics that resonate with your brand ethos — can be quoted upon delivery of the client's assets." },
  { n: '03', t: 'Pixelmap Mapping', d: 'Content mapped to the precise dimensions of every screen so your visuals shine in the best light, venue-wide.' },
];

const VIDEO_SPECS: { k: string; v: React.ReactNode }[] = [
  { k: 'Media Server', v: 'Resolume (MediaServer)' },
  { k: 'Resolution', v: '3840 × 2160' },
  { k: 'Format', v: '.MOV' },
  {
    k: 'Preferred Codec',
    v: (
      <>
        DXV3 — details at{' '}
        <a href={RESOLUME_URL} target="_blank" rel="noopener noreferrer" className="text-primary border-b border-primary/30">
          resolume.com
        </a>
      </>
    ),
  },
  { k: 'Lead Time', v: '21 Business Days prior to event' },
  { k: 'Creative Spec', v: 'Latest Pixelmap specifications & After Effects template provided following your Creative Call' },
];

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <Reveal className="mb-11">
      <span className="block text-[11px] uppercase tracking-[0.34em] text-primary mb-3.5">{eyebrow}</span>
      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight">{title}</h2>
    </Reveal>
  );
}

const CreativeGuideView = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header
        className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 sm:px-8 transition-all duration-400 ${
          scrolled ? 'py-3 glass border-b border-primary/15' : 'py-5 border-b border-transparent'
        }`}
      >
        <a href="#top" className="flex items-center" aria-label="Soleia">
          <img src={solIcon} alt="Soleia" className="h-9 sm:h-10 w-auto object-contain" />
        </a>
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-background/97 backdrop-blur-sm flex flex-col items-center justify-center gap-6 lg:hidden">
          <Button variant="ghost" size="icon" className="absolute top-5 right-5" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X className="w-7 h-7 text-primary" />
          </Button>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-display text-2xl text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* HERO */}
      <section id="top" className="min-h-[92vh] flex flex-col items-center justify-center text-center px-6 pt-32 pb-20">
        <Reveal>
          <span className="text-[11px] uppercase tracking-[0.34em] text-primary">Corporate Events & Venue Buyouts</span>
        </Reveal>
        <Reveal delay={0.05} className="mt-6">
          <img
            src={soleiaWideLogo}
            alt="Soleia Las Vegas"
            className="w-full max-w-[280px] sm:max-w-md lg:max-w-xl mx-auto h-auto"
          />
        </Reveal>
        <Reveal delay={0.1} className="mt-6">
          <span className="text-[11px] uppercase tracking-[0.34em] text-muted-foreground/70">Creative Guide</span>
        </Reveal>
        <Reveal delay={0.15} className="mt-10">
          <a href="#tour" className="inline-block px-8 py-3.5 text-[11px] uppercase tracking-[0.22em] border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
            Take the 360° tour
          </a>
        </Reveal>
      </section>

      {/* 01 — DIGITAL REALM */}
      <section id="venue" className="py-24 scroll-mt-20">
        <div className="container mx-auto max-w-5xl px-6">
          <SectionHead eyebrow="01 — The Digital Realm" title="Your brand, in its best light." />
          <Reveal className="space-y-4">
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              Dive into Soleia's digital realm, which sprawls over 5,000 square feet, boasting high-definition LED displays and an array of over 20 television screens.
            </p>
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              This digital canvas offers unparalleled branding opportunities, positioning Soleia as the perfect backdrop to spotlight sponsors, showcase your brand logo, broadcast videos, or amplify the goals of your event.
            </p>
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              Your event package comes with a unique perk: the inclusion of your logos across our screens and televisions. This preparatory process begins one hour before your event during our “Load-In” phase.
            </p>
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              To truly harness the power of these screens and immerse your audience in your brand's narrative, it's crucial to tailor content to the precise screen dimensions. Recognizing that this can be technically demanding, Soleia provides expertise to bridge any creative gaps and create custom content for your event — whether it's adapting your existing visuals or crafting bespoke animations that resonate with your brand ethos.
            </p>
          </Reveal>

          <Reveal className="mt-14">
            <h3 className="font-display text-2xl text-foreground mb-6">Rooftop venue specifications</h3>
            <div className="grid gap-14 lg:grid-cols-2 items-start">
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-medium">Square feet:</span> 60,000 &nbsp;·&nbsp; Group buyouts available from 300–4,000 guests.
                </p>
                <ul className="mt-6 space-y-3.5">
                  {SPEC_LIST.map(([b, rest]) => (
                    <li key={b} className="relative pl-6 text-[15px] text-foreground">
                      <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-primary" />
                      <span className="font-medium">{b}</span> {rest}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Soleia, conveniently located at the fifty yard line of the Las Vegas Strip, offers unrivaled views and exceptional service with state of the art technology perfect for custom branding. Soleia is built upon the fundamental principles of sophistication, innovation, and authenticity. Designed and operated by lifetime industry professionals from the most revered venues in the world, Soleia redefines the corporate event experience. Every aspect is curated to deliver unparalleled service and entertainment.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* STATS */}
      <div className="container mx-auto max-w-5xl px-6">
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 border-y border-primary/15">
            {STATS.map((s, i) => (
              <div key={s.l} className={`p-9 text-center ${i < STATS.length - 1 ? 'md:border-r border-primary/15' : ''} ${i % 2 === 0 ? 'border-r border-primary/15 md:border-r' : ''} ${i < 2 ? 'border-b border-primary/15 md:border-b-0' : ''}`}>
                <div className="font-display text-3xl sm:text-4xl text-gradient-gold leading-none">{s.v}</div>
                <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">{s.l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* VENUE LAYOUT */}
      <section id="layout" className="py-24 scroll-mt-20">
        <div className="container mx-auto max-w-5xl px-6">
          <SectionHead eyebrow="02 — Venue Layout" title="One venue, two worlds." />

          <Reveal className="mb-6">
            <InteractiveVenueMap />
          </Reveal>

          <Reveal delay={0.05} className="mb-10">
            <div className="grid grid-cols-2 md:grid-cols-4 border border-primary/15">
              {LAYOUT_STATS.map(([v, l], i) => (
                <div key={l} className={`p-5 text-center ${i % 2 === 0 ? 'border-r border-primary/15' : ''} ${i < 2 ? 'border-b border-primary/15 md:border-b-0' : ''} ${i === 1 ? 'md:border-r' : ''} ${i === 2 ? 'md:border-r' : ''}`}>
                  <div className="font-display text-2xl sm:text-3xl text-gradient-gold leading-none">{v}</div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">{l}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-3">
            {WORLDS.map((w, i) => (
              <Reveal key={w.title} delay={i * 0.05}>
                <div className="h-full border border-primary/15 bg-card/40 p-7 hover:border-primary/30 transition-colors">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-primary">{w.k}</div>
                  <h3 className="font-display text-2xl text-foreground mt-2 mb-3">{w.title}</h3>
                  <p className="text-[13.5px] text-muted-foreground leading-relaxed">{w.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <p className="mt-6 text-sm text-muted-foreground">
              See the full venue floor plan — production booth, every bar, stage, screen and table — in the interactive deck below.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 04 — 360 TOUR */}
      <section id="tour" className="py-24 scroll-mt-20">
        <div className="container mx-auto max-w-5xl px-6">
          <SectionHead eyebrow="03 — Soleia 360° Tour" title="Step inside." />
          <Reveal>
            <div className="relative border border-primary/15 bg-black overflow-hidden">
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary/40 z-10 pointer-events-none" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary/40 z-10 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary/40 z-10 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary/40 z-10 pointer-events-none" />
              <div className="aspect-video w-full">
                <iframe
                  src={TOUR_360_URL}
                  title="SOLEIA Las Vegas — 360° Virtual Tour"
                  className="w-full h-full border-0"
                  allow="fullscreen; accelerometer; gyroscope; xr-spatial-tracking"
                  loading="lazy"
                />
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.05} className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground max-w-3xl flex items-start gap-2">
              <Compass className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>
                Click and drag to explore — Dance Floor, Celebrity 1 & 2, the Rotunda, the 800s, the 200s/300s/400s, plus the beachclub, cabanas and Strip bars. Tour by Invision Studio.
              </span>
            </p>
            <Button variant="outline" size="sm" asChild className="gap-2 border-primary/30 text-primary hover:bg-primary/10 shrink-0">
              <a href={TOUR_360_URL} target="_blank" rel="noopener noreferrer">
                <Maximize2 className="w-4 h-4" />
                Open fullscreen
              </a>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* 05 — BUYOUT INCLUSIONS */}
      <section id="branding" className="py-24 scroll-mt-20">
        <div className="container mx-auto max-w-5xl px-6">
          <SectionHead eyebrow="04 — Buyout Inclusions" title="Branding, built in." />
          <div className="grid gap-4 md:grid-cols-2">
            {INCLUSIONS.map((inc, i) => (
              <Reveal key={inc.title} delay={i * 0.05}>
                <div className="h-full border border-primary/15 bg-card/40 p-8">
                  <div className="text-[10.5px] uppercase tracking-[0.2em] text-primary mb-3">{inc.sub}</div>
                  <h3 className="font-display text-2xl text-foreground mb-2">{inc.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{inc.intro}</p>
                  <ul className="mt-4 space-y-2.5">
                    {inc.items.map((item) => (
                      <li key={item} className="relative pl-5 text-sm text-foreground">
                        <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[12.5px] italic text-muted-foreground/80 leading-relaxed">{inc.fine}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 06 — CUSTOM CONTENT + VIDEO SPECS */}
      <section id="specs" className="py-24 scroll-mt-20">
        <div className="container mx-auto max-w-5xl px-6">
          <SectionHead eyebrow="05 — Custom Content Creation" title="Take control of every pixel." />
          <Reveal>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-9">
              By using the “Pixelmap” that will be provided, you can take control of every pixel we display throughout our venue.
            </p>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3 mb-10">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.05}>
                <div className="h-full border border-primary/15 bg-card/40 p-7">
                  <div className="font-display text-3xl text-primary">{s.n}</div>
                  <h4 className="font-display text-xl text-foreground mt-2 mb-2">{s.t}</h4>
                  <p className="text-[13.5px] text-muted-foreground leading-relaxed">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="text-sm text-muted-foreground max-w-4xl leading-relaxed">
              To ensure seamless integration and optimal performance, we ask that a sample of your rendered video or media be shared with us at least <span className="text-foreground font-medium">21 Business Days</span> prior to your event. This preliminary piece facilitates our testing and approval process. Should you opt for custom branding — a choice many brands favor — please provide your logos, style guides, and other pertinent assets at least <span className="text-foreground font-medium">21 Business Days</span> prior to your event.
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="mt-7 border border-primary/15">
              {VIDEO_SPECS.map((row, i) => (
                <div key={row.k} className={`grid grid-cols-1 sm:grid-cols-[200px_1fr] ${i < VIDEO_SPECS.length - 1 ? 'border-b border-primary/15' : ''}`}>
                  <div className="px-5 py-3.5 text-[11px] uppercase tracking-[0.16em] text-primary bg-primary/5">{row.k}</div>
                  <div className="px-5 py-3.5 text-[14.5px] text-foreground">{row.v}</div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Content Delivery Guide — DXV3 workflow */}
          <Reveal delay={0.1}>
            <div className="mt-12 mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary">
              <FileVideo className="w-4 h-4" /> Content Delivery Guide
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-4xl mb-6">
              We provide an After Effects project file prepared specifically for our LED video configuration mapping — pre-built to match the venue's exact screen layout, so you can drop in your content and export with confidence.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {DELIVERY_STEPS.map((s) => (
                <div key={s.n} className="border border-primary/15 bg-card/40 p-4">
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mb-2.5">{s.n}</div>
                  <h4 className="text-[13px] font-semibold text-foreground mb-1">{s.t}</h4>
                  <p className="text-[11.5px] text-muted-foreground/80 leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 border border-primary/15 overflow-x-auto">
              <div className="grid grid-cols-[1.4fr_1.6fr_1.1fr_0.8fr_0.8fr] min-w-[640px] text-[11px] uppercase tracking-[0.14em] text-primary bg-primary/5">
                <div className="px-4 py-2.5">Display Type</div>
                <div className="px-4 py-2.5">Resolution</div>
                <div className="px-4 py-2.5">Format</div>
                <div className="px-4 py-2.5">Codec</div>
                <div className="px-4 py-2.5">Frame Rate</div>
              </div>
              {DELIVERY_SPECS.map((r) => (
                <div key={r.type} className="grid grid-cols-[1.4fr_1.6fr_1.1fr_0.8fr_0.8fr] min-w-[640px] text-[13.5px] border-t border-primary/15">
                  <div className="px-4 py-3 text-foreground font-medium">{r.type}</div>
                  <div className="px-4 py-3 text-muted-foreground font-mono">{r.res}</div>
                  <div className="px-4 py-3 text-muted-foreground">{r.format}</div>
                  <div className="px-4 py-3 text-muted-foreground">{r.codec}</div>
                  <div className="px-4 py-3 text-muted-foreground">{r.fps}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground border-l-2 border-primary/40 pl-4 py-1">
              <span className="font-display text-3xl text-primary leading-none">21</span>
              <span>business days minimum — submit your content at least 21 business days before your event for testing and approval.</span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-10 mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary">
              <Download className="w-4 h-4" /> Downloads
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {CONTENT_DELIVERY.map((c) => (
                <a
                  key={c.title}
                  href={c.href}
                  {...(c.download ? { download: '' } : { target: '_blank', rel: 'noopener noreferrer' })}
                  className="group block h-full border border-primary/15 bg-card/40 p-6 hover:border-primary/30 transition-colors"
                >
                  <c.icon className="w-5 h-5 text-primary mb-3" />
                  <h3 className="font-display text-xl text-foreground mb-1.5 group-hover:text-gradient-gold transition-colors">{c.title}</h3>
                  <p className="text-[12.5px] text-muted-foreground/80 mb-3">{c.desc}</p>
                  <span className="text-[10.5px] uppercase tracking-[0.18em] text-primary inline-flex items-center gap-1">{c.cta} →</span>
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15} className="mt-12">
            <div className="border border-primary/15">
              <div className="px-5 py-3 border-b border-primary/15 text-[11px] uppercase tracking-[0.2em] text-primary">
                LED Display Specifications · pixel maps
              </div>
              {ALL_LED_ZONES.map((z, i) => (
                <div key={z.id} className={`grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-1 sm:gap-4 ${i < ALL_LED_ZONES.length - 1 ? 'border-b border-primary/15' : ''}`}>
                  <div className="px-5 py-3 text-sm text-foreground">
                    {z.name}
                    <span className="ml-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">{z.category}</span>
                  </div>
                  <div className="px-5 py-3 text-[13.5px] text-primary font-mono text-left sm:text-right">
                    {z.panels ? (
                      <div className="space-y-0.5">
                        {z.panels.map((p) => (
                          <div key={p.label}>
                            <span className="text-muted-foreground/70">{p.label}</span> {p.w} × {p.h}
                          </div>
                        ))}
                      </div>
                    ) : z.resolution ? (
                      `${z.resolution.replace('x', ' × ')} px`
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>


      {/* FOOTER */}
      <footer className="border-t border-primary/15 pt-14 pb-9">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="flex flex-wrap justify-between gap-9">
            <div className="max-w-sm">
              <img src={soleiaWideLogo} alt="Soleia Las Vegas" className="h-12 w-auto" />
              <p className="font-sans text-[13.5px] font-light leading-relaxed text-muted-foreground mt-4 max-w-xs">
                Sophistication, innovation, and authenticity — at the fifty yard line of the Las Vegas Strip.
              </p>
            </div>
            <div className="flex gap-12 flex-wrap">
              <div>
                <h4 className="text-[10.5px] uppercase tracking-[0.2em] text-primary mb-3.5">Venue</h4>
                <a href="#layout" className="block text-[13px] text-muted-foreground mb-2 hover:text-primary transition-colors">Layout</a>
                <a href="#tour" className="block text-[13px] text-muted-foreground mb-2 hover:text-primary transition-colors">360° Tour</a>
                <a href="#specs" className="block text-[13px] text-muted-foreground mb-2 hover:text-primary transition-colors">Specs</a>
              </div>
              <div>
                <h4 className="text-[10.5px] uppercase tracking-[0.2em] text-primary mb-3.5">Plan</h4>
                <a href="#branding" className="block text-[13px] text-muted-foreground mb-2 hover:text-primary transition-colors">Buyout Inclusions</a>
                <a href="#specs" className="block text-[13px] text-muted-foreground mb-2 hover:text-primary transition-colors">Specs</a>
                <a href={TOUR_360_URL} target="_blank" rel="noopener noreferrer" className="block text-[13px] text-muted-foreground mb-2 hover:text-primary transition-colors">Virtual Tour</a>
              </div>
            </div>
          </div>
          <div className="mt-11 pt-5 border-t border-primary/15 flex flex-wrap justify-between gap-3 items-center">
            <span className="text-[11px] text-muted-foreground/60">© 2026 SOLEIA Las Vegas. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/creative-guide/print')} className="text-[11px] text-muted-foreground/60 hover:text-primary transition-colors inline-flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print Guide
              </button>
              <PoweredByShowBlox variant="header" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};


export default CreativeGuideView;
