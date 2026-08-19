import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import solIcon from '@/assets/sol-icon.png';

// Ticker assets (public/ so documents and downloads share the same files).
const HERO_IMG = '/creative-guide/ticker/soleia-welcomes.jpg';
const WORK_MAP = '/creative-guide/ticker/ticker-work-map-dark.png';
const LOOP_URL = '/creative-guide/ticker/ticker-preview-loop.mp4';
const LOOP_POSTER = '/creative-guide/ticker/ticker-preview-poster.jpg';

// Official mapping (source: Ticker work comp / DLV marquee pixelmap).
const SIDES: [string, string][] = [
  ['West Side · Las Vegas Blvd', '1608 × 192 px'],
  ['South Side · Flamingo Rd', '2184 × 192 px'],
  ['Total display', '3792 × 192 px'],
];
const SEGMENTS: [string, string][] = [
  ['West 1', '672 × 192'],
  ['West 2', '960 × 192'],
  ['South 1', '960 × 192'],
  ['South 2', '1200 × 192'],
];
const DELIVERY: [string, string][] = [
  ['Format', '.MOV · DXV3'],
  ['Alternate', 'ProRes 4444'],
  ['Frame rate', '30 fps'],
  ['Stills', 'PNG or JPG'],
];

function SpecRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl>
      {rows.map(([k, v], i) => (
        <div key={k} className={`flex items-baseline justify-between gap-6 py-2.5 ${i > 0 ? 'border-t border-primary/10' : ''}`}>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{k}</dt>
          <dd className="font-mono text-[13px] tracking-[0.05em] text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function TickerDisplayGuide() {
  const navigate = useNavigate();

  const panelShell = 'card-elevated overflow-hidden rounded-3xl border border-primary/15 bg-card/40 surface-elevated';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="glass fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-primary/15 px-5 py-4 sm:px-8">
        <button onClick={() => navigate('/creative-guide/services')} className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-[0.2em]">Services</span>
        </button>
        <img src={solIcon} alt="Soleia" className="h-9 w-auto object-contain" />
        <div className="w-24" />
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-32 pt-32 sm:px-8">
        {/* HEAD */}
        <Reveal className="mb-12">
          <span className="block font-mono text-[11px] uppercase tracking-[0.34em] text-primary">Exterior · LED Ticker</span>
          <h1 className="mt-4 font-display text-4xl leading-[1.08] text-foreground sm:text-5xl">
            The sign the Strip reads first.
          </h1>
          <div className="mt-4 h-px w-16 bg-gradient-to-r from-primary to-transparent" />
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            The ticker wraps the building's corner in a continuous LED band — one canvas split across the West Side on Las
            Vegas Blvd and the South Side on Flamingo Rd. Build to the mapping below, or hand us your assets and we format,
            map and schedule them into the venue's marquee playback.
          </p>
        </Reveal>

        {/* HERO + SPECS */}
        <Reveal>
          <article className={`${panelShell} grid lg:grid-cols-[1.2fr_1fr]`}>
            <div className="relative min-h-[320px] overflow-hidden border-b border-primary/15 lg:min-h-[520px] lg:border-b-0 lg:border-r">
              <img src={HERO_IMG} alt="The ticker running Soleia branding across both sides of the building at dusk" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="p-7 sm:p-9">
              <h2 className="font-display text-2xl text-foreground">Display mapping</h2>
              <div className="mt-6">
                <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Sides</h3>
                <SpecRows rows={SIDES} />
              </div>
              <div className="mt-7 grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Panel segments</h3>
                  <SpecRows rows={SEGMENTS} />
                </div>
                <div>
                  <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Delivery</h3>
                  <SpecRows rows={DELIVERY} />
                </div>
              </div>
              <p className="mt-6 text-[12.5px] italic leading-relaxed text-muted-foreground/80">
                Content runs edge to edge across both sides. Design as one 3792 × 192 canvas; the corner split lands
                between West 2 and South 1.
              </p>
            </div>
          </article>
        </Reveal>

        {/* WORK MAP — theme-aware: dark map in dark mode, bright map in light mode */}
        <Reveal className="mt-6">
          <article className={panelShell}>
            <div className="bg-[#0B0805] p-6 sm:p-8">
              <img src={WORK_MAP} alt="Ticker work map — West Side 1608 × 192, South Side 2184 × 192, total 3792 × 192" className="block w-full rounded-lg border border-primary/25 shadow-[0_0_34px_-6px_hsl(var(--primary)/0.3)]" />
            </div>
            <div className="border-t border-primary/15 p-6 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl text-foreground">Work map</h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">The exact canvas your ticker content is built on.</p>
                </div>
                <a
                  href={WORK_MAP}
                  download="Soleia-Ticker-Work-Map.png"
                  className="tap-44 inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/10"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </div>
            </div>
          </article>
        </Reveal>

        {/* ANIMATION PREVIEW */}
        <Reveal className="mt-6">
          <article className={panelShell}>
            <div className="relative overflow-hidden bg-black">
              <video
                src={LOOP_URL}
                poster={LOOP_POSTER}
                className="aspect-video w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />
            </div>
            <div className="border-t border-primary/15 p-6 sm:px-8">
              <h2 className="font-display text-xl text-foreground">Animation preview</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                A client ticker animation running the full wrap — designed as one continuous 3792 × 192 loop across both sides.
              </p>
            </div>
          </article>
        </Reveal>

        {/* CLOSING LINE */}
        <Reveal className="mt-10">
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            The LED Ticker is coordinated per event through the Soleia creative team — see the{' '}
            <button onClick={() => navigate('/creative-guide/services')} className="text-primary underline-offset-4 hover:underline">
              services page
            </button>
            {' '}to get started.
          </p>
        </Reveal>
      </main>
    </div>
  );
}
