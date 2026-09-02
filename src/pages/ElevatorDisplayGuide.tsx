import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { CreativeGuideHeader } from '@/components/creative-guide/CreativeGuideHeader';
import { CreativeGuideFooter } from '@/components/creative-guide/CreativeGuideFooter';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION_EASE } from '@/components/motion/motion';
import solIcon from '@/assets/sol-icon.png';

// Asset paths shared with the services page.
const INTERIOR_IMG = '/creative-guide/elevator/interior.jpg';
const MAPPING_CARD_IMG = '/creative-guide/elevator/mapping-card-600x800.png';
const ELEVATOR_LOOP_URL = '/creative-guide/elevator/loop.mp4';

// Official delivery spec (source: Creative Guide — Elevator Displays).
const VIDEO_SPECS: [string, string][] = [
  ['Resolution', '600 × 800 · portrait'],
  ['Frame rate', '30 fps'],
  ['Format', 'WMV'],
  ['Duration', '30 sec'],
];
const GRAPHIC_SPECS: [string, string][] = [
  ['Resolution', '600 × 800 · portrait'],
  ['Format', 'PNG or JPG'],
];
const DELIVERABLES = [
  '(1) 30-sec video or graphic file for elevator moving up',
  '(1) 30-sec video or graphic file for elevator moving down',
  '(1) still graphic for elevator idling',
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

export default function ElevatorDisplayGuide() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const panelShell = 'card-elevated overflow-hidden rounded-3xl border border-primary/15 bg-card/40 surface-elevated';

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <CreativeGuideHeader />

      {/* The delivery layout below stays deliberately familiar; this hero simply
          brings the display-spec page into the new Guide's visual system. */}
      <section className="relative flex min-h-[66vh] items-end overflow-hidden">
        <motion.img
          src={INTERIOR_IMG}
          alt="Soleia elevator interior — branded portrait display beside the doors"
          initial={reduceMotion ? false : { opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: MOTION_EASE }}
          className="media-grade absolute inset-0 h-full w-full object-cover object-[58%_50%]"
        />
        <div className="media-veil absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-background" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/70 to-transparent" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-5xl px-5 pb-16 pt-36 sm:px-8 sm:pb-20">
          <Reveal>
            <span className="block font-mono text-[11px] uppercase tracking-[0.34em] text-primary">Arrival · Elevator Displays</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.06] text-foreground sm:text-6xl">
              The first surface <span className="text-gradient-gold">guests see.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              A portrait display that sets the arrival moment. Build to the spec, or hand us your assets and we map,
              QC and test them on the actual panel before doors.
            </p>
          </Reveal>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5 pb-32 pt-20 sm:px-8">
        <Reveal className="mb-10">
          <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-primary">01 — Your elevator canvas</span>
          <h2 className="mt-3 font-display text-3xl leading-tight text-foreground sm:text-4xl">Build it once. Let it carry the arrival.</h2>
          <div className="mt-4 h-px w-16 bg-gradient-to-r from-primary to-transparent" />
        </Reveal>

        {/* INTERIOR + SPECS */}
        <Reveal>
          <article className={`${panelShell} grid lg:grid-cols-[420px_1fr]`}>
            <div className="relative min-h-[380px] overflow-hidden border-b border-primary/15 lg:min-h-[560px] lg:border-b-0 lg:border-r">
              <img src={INTERIOR_IMG} alt="Soleia elevator interior — the branded portrait display beside the doors" className="absolute inset-0 h-full w-full object-cover" />
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
                <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Total deliverables · 3 files</h3>
                <ul className="space-y-2">
                  {DELIVERABLES.map((d) => (
                    <li key={d} className="flex gap-3 text-[14px] text-foreground">
                      <span className="flex-shrink-0 text-primary">—</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[12.5px] italic leading-relaxed text-muted-foreground/80">
                  Up/down content may be the same file if preferred. For smooth transitions, we recommend using the first
                  frame of your video as the idle graphic.
                </p>
              </div>
            </div>
          </article>
        </Reveal>

        {/* MAPPING CARD + LOOP PREVIEW */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Reveal>
            <article className={`${panelShell} flex h-full flex-col`}>
              <div className="flex flex-1 items-center justify-center bg-black/40 p-8">
                <img
                  src={MAPPING_CARD_IMG}
                  alt="Elevator mapping card — 600 × 800 portrait canvas"
                  className="max-h-[520px] w-auto rounded-lg border border-primary/30 shadow-[0_0_34px_-6px_hsl(var(--primary)/0.35)]"
                />
              </div>
              <div className="border-t border-primary/15 p-6 sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl text-foreground">Mapping card</h2>
                    <p className="mt-1 text-[13px] text-muted-foreground">The exact 600 × 800 canvas your content is built on.</p>
                  </div>
                  <a
                    href={MAPPING_CARD_IMG}
                    download="Soleia-Elevator-Mapping-600x800.png"
                    className="tap-44 inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/10"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </div>
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.05}>
            <article className={`${panelShell} flex h-full flex-col`}>
              <div className="flex flex-1 items-center justify-center bg-black/40 p-8">
                <video
                  src={ELEVATOR_LOOP_URL}
                  poster="/creative-guide/elevator/loop-poster.jpg"
                  className="aspect-[3/4] max-h-[520px] w-auto rounded-lg border border-primary/30 object-cover shadow-[0_0_34px_-6px_hsl(var(--primary)/0.35)]"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                />
              </div>
              <div className="border-t border-primary/15 p-6 sm:px-8">
                <h2 className="font-display text-xl text-foreground">Mapping card in motion</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  The same 600 × 800 canvas animated, so you can see how motion reads on the panel's portrait format.
                </p>
              </div>
            </article>
          </Reveal>
        </div>

        {/* CLOSING LINE */}
        <Reveal className="mt-10">
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            Prefer we build it? Elevator Dynamic Animation and Elevator Static Logo are available on the{' '}
            <button onClick={() => navigate('/creative-guide/services')} className="text-primary underline-offset-4 hover:underline">
              services page
            </button>
            {' '}— delivered mapped, tested, and running on show day.
          </p>
        </Reveal>
      </main>

      <CreativeGuideFooter />
    </div>
  );
}
