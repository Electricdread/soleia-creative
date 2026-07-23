import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Printer, FileVideo, Boxes, Compass, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PoweredByShowBlox } from '@/components/PoweredByShowBlox';
import { InteractiveVenueMap } from '@/components/creative-guide/InteractiveVenueMap';
import { Reveal } from '@/components/motion/Reveal';
import soleiaWideLogo from '@/assets/soleia-wide-logo.png';
import solIcon from '@/assets/sol-icon.png';

const TOUR_360_URL = 'https://360virtualtour.invisionstudio.com/tours/sVpoz23SHC-';

const NAV_LINKS: { label: string; href?: string; to?: string }[] = [
  { href: '#venue', label: 'Venue' },
  { href: '#layout', label: 'Layout' },
  { href: '#tour', label: '360° Tour' },
  { to: '/creative-guide/video-mapping', label: 'Video Mapping' },
  { href: '#branding', label: 'Branding' },
  { href: '#specs', label: 'Specs' },
  
];

const ZONE_GROUPS = [
  {
    group: 'Main Room — Interior LED',
    note: 'The primary nightclub LED wall, left to right.',
    zones: [
      { name: 'SR Curves', res: '2304 × 272', role: 'Stage-right curved LED — wraparound ambient visuals and brand washes.' },
      { name: 'IMAG SR', res: '1216 × 592', role: 'Stage-right vertical screen — directional branding and portrait content.' },
      { name: 'Center', res: '640 × 272', role: 'Center focal screen — logo reveals and hero moments.' },
      { name: 'IMAG SL', res: '1216 × 592', role: 'Stage-left vertical screen — directional branding and portrait content.' },
      { name: 'SL Curves', res: '2304 × 272', role: 'Stage-left curved LED — wraparound ambient visuals and brand washes.' },
    ],
  },
  {
    group: 'Beach Club — Exterior LED',
    note: 'Open-air screens facing the Las Vegas Strip.',
    zones: [
      { name: 'Outdoor SR', res: '588 × 840', role: 'Stage-right exterior tower — high-brightness arrival branding.' },
      { name: 'Outdoor SL', res: '588 × 840', role: 'Stage-left exterior tower — high-brightness arrival branding.' },
      { name: 'Outdoor Arch', res: '1512 × 504', role: 'Beachclub arch — immersive entry moment overlooking the Strip.' },
    ],
  },
  {
    group: 'TV Displays',
    note: 'Narrowcasting network across the venue.',
    zones: [
      { name: 'TV / Narrowcasting', res: '1920×1080 or 3840×2160', role: 'Logos and sponsor messaging across front-door entry, cabanas and bungalows.' },
    ],
  },
];


const LAYOUT_STATS: [string, string][] = [
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
    intro: 'Every activation includes 10 Static Logos displayed across the 5 Main LED Screens:',
    items: ['2 Large Horizontal, Nightclub', '2 Large Vertical, Beachclub / Outside', '1 Beachclub Arch, Beachclub / Stage'],
    fine: 'All other LED screens will be activated, and display in-house visual animations and motion graphics from the club library (mixed in real-time, by visual operator).',
    addOn: '',
  },
  {
    sub: 'Included · Custom feeds optional',
    title: 'TV Screens / Narrowcasting',
    intro: '1 Static Logo displayed across the TV / narrowcasting network — included with your buyout:',
    items: ['4 Front Door Entry, Casino Level', '9 Bungalows, Beachclub / Outside', '15 Cabanas, Beachclub / Outside'],
    fine: 'All TVs are connected and display the same content feed.',
    addOn: 'Want a dedicated logo on each cabana or bungalow screen instead of the shared feed? Add the “Individual Dedicated Cabana / Bungalow Logo” line item to your proposal and set the quantity — each selected screen then runs its own player feed.',
  },
];

const STEPS = [
  { n: '01', t: 'Logo Placement', d: "We place your logos across the 5 main LED screens and the venue's TV / narrowcasting network — live from the moment doors open." },
  { n: '02', t: 'Custom Animations', d: 'Our creative team designs bespoke motion graphics that bring your brand to life across the venue, built from your brand assets.' },
  { n: '03', t: 'Pixel-Perfect Mapping', d: 'We map every asset to the exact dimensions of each screen so your visuals land flawlessly, venue-wide.' },
];

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
          {NAV_LINKS.map((link) =>
            link.to ? (
              <button
                key={link.label}
                onClick={() => navigate(link.to!)}
                className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </button>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            )
          )}
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
          {NAV_LINKS.map((link) =>
            link.to ? (
              <button
                key={link.label}
                onClick={() => { setMenuOpen(false); navigate(link.to!); }}
                className="font-display text-2xl text-foreground"
              >
                {link.label}
              </button>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-display text-2xl text-foreground"
              >
                {link.label}
              </a>
            )
          )}
        </div>
      )}

      {/* HERO */}
      <section id="top" className="min-h-[92vh] flex flex-col items-center justify-center text-center px-6 pt-32 pb-20">
        <Reveal>
          <span className="text-[11px] uppercase tracking-[0.34em] text-primary">Custom Content & Creative Design</span>
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
              Every activation includes a built-in perk: your logos placed across our screens and televisions — prepared by the Soleia creative team during the “Load-In” phase before doors open.
            </p>
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              To truly harness the power of these screens and immerse your audience in your brand's narrative, it's crucial to tailor content to the precise screen dimensions. Recognizing that this can be technically demanding, Soleia provides expertise to bridge any creative gaps and create custom content for your event — whether it's adapting your existing visuals or crafting bespoke animations that resonate with your brand ethos.
            </p>
          </Reveal>
        </div>
      </section>

      {/* VENUE LAYOUT */}
      <section id="layout" className="py-24 scroll-mt-20">
        <div className="container mx-auto max-w-5xl px-6">
          <SectionHead eyebrow="02 — Venue Layout" title="One venue, two worlds." />

          <Reveal className="mb-6">
            <InteractiveVenueMap />
          </Reveal>


          <div className="grid gap-4 md:grid-cols-3">
            {WORLDS.map((w, i) => (
              <Reveal key={w.title} delay={i * 0.05}>
                <div className="h-full rounded-3xl surface-elevated border border-primary/15 bg-card/40 p-7 hover:border-primary/30 transition-colors">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-primary">{w.k}</div>
                  <h3 className="font-display text-2xl text-foreground mt-2 mb-3">{w.title}</h3>
                  <p className="text-[13.5px] text-muted-foreground leading-relaxed">{w.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      {/* 05 — BUYOUT INCLUSIONS */}
      <section id="branding" className="py-24 scroll-mt-20">
        <div className="container mx-auto max-w-5xl px-6">
          <SectionHead eyebrow="04 — What's Included" title="Branding, built in." />
          <div className="grid gap-4 md:grid-cols-2">
            {INCLUSIONS.map((inc, i) => (
              <Reveal key={inc.title} delay={i * 0.05}>
                <div className="h-full rounded-3xl surface-elevated border border-primary/15 bg-card/40 p-8">
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
                  {inc.addOn && (
                    <div className="mt-5 pt-4 border-t border-primary/15">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-primary/70 mb-1.5">Optional add-on · select on your proposal</div>
                      <p className="text-[12.5px] text-muted-foreground/80 leading-relaxed">{inc.addOn}</p>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 06 — CUSTOM CONTENT + VIDEO SPECS */}
      <section id="specs" className="py-24 scroll-mt-20">
        <div className="container mx-auto max-w-5xl px-6">
          <SectionHead eyebrow="05 — Creative Content Design" title="We design every pixel." />
          <Reveal>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-9">
              Our creative team designs branded content mapped to every pixel of the venue — from logo placement to fully bespoke motion built around your brand.
            </p>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3 mb-10">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.05}>
                <div className="h-full rounded-3xl surface-elevated border border-primary/15 bg-card/40 p-7">
                  <div className="font-display text-3xl text-primary">{s.n}</div>
                  <h4 className="font-display text-xl text-foreground mt-2 mb-2">{s.t}</h4>
                  <p className="text-[13.5px] text-muted-foreground leading-relaxed">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="text-sm text-muted-foreground max-w-4xl leading-relaxed">
              It starts with a Creative Call. Share your logos, style guides and brand assets at least <span className="text-foreground font-medium">21 business days</span> before your event, and our team designs and produces content built specifically for the venue. Prefer to supply your own finished content? Everything you need — build specs, the Pixelmap and the After Effects project — is in the Content Delivery Guide.
            </p>
          </Reveal>
        </div>
      </section>

      {/* VIDEO MAPPING CTA — interactive 3D venue + previz */}
      <section className="pb-8 pt-24">
        <div className="container mx-auto max-w-5xl px-6">
          <Reveal>
            <div
              onClick={() => navigate('/creative-guide/video-mapping')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/creative-guide/video-mapping')}
              className="group cursor-pointer rounded-3xl surface-elevated border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 p-7 sm:p-8 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary mb-2"><Boxes className="w-4 h-4" /> See it come alive</div>
              <h3 className="font-display text-2xl text-foreground mb-2 group-hover:text-gradient-gold transition-colors">Video Mapping</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">Step inside an interactive 3D model of the venue and preview real mapped content on every screen — see how motion, branding and pixel-perfect mapping turn the room into one immersive canvas.</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.18em] text-primary">Explore the venue in 3D →</span>
            </div>
          </Reveal>
        </div>
      </section>


      {/* CONTENT DELIVERY CTA — always sits just above the footer */}
      <section className="pb-24">
        <div className="container mx-auto max-w-5xl px-6">
          <Reveal>
            <div
              onClick={() => navigate('/creative-guide/content-delivery')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/creative-guide/content-delivery')}
              className="group cursor-pointer rounded-3xl surface-elevated border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 p-7 sm:p-8 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary mb-2"><FileVideo className="w-4 h-4" /> Providing your own content?</div>
              <h3 className="font-display text-2xl text-foreground mb-2 group-hover:text-gradient-gold transition-colors">Content Delivery Guide</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">Full build-to-spec instructions, the DXV3 workflow, every screen's pixel resolution, the Pixelmap and the After Effects project — everything you need to deliver your own content.</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.18em] text-primary">Open the Content Delivery Guide →</span>
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
                <button onClick={() => navigate('/creative-guide/video-mapping')} className="block text-[13px] text-muted-foreground mb-2 hover:text-primary transition-colors text-left">Video Mapping</button>
              </div>
              <div>
                <h4 className="text-[10.5px] uppercase tracking-[0.2em] text-primary mb-3.5">Plan</h4>
                <a href="#branding" className="block text-[13px] text-muted-foreground mb-2 hover:text-primary transition-colors">Buyout Inclusions</a>
                <a href="#specs" className="block text-[13px] text-muted-foreground mb-2 hover:text-primary transition-colors">Specs</a>
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
