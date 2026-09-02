import React from 'react';
import { Reveal } from '@/components/motion/Reveal';

/**
 * The Creative Guide's section heading.
 *
 * Services and the guide landing page were set differently — different heading
 * sizes, different eyebrow treatments, a rule on one and not the other — which
 * is most of why the two read as pages built by different hands. Both now render
 * through this, so the guide is one document.
 *
 * The mono eyebrow is deliberate: the whole guide is about pixel dimensions and
 * screen geometry, and the technical face is the guide's own voice for that.
 */
export interface GuideSectionHeadProps {
  /** "01 — Included With Your Buyout". The number carries real sequence here. */
  eyebrow: string;
  title: string;
  /** One or two sentences under the rule. */
  lede?: string;
  className?: string;
}

export function GuideSectionHead({ eyebrow, title, lede, className = '' }: GuideSectionHeadProps) {
  return (
    <Reveal className={`mb-14 border-t border-primary/20 pt-6 sm:mb-16 lg:grid lg:grid-cols-12 lg:gap-8 lg:pt-8 ${className}`}>
      <div className="lg:col-span-3">
        <span className="block text-[9.5px] uppercase tracking-[0.34em] text-primary">{eyebrow}</span>
      </div>
      <div className="mt-5 lg:col-span-9 lg:mt-0">
        <h2 className="max-w-4xl font-display text-4xl leading-[0.98] tracking-[-0.025em] text-foreground sm:text-5xl lg:text-6xl">
          {title}
        </h2>
        {lede && (
          <p className="mt-6 max-w-2xl text-[15px] font-light leading-[1.8] text-muted-foreground">{lede}</p>
        )}
      </div>
    </Reveal>
  );
}

export default GuideSectionHead;
