import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { CreativeGuideHeader } from '@/components/creative-guide/CreativeGuideHeader';

const INTERIOR_IMG = '/creative-guide/elevator/interior.jpg';
const MAPPING_CARD_IMG = '/creative-guide/elevator/mapping-card-600x800.png';
const ELEVATOR_LOOP_URL = '/creative-guide/elevator/loop.mp4';

const VIDEO_SPECS: [string, string][] = [
  ['Resolution', '600 × 800 · portrait'],
  ['Frame rate', '30 fps'],
  ['Format', 'WMV'],
  ['Duration', '30 sec'],
];

const GRAPHIC_SPECS: [string, string][] = [
  ['Resolution', '600 × 800 · portrait'],
  ['Format', 'PNG or JPG'],
  ['Color', 'RGB'],
  ['File count', '1 still'],
];

const DELIVERABLES = [
  '(1) 30-sec video for elevator moving up',
  '(1) 30-sec video for elevator moving down',
  '(1) still graphic for elevator idling',
];

function SpecRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl>
      {rows.map(([key, value], index) => (
        <div key={key} className={`flex items-baseline justify-between gap-6 py-2.5 ${index > 0 ? 'border-t border-primary/10' : ''}`}>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{key}</dt>
          <dd className="text-right font-mono text-[13px] tracking-[0.05em] text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ElevatorVisual({ mode }: { mode: 'static' | 'motion' }) {
  return (
    <div className="relative aspect-[1097/1466] w-full self-start overflow-hidden border-b border-primary/15 bg-black lg:border-b-0 lg:border-r">
      <img
        src={INTERIOR_IMG}
        alt={mode === 'motion' ? 'Soleia elevator with animated content placed inside the portrait display' : 'Soleia elevator with the static pixel-map artwork placed inside the portrait display'}
        className="absolute inset-0 h-full w-full object-contain"
      />
      <div className="absolute left-[15.1%] top-[25.4%] h-[15.55%] w-[12.35%] overflow-hidden rounded-[1px] bg-black shadow-[0_0_12px_hsl(var(--primary)/0.24)]">
        {mode === 'motion' ? (
          <video
            src={ELEVATOR_LOOP_URL}
            poster="/creative-guide/elevator/loop-poster.jpg"
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={MAPPING_CARD_IMG} alt="Elevator 600 by 800 static pixel-map artwork" className="h-full w-full object-cover" />
        )}
      </div>
    </div>
  );
}

export default function ElevatorDisplayGuide() {
  const navigate = useNavigate();
  const panelShell = 'card-elevated overflow-hidden rounded-3xl border border-primary/15 bg-card/40 surface-elevated';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CreativeGuideHeader />

      <main className="mx-auto max-w-5xl px-5 pb-32 pt-32 sm:px-8">
        <Reveal className="mb-12">
          <span className="block font-mono text-[11px] uppercase tracking-[0.34em] text-primary">Arrival · Elevator Displays</span>
          <h1 className="mt-4 font-display text-4xl leading-[1.08] text-foreground sm:text-5xl">The first surface guests see.</h1>
          <div className="mt-4 h-px w-16 bg-gradient-to-r from-primary to-transparent" />
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Choose a static arrival logo or a dynamic sequence. Both are shown below inside the actual portrait display,
            so the format and final placement are clear before you download a template or deliver an asset.
          </p>
        </Reveal>

        <Reveal>
          <article className={`${panelShell} grid lg:grid-cols-[430px_1fr]`}>
            <ElevatorVisual mode="static" />
            <div className="flex flex-col justify-center p-7 sm:p-9">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Option 01 · Static logo</span>
              <h2 className="mt-2 font-display text-3xl text-foreground">A polished arrival mark.</h2>
              <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
                One portrait graphic remains on the display while the elevator is idle. It is the simplest way to establish
                the event identity before guests reach the venue.
              </p>
              <div className="mt-7">
                <SpecRows rows={GRAPHIC_SPECS} />
              </div>
              <a
                href={MAPPING_CARD_IMG}
                download="Soleia-Elevator-Mapping-600x800.png"
                className="tap-44 mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/10"
              >
                <Download className="h-3.5 w-3.5" />
                Download 600 × 800 guide
              </a>
            </div>
          </article>
        </Reveal>

        <Reveal className="mt-6">
          <article className={`${panelShell} grid lg:grid-cols-[430px_1fr]`}>
            <ElevatorVisual mode="motion" />
            <div className="flex flex-col justify-center p-7 sm:p-9">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Option 02 · Dynamic animation</span>
              <h2 className="mt-2 font-display text-3xl text-foreground">Motion between every ride.</h2>
              <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
                The animation is shown directly inside the real elevator display. Build the sequence to the portrait format,
                or let the Soleia team map and test it for you.
              </p>
              <div className="mt-7">
                <SpecRows rows={VIDEO_SPECS} />
              </div>
              <div className="mt-7 border-t border-primary/15 pt-6">
                <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Total deliverables · 3 files</h3>
                <ul className="space-y-2">
                  {DELIVERABLES.map((deliverable) => (
                    <li key={deliverable} className="flex gap-3 text-[13.5px] text-foreground">
                      <span className="shrink-0 text-primary">—</span>
                      <span>{deliverable}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[12px] italic leading-relaxed text-muted-foreground/80">
                  Up and down may use the same animation. Match the idle graphic to the first frame for a seamless transition.
                </p>
              </div>
            </div>
          </article>
        </Reveal>

        <Reveal className="mt-10">
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            Prefer we build it? Elevator Dynamic Animation and Elevator Static Logo are available on the{' '}
            <button onClick={() => navigate('/creative-guide/services')} className="text-primary underline-offset-4 hover:underline">services page</button>
            {' '}— delivered mapped, tested and ready for arrival.
          </p>
        </Reveal>
      </main>
    </div>
  );
}
