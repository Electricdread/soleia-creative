import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import { HIGHLIGHT_SPRING, MOTION_EASE } from '@/components/motion/motion';

/**
 * Transparent Logo Animation, explained in code rather than footage.
 *
 * The service is one idea: your mark with a real alpha channel, sitting over
 * the room while the club library keeps moving underneath. The clip that used
 * to sit here showed a client's animation at wall scale, which is impressive
 * and unreadable at card size. This shows the idea itself, with the Soleia
 * mark standing in for the client's: a photograph of the room with content on
 * every screen, a slow wash of light drifting across it the way the library
 * visuals do, and the logo held over it.
 *
 * The switch is the whole lesson. "Transparent" keeps the room alive beneath
 * the mark; "Opaque" drops a plate behind it and the room goes dark — which is
 * what a logo without an alpha channel does to a screen. A client sees the
 * difference in one tap. The real footage is still a tap away.
 */

const ROOM = '/creative-guide/services/package-full-look.jpg';
const MARK = '/soleia-logo-color.png';

type Mode = 'transparent' | 'opaque';

export interface TransparentLogoDemoProps {
  /** Opens the real clip full screen. */
  onFullscreen?: () => void;
  className?: string;
}

export function TransparentLogoDemo({ onFullscreen, className = '' }: TransparentLogoDemoProps) {
  const [mode, setMode] = useState<Mode>('transparent');
  const reduceMotion = useReducedMotion();
  const opaque = mode === 'opaque';
  const ease = { duration: 0.6, ease: MOTION_EASE };

  return (
    <div className={className}>
      <div className="relative aspect-[16/9.4] overflow-hidden bg-black">
        {/* The room, with content on every screen */}
        <img src={ROOM} alt="The Soleia main room with a custom look on every screen" className="media-grade absolute inset-0 h-full w-full object-cover" loading="lazy" />
        {/* The club library, moving underneath: two slow washes of light */}
        {!reduceMotion && (
          <>
            <div className="wash wash-a" aria-hidden="true" />
            <div className="wash wash-b" aria-hidden="true" />
          </>
        )}
        <div className="media-veil absolute inset-0" aria-hidden="true" />

        {/* The plate an opaque logo brings with it */}
        <motion.div
          initial={false}
          animate={{ opacity: opaque ? 1 : 0 }}
          transition={ease}
          className="absolute inset-x-[14%] inset-y-[18%] rounded-md bg-[#07060a] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
          aria-hidden="true"
        />

        {/* The mark */}
        <div className="absolute left-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2">
          <motion.img
            src={MARK}
            alt="The Soleia mark held over the room"
            animate={reduceMotion ? undefined : { scale: [1, 1.025, 1] }}
            transition={reduceMotion ? undefined : { duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="w-full"
            style={{ filter: 'drop-shadow(0 0 18px hsl(var(--primary) / 0.45)) drop-shadow(0 4px 14px rgba(0,0,0,0.6))' }}
          />
        </div>

        {/* What you are looking at */}
        <motion.span
          key={mode}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: MOTION_EASE }}
          className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/65 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-white backdrop-blur-md sm:left-5 sm:top-5"
        >
          {opaque ? 'Opaque · the screen goes dark behind it' : 'Transparent · the room keeps moving'}
        </motion.span>

        {onFullscreen && (
          <button
            type="button"
            onClick={onFullscreen}
            className="btn-glow tap-44 absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3.5 py-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white backdrop-blur-sm hover:bg-black/80"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            See it on the wall
          </button>
        )}
      </div>

      {/* The switch */}
      <div className="flex items-center gap-2 border-t border-primary/15 px-5 py-3 sm:px-7" role="tablist" aria-label="Logo treatment">
        {(
          [
            ['transparent', 'Transparent'],
            ['opaque', 'Opaque'],
          ] as [Mode, string][]
        ).map(([m, label]) => {
          const on = m === mode;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setMode(m)}
              className={`tab-glow relative rounded-full border px-4 py-2 text-[10.5px] uppercase tracking-[0.18em] ${
                on ? 'border-primary/60 text-primary' : 'border-border/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {on && (
                <motion.span
                  layoutId={reduceMotion ? undefined : 'transparent-logo-mode'}
                  transition={HIGHLIGHT_SPRING}
                  className="glow-ring pointer-events-none absolute inset-0 rounded-full bg-primary/12"
                  aria-hidden="true"
                />
              )}
              <span className="relative">{label}</span>
            </button>
          );
        })}
        <span className="ml-auto hidden text-[12px] text-muted-foreground/80 sm:block">Tap to compare.</span>
      </div>
    </div>
  );
}

export default TransparentLogoDemo;
