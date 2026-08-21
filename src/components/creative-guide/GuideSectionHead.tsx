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
    <Reveal className={`mb-11 ${className}`}>
      <span className="block font-mono text-[11px] uppercase tracking-[0.34em] text-primary">{eyebrow}</span>
      <h2 className="mt-3.5 font-display text-3xl leading-tight text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <div className="mt-4 h-px w-16 bg-gradient-to-r from-primary to-transparent" />
      {lede && (
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{lede}</p>
      )}
    </Reveal>
  );
}

export default GuideSectionHead;
