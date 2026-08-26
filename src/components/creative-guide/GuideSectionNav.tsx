import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HIGHLIGHT_SPRING } from '@/components/motion/motion';

/**
 * The Services page's section spine.
 *
 * Services is long, and it is read in two very different ways: a client opens it
 * alone from the pre-call packet and needs to see the shape of what is coming,
 * and the creative team drives it live on the call and needs to jump straight to
 * a section. One sticky, scroll-spying bar answers both.
 *
 * It pins with `position: fixed` rather than `position: sticky`, because the
 * stylesheet sets `overflow-x: hidden` on `html, body` under 640px as a
 * horizontal-overflow safety net. That turns `body` into a scroll container,
 * and a sticky descendant then measures against a box that never scrolls — so
 * the bar simply scrolled away on phones while working on desktop. A measured
 * spacer holds the row height while the bar is pinned, so nothing jumps.
 *
 * It is a scroll listener rather than an IntersectionObserver on purpose — the
 * sections here differ wildly in height (a tabbed venue viewer next to a
 * four-row table), and "the last section whose heading has passed the bar" is
 * the behaviour that matches what the reader sees. Threshold-based observers
 * skip short sections entirely.
 */

export interface GuideSection {
  id: string;
  /** Short enough to read in a chip. */
  label: string;
}

export interface GuideSectionNavProps {
  sections: GuideSection[];
  /**
   * Distance from the top of the viewport the bar sits at, in px. The guide
   * header measures 66px tall once it goes solid, at every breakpoint, so the
   * bar parks directly beneath it rather than tucking under its lower edge.
   */
  offset?: number;
}

export function GuideSectionNav({ sections, offset = 66 }: GuideSectionNavProps) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? '');
  const [stuck, setStuck] = useState(false);
  const [barH, setBarH] = useState(0);
  const slotRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Measure the bar once so pinning it can reserve the same height and the page
  // does not jump by a row as it detaches.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const measure = () => setBarH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const slot = slotRef.current;
      if (slot) setStuck(slot.getBoundingClientRect().top <= offset);

      // The section currently being read is the last one whose top edge has
      // travelled above the bar. A generous margin keeps a heading from
      // flickering between two entries as it crosses.
      const line = offset + 90;
      let current = sections[0]?.id ?? '';
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = s.id;
      }

      // At the very bottom the final section may be too short to ever cross the
      // line, so pin it explicitly.
      const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 4;
      if (atBottom) current = sections[sections.length - 1]?.id ?? current;

      setActive(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [sections, offset]);

  // Keep the active chip in view on narrow screens, where the bar scrolls.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const chip = list.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (!chip) return;
    const cl = chip.offsetLeft;
    const cr = cl + chip.offsetWidth;
    if (cl < list.scrollLeft || cr > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: cl - 16, behavior: 'smooth' });
    }
  }, [active]);

  const go = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - (offset + 26);
      window.scrollTo({ top, behavior: 'smooth' });
    },
    [offset],
  );

  return (
    <div ref={slotRef} style={stuck && barH ? { height: barH } : undefined}>
      <div
        ref={barRef}
        className={
          stuck
            ? 'fixed inset-x-0 z-40 glass border-y border-primary/15'
            : 'relative border-y border-transparent'
        }
        style={stuck ? { top: offset } : undefined}
      >
        <div
          ref={listRef}
          className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-5 py-2.5 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {sections.map((s, i) => {
            const on = s.id === active;
            return (
              <button
                key={s.id}
                data-chip={s.id}
                onClick={() => go(s.id)}
                aria-current={on ? 'true' : undefined}
                className={`relative flex-shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[10.5px] uppercase tracking-[0.16em] transition-colors duration-500 ${
                  on ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {/* One highlight that slides to the section being read, so the
                    bar moves with the page instead of blinking chip to chip. */}
                {on && (
                  <motion.span
                    layoutId={reduceMotion ? undefined : 'guide-section-nav-highlight'}
                    transition={HIGHLIGHT_SPRING}
                    className="pointer-events-none absolute inset-0 rounded-full bg-primary/15 shadow-[0_0_18px_-4px_hsl(var(--primary)/0.45)]"
                    aria-hidden="true"
                  />
                )}
                <span className="relative">
                  <span className="mr-1.5 font-mono opacity-60">{String(i + 1).padStart(2, '0')}</span>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GuideSectionNav;
