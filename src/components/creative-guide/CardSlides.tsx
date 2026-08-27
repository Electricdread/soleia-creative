import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Crossfade } from '@/components/motion/Crossfade';
import { HIGHLIGHT_SPRING } from '@/components/motion/motion';

/**
 * Two or three slides inside one service card — the service itself, then the
 * thing that explains it — with a slim switcher above them.
 *
 * Each slide is a complete block (its media and its own row of controls), and
 * every slide must render at the same height, so the card never jumps as the
 * highlight glides from one to the next. Slides crossfade like everything
 * else in the guide.
 */

export interface CardSlide {
  id: string;
  label: string;
  node: React.ReactNode;
}

export interface CardSlidesProps {
  slides: CardSlide[];
  /**
   * The height every slide shares, as a class on the crossfade box — the
   * media's aspect ratio plus the control row beneath it, e.g.
   * "box-content aspect-[16/9] pb-[58px]" is a 16:9 picture over a 58px bar.
   * box-content matters: with border-box the padding would eat into the
   * aspect box instead of adding the bar beneath it.
   */
  frameClassName: string;
  /** Distinct per card on the page; framer needs it for the sliding highlight. */
  layoutId: string;
}

export function CardSlides({ slides, frameClassName, layoutId }: CardSlidesProps) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const slide = slides[Math.min(index, slides.length - 1)];

  return (
    <div>
      <div className="flex items-center gap-1.5 border-b border-primary/15 px-4 py-2 sm:px-5" role="tablist" aria-label="Card slides">
        {slides.map((s, i) => {
          const on = i === index;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setIndex(i)}
              className={`tab-glow relative rounded-full px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] ${
                on ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {on && (
                <motion.span
                  layoutId={reduceMotion ? undefined : layoutId}
                  transition={HIGHLIGHT_SPRING}
                  className="pointer-events-none absolute inset-0 rounded-full bg-primary/12 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.45)]"
                  aria-hidden="true"
                />
              )}
              <span className="relative">
                <span className="mr-1.5 opacity-60">{String(i + 1).padStart(2, '0')}</span>
                {s.label}
              </span>
            </button>
          );
        })}
        <span className="ml-auto inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            aria-label="Previous slide"
            className="btn-glow inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:shadow-none"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}
            disabled={index === slides.length - 1}
            aria-label="Next slide"
            className="btn-glow inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:shadow-none"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>

      <Crossfade id={slide.id} className={frameClassName}>
        {slide.node}
      </Crossfade>
    </div>
  );
}

/**
 * The owner's Logo Integration Guide: an opaque mark with a plate against a
 * moving background beside the same mark with an alpha channel. The slide
 * every logo service shares, because the difference is the one thing a
 * client's designer has to get right before anything can be mapped.
 */
const EXPLAINER_IMG = '/creative-guide/services/logo-integration-guide.jpg';

export function LogoExplainerSlide({ caption }: { caption: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#2b2a2a]">
        <img
          src={EXPLAINER_IMG}
          alt="Logo integration guide — an opaque logo blocks the moving background; a transparent PNG with alpha blends into it"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="flex h-[58px] items-center border-t border-primary/15 px-5 sm:px-7">
        <p className="truncate text-[12px] leading-relaxed text-muted-foreground">{caption}</p>
      </div>
    </div>
  );
}

export default CardSlides;
