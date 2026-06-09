import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileVideo, Download, ExternalLink, Sparkles } from 'lucide-react';
import { PoweredByShowBlox } from '@/components/PoweredByShowBlox';
import { ALL_LED_ZONES } from '@/lib/creativeGuide';
import solIcon from '@/assets/sol-icon.png';

const RESOLUME_ALLEY_URL = 'https://resolume.com/software/alley';
const AE_PROJECT_URL = 'https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/creative-guide-template/CREATIVE_GUIDE_June2026_Soleia.zip';
const PIXELMAP_URL = '/creative-guide/soleia-pixelmap.png';

const STEPS = [
  { n: '1', t: 'Prepare your video', d: 'Export your final video from After Effects, Premiere, or your editing tool in ProRes 422 or high-quality H.264.' },
  { n: '2', t: 'Download Resolume Alley (free)', d: 'Our venue runs on Resolume media servers, which require DXV3-encoded files. Download the free encoder.' },
  { n: '3', t: 'Encode to DXV3', d: 'Open your video in Resolume Alley and encode using the DXV3 codec. For content with transparency, select “DXV3 Alpha.”' },
  { n: '4', t: 'Check specs', d: 'TV Displays: 1920×1080 or 3840×2160 · MOV · DXV3 · Max 8GB.  LED Pixel Map: 3840×2160 · MOV w/ Alpha · DXV3 · 60fps · Max 30GB.' },
  { n: '5', t: 'Submit content', d: 'Submit your encoded files at least 21 business days before your event so we can test and approve playback.' },
];

const DXV3_SPECS = [
  { type: 'Television Displays', res: '1920×1080 or 3840×2160', format: 'MOV', codec: 'DXV3', fps: '—' },
  { type: 'LED Pixel Map', res: '3840×2160', format: 'MOV with Alpha', codec: 'DXV3', fps: '60 fps' },
];

const DOWNLOADS = [
  { title: 'After Effects Project', desc: 'Pre-built AE template mapped to every screen — drop in your content and render.', cta: 'Download .zip', href: AE_PROJECT_URL, icon: FileVideo, download: true },
  { title: 'Pixelmap', desc: 'Master pixel map of the full venue display layout.', cta: 'Download .png', href: PIXELMAP_URL, icon: Download, download: true },
  { title: 'Resolume Alley', desc: 'Free encoder to convert your renders to the required DXV3 codec.', cta: 'resolume.com', href: RESOLUME_ALLEY_URL, icon: ExternalLink, download: false },
];

// Upsell — services available on the proposal price list (confirm exact line items)
const SERVICES = [
  { t: 'Custom Animation Design', d: 'Bespoke motion graphics designed by our creative team and built around your brand.' },
  { t: 'Full Venue Brand Activation', d: 'End-to-end content design across every LED screen and TV in the venue.' },
  { t: 'Dedicated Cabana / Bungalow Logos', d: 'A unique logo per screen with individual player feeds — set the quantity on your proposal.' },
  { t: 'Content Production & Mapping', d: 'We render, encode and pixel-map your assets to spec, so you don\'t have to.' },
];

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay }} className={className}>
      {children}
    </motion.div>
  );
}

export function ContentDeliveryView() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-primary/15">
        <div className="container mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/creative-guide')} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Creative Guide
          </button>
          <img src={solIcon} alt="Soleia" className="h-8 w-auto object-contain" />
          <div className="w-28" />
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-6">
        {/* Hero */}
        <section className="pt-16 pb-10">
          <Reveal>
            <span className="block text-[11px] uppercase tracking-[0.34em] text-primary mb-3.5">Content Delivery Guide</span>
            <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-tight">Building your own content?</h1>
            <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-3xl">
              We provide an After Effects project file prepared specifically for our LED video configuration mapping — pre-built to match the venue's exact screen layout, so you can drop in your content and export with confidence. Everything you need to build to spec is below.
            </p>
          </Reveal>
        </section>

        {/* Workflow */}
        <section className="pb-10">
          <Reveal>
            <div className="mb-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary">
              <FileVideo className="w-4 h-4" /> Step-by-step workflow
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((s) => (
                <div key={s.n} className="border border-primary/15 bg-card/40 p-4">
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mb-2.5">{s.n}</div>
                  <h4 className="text-[13px] font-semibold text-foreground mb-1">{s.t}</h4>
                  <p className="text-[11.5px] text-muted-foreground/80 leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* DXV3 spec table */}
          <Reveal delay={0.05}>
            <div className="mt-6 border border-primary/15 overflow-x-auto">
              <div className="grid grid-cols-[1.4fr_1.6fr_1.1fr_0.8fr_0.8fr] min-w-[640px] text-[11px] uppercase tracking-[0.14em] text-primary bg-primary/5">
                <div className="px-4 py-2.5">Display Type</div>
                <div className="px-4 py-2.5">Resolution</div>
                <div className="px-4 py-2.5">Format</div>
                <div className="px-4 py-2.5">Codec</div>
                <div className="px-4 py-2.5">Frame Rate</div>
              </div>
              {DXV3_SPECS.map((r) => (
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
        </section>

        {/* Downloads */}
        <section className="pb-10">
          <Reveal>
            <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary">
              <Download className="w-4 h-4" /> Downloads
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {DOWNLOADS.map((c) => (
                <a key={c.title} href={c.href} {...(c.download ? { download: '' } : { target: '_blank', rel: 'noopener noreferrer' })}
                  className="group block h-full border border-primary/15 bg-card/40 p-6 hover:border-primary/30 transition-colors">
                  <c.icon className="w-5 h-5 text-primary mb-3" />
                  <h3 className="font-display text-xl text-foreground mb-1.5 group-hover:text-gradient-gold transition-colors">{c.title}</h3>
                  <p className="text-[12.5px] text-muted-foreground/80 mb-3">{c.desc}</p>
                  <span className="text-[10.5px] uppercase tracking-[0.18em] text-primary inline-flex items-center gap-1">{c.cta} →</span>
                </a>
              ))}
            </div>
          </Reveal>
        </section>

        {/* LED display specifications */}
        <section className="pb-10">
          <Reveal>
            <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary">LED Display Specifications · pixel maps</div>
            <div className="border border-primary/15">
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
                          <div key={p.label}><span className="text-muted-foreground/70">{p.label}</span> {p.w} × {p.h}</div>
                        ))}
                      </div>
                    ) : z.resolution ? `${z.resolution.replace('x', ' × ')} px` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Upsell to creative services */}
        <section className="pb-16">
          <Reveal>
            <div className="border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 p-7 sm:p-9">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary mb-3">
                <Sparkles className="w-4 h-4" /> Rather not build it yourself?
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-3">Let our creative team handle it.</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl mb-6">
                These specs are everything you need to deliver content yourself — but most brands have us design and produce it. The following services are available as line items on your proposal:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {SERVICES.map((s) => (
                  <div key={s.t} className="border border-primary/15 bg-background/40 p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-1">{s.t}</h3>
                    <p className="text-[12.5px] text-muted-foreground/80 leading-relaxed">{s.d}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[12.5px] text-muted-foreground/70">
                Add any of these to your proposal — talk to your Soleia contact to set scope and quantities.
              </p>
            </div>
          </Reveal>
        </section>
      </main>

      <PoweredByShowBlox className="border-t border-primary/15 mt-4" />
    </div>
  );
}

export default ContentDeliveryView;
