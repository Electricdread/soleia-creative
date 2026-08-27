import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { CreativeGuideHeader } from '@/components/creative-guide/CreativeGuideHeader';

// Asset paths shared with the services page.
const HERO_IMG = '/creative-guide/drive-updates/tv-hero.png';
const MAPPING_CARD_PNG = '/creative-guide/drive-updates/tv-mapping-card.png';

// Official delivery spec (source: Creative Guide — Television Displays, and
// the TV Guide pixel map card the network is built on).
const VIDEO_SPECS: [string, string][] = [
  ['Resolution', '1920 × 1080 · landscape'],
  ['Format', '.MOV'],
  ['Codec', 'DXV3'],
  ['File size', 'Max 8 GB'],
];
const GRAPHIC_SPECS: [string, string][] = [
  ['Resolution', '1920 × 1080 · landscape'],
  ['Format', 'PNG'],
];

/** Counted the same way the services page counts the buyout inclusions. */
const NETWORK = [
  '4 Front Door Entry — Casino Level',
  '9 Bungalows — Beachclub / Outside',
  '15 Cabanas — Beachclub / Outside',
];

function SpecRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl>
      {rows.map(([k, v], i) => (
        <div key={k} className={`flex items-baseline justify-between gap-6 py-2.5 ${i > 0 ? 'border-t border-primary/10' : ''}`}>
          <dt className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{k}</dt>
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
            One canvas, every television.
          </h1>
          <div className="mt-4 h-px w-16 bg-gradient-to-r from-primary to-transparent" />
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            The venue's twenty-eight televisions run as one narrowcasting network — the entry screens on the casino level,
            and the bungalow and cabana televisions outside. Build to the spec below and the same file plays on all of
            them, or hand us your assets and we prepare, load and test them before doors.
          </p>
        </Reveal>

        {/* THE SURFACE + SPECS */}
        <Reveal>
          <article className={panelShell}>
            <div className="aspect-[21/9] overflow-hidden bg-black">
              <img
                src={HERO_IMG}
                alt="A cabana television running the Soleia TV Guide card, the beachclub beyond the opening"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-7 sm:p-9">
              <h2 className="font-display text-2xl text-foreground">Delivery specs</h2>
              <div className="mt-6 grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Video assets</h3>
                  <SpecRows rows={VIDEO_SPECS} />
                </div>
                <div>
                  <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Graphic assets</h3>
                  <SpecRows rows={GRAPHIC_SPECS} />
                </div>
              </div>
              <div className="mt-8">
                <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">On the network · 28 screens</h3>
                <ul className="space-y-2">
                  {NETWORK.map((n) => (
                    <li key={n} className="flex gap-3 text-[14px] text-foreground">
                      <span className="flex-shrink-0 text-primary">—</span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[12.5px] italic leading-relaxed text-muted-foreground/80">
                  All twenty-eight televisions share one feed by default, so a single file covers the whole network. A
                  dedicated logo on a chosen cabana or bungalow is a separate line item — that screen is switched onto
                  its own player.
                </p>
                <p className="mt-3 text-[12.5px] italic leading-relaxed text-muted-foreground/80">
                  DXV3 is what our Resolume media servers play back. Export to ProRes or high-quality H.264 first, then
                  encode to DXV3 with Resolume Alley — it is free from{' '}
                  <a
                    href="https://resolume.com/software/alley"
                    target="_blank"
                    rel="noreferrer"
                    className="not-italic text-primary underline-offset-4 hover:underline"
                  >
                    resolume.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </article>
        </Reveal>

        {/* The composed hero already shows the TV guide on the real surface. */}
        <Reveal className="mt-6">
          <article className={`${panelShell} flex flex-wrap items-center justify-between gap-5 p-6 sm:px-8`}>
            <div>
              <h2 className="font-display text-xl text-foreground">TV delivery guide</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">Download the exact 1920 × 1080 canvas for the shared network.</p>
            </div>
            <a
              href={MAPPING_CARD_PNG}
              download="Soleia-TV-Mapping-1920x1080.png"
              className="tap-44 inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/10"
            >
              <Download className="h-3.5 w-3.5" />
              Download TV guide
            </a>
          </article>
        </Reveal>

        {/* CLOSING LINE */}
        <Reveal className="mt-10">
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            Want a specific cabana or bungalow running its own content? Individual Cabana / Bungalow Logo is available on
            the{' '}
            <button onClick={() => navigate('/creative-guide/services')} className="text-primary underline-offset-4 hover:underline">
              services page
            </button>
            {' '}— that screen comes off the shared feed and onto its own player.
          </p>
        </Reveal>
      </main>
    </div>
  );
}
