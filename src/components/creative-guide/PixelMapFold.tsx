import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Layers3, Map, MonitorCheck } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';

const PIXEL_MAP = '/creative-guide/soleia-pixelmap.png';

const STEPS = [
  {
    number: '01',
    title: 'One master canvas',
    body: 'Your content begins on one 3840 × 2160 canvas instead of fifteen separate creative decisions.',
    icon: Layers3,
  },
  {
    number: '02',
    title: 'Every surface takes its place',
    body: 'We position each wall, curve, ceiling ray and outdoor display in its exact area of that canvas.',
    icon: Map,
  },
  {
    number: '03',
    title: 'Review before load-in',
    body: 'We run your work on a 3D model of Soleia’s actual screens so you can approve coverage and pacing before show day.',
    icon: MonitorCheck,
  },
] as const;

const LEGEND = [
  ['01', 'Walls & booth'],
  ['02', 'Curves'],
  ['03', 'Ceiling rays'],
  ['04', 'Beachclub exterior'],
] as const;

export function PixelMapFold() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const step = STEPS[active];
  const Icon = step.icon;

  return (
    <Reveal>
      <article className="overflow-hidden rounded-3xl border border-primary/20 bg-card/45 surface-elevated">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-primary/15 p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
              A simple three-step process
            </p>
            <div className="space-y-2" role="tablist" aria-label="How venue mapping works">
              {STEPS.map((item, index) => {
                const StepIcon = item.icon;
                const selected = active === index;
                return (
                  <button
                    key={item.number}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActive(index)}
                    className={`tap-44 flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-[border-color,background-color,color,transform] duration-500 ${
                      selected
                        ? 'border-primary/45 bg-primary/[0.08] text-foreground'
                        : 'border-transparent text-muted-foreground hover:border-primary/20 hover:bg-primary/[0.035] hover:text-foreground'
                    }`}
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${selected ? 'border-primary/50 text-primary' : 'border-border/60'}`}>
                      <StepIcon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block font-mono text-[9px] uppercase tracking-[0.24em] text-primary/75">
                        Step {item.number}
                      </span>
                      <span className="mt-1 block font-display text-lg leading-tight">{item.title}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex min-h-[310px] items-center overflow-hidden p-7 sm:p-11">
            <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-primary/[0.07] blur-3xl" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.number}
                className="relative max-w-xl"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="grid h-14 w-14 place-items-center rounded-full border border-primary/35 bg-primary/[0.08] text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Step {step.number}</p>
                <h3 className="mt-2 font-display text-3xl leading-tight text-foreground sm:text-4xl">{step.title}</h3>
                <p className="mt-4 text-[15px] font-light leading-[1.85] text-muted-foreground">{step.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-start gap-3 border-t border-primary/15 bg-primary/[0.035] px-6 py-5 sm:px-8">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-[13.5px] leading-relaxed text-foreground">
            You approve the creative. <span className="text-muted-foreground">We handle the technical mapping.</span>
          </p>
        </div>

        <details className="group border-t border-primary/15">
          <summary className="tap-44 flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-primary sm:px-8 [&::-webkit-details-marker]:hidden">
            See the technical 3840 × 2160 map
            <ChevronDown className="h-4 w-4 transition-transform duration-500 group-open:rotate-180" />
          </summary>
          <div className="border-t border-primary/15 bg-black p-4 sm:p-7">
            <img
              src={PIXEL_MAP}
              alt="Soleia technical pixel map showing each venue surface within one 3840 by 2160 canvas"
              className="w-full"
              loading="lazy"
            />
            <div className="grid gap-px bg-primary/15 sm:grid-cols-4">
              {LEGEND.map(([number, label]) => (
                <div key={label} className="flex items-center gap-3 bg-[#09090a] px-4 py-3">
                  <span className="font-mono text-[9px] text-primary">{number}</span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </details>
      </article>
    </Reveal>
  );
}

export default PixelMapFold;
