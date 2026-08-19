import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { CreativeGuideHeader } from '@/components/creative-guide/CreativeGuideHeader';

// TV / narrowcasting assets (public/ so documents and downloads share the same files).
const HERO_IMG = '/creative-guide/tv/hero.jpg';
const WORK_MAP = '/creative-guide/tv/tv-work-map.png';
const REEL_URL = '/creative-guide/tv/network-reel.mp4';
const REEL_POSTER = '/creative-guide/tv/network-reel-poster.jpg';

// Official delivery spec (source: Creative Guide — Television Displays).
const NETWORK: [string, string][] = [
  ['Front door entry · casino level', '4 screens'],
  ['Cabanas · beachclub', '15 screens'],
  ['Bungalows · beachclub', '9 screens'],
  ['Feed', 'Shared · all TVs'],
];
const VIDEO_SPECS: [string, string][] = [
  ['Resolution', '1920 × 1080'],
  ['Alternate', '1280 × 720'],
  ['Format', 'MP4 · H.264'],
  ['File size', 'Max 8 GB'],
];
const GRAPHIC_SPECS: [string, string][] = [
  ['Resolution', '1920 × 1080'],
  ['Alternate', '1280 × 720'],
  ['Stills', 'PNG'],
  ['Logos', 'Vector or hi-res PNG'],
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

export default function TVDisplayGuide() {
  const navigate = useNavigate();

  const panelShell = 'card-elevated overflow-hidden rounded-3xl border border-primary/15 bg-card/40 surface-elevated';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CreativeGuideHeader />

      <main className="mx-auto max-w-5xl px-5 pb-32 pt-32 sm:px-8">
        {/* HEAD */}
        <Reveal className="mb-12">
          <span className="block font-mono text-[11px] uppercase tracking-[0.34em] text-primary">Narrowcasting · TV Displays</span>
          <h1 className="mt-4 font-display text-4xl leading-[1.08] text-foreground sm:text-5xl">
            The screens guests sit beside.
          </h1>
          <div className="mt-4 h-px w-16 bg-gradient-to-r from-primary to-transparent" />
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            The TV network runs one shared feed across the front-door entry, every cabana and every bungalow — 28 screens
            carrying your logo from the moment doors open. Build to the spec below, or hand us your assets and we format
            and load them into the narrowcasting system.
          </p>
        </Reveal>

        {/* HERO + SPECS */}
        <Reveal>
          <article className={`${panelShell} grid lg:grid-cols-[1.2fr_1fr]`}>
            <div className="relative min-h-[320px] overflow-hidden border-b border-primary/15 lg:min-h-[560px] lg:border-b-0 lg:border-r">
              <img src={HERO_IMG} alt="Bungalow spa with private TV displays either side of the plunge pool" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="p-7 sm:p-9">
              <h2 className="font-display text-2xl text-foreground">Network &amp; delivery</h2>
              <div className="mt-6">
                <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">The network</h3>
                <SpecRows rows={NETWORK} />
              </div>
              <div className="mt-7 grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Video assets</h3>
                  <SpecRows rows={VIDEO_SPECS} />
                </div>
                <div>
                  <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Graphic assets</h3>
                  <SpecRows rows={GRAPHIC_SPECS} />
                </div>
              </div>
              <p className="mt-6 text-[12.5px] italic leading-relaxed text-muted-foreground/80">
                Want a dedicated logo on a specific cabana or bungalow screen instead of the shared feed? Add the
                Individual Cabana / Bungalow Logo line item and each selected screen runs its own player feed.
              </p>
            </div>
          </article>
        </Reveal>

        {/* WORK MAP */}
        <Reveal className="mt-6">
          <article className={panelShell}>
            <div className="bg-[#0B0805] p-6 sm:p-8">
              <img src={WORK_MAP} alt="TV network map — front-door entry, cabana and bungalow displays on one shared feed" className="mx-auto block max-h-[440px] w-auto rounded-lg border border-primary/25 shadow-[0_0_34px_-6px_hsl(var(--primary)/0.3)]" />
            </div>
            <div className="border-t border-primary/15 p-6 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl text-foreground">Network map</h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">Where the shared feed lands across the venue's TV displays.</p>
                </div>
                <a
                  href={WORK_MAP}
                  download="Soleia-TV-Network-Map.png"
                  className="tap-44 inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/10"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </div>
            </div>
          </article>
        </Reveal>

        {/* NETWORK REEL */}
        <Reveal className="mt-6">
          <article className={panelShell}>
            <div className="relative overflow-hidden bg-black">
              <video
                src={REEL_URL}
                poster={REEL_POSTER}
                className="aspect-video w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />
            </div>
            <div className="border-t border-primary/15 p-6 sm:px-8">
              <h2 className="font-display text-xl text-foreground">Branded feed preview</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                The Soleia house feed running on the TV network — what your logo replaces across all 28 screens.
              </p>
            </div>
          </article>
        </Reveal>

        {/* CLOSING LINE */}
        <Reveal className="mt-10">
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            One static logo across the network is included with your buyout — see the{' '}
            <button onClick={() => navigate('/creative-guide/services')} className="text-primary underline-offset-4 hover:underline">
              services page
            </button>
            {' '}for dedicated per-screen feeds and custom content.
          </p>
        </Reveal>
      </main>
    </div>
  );
}
