import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CROSSFADE, MOTION_EASE } from '@/components/motion/motion';

/**
 * The guide's motion standard, in one place.
 *
 * The owner's brief (2026-08-26): highlights glow, nothing hard-cuts on a
 * click, and moving between photos or slides is a crossfade — smooth on a
 * high-refresh display. Everything here animates only opacity and transform,
 * which the compositor handles on its own thread, so a 120 or 240 Hz screen
 * gets every frame it can draw. Nothing animates layout.
 *
 * `prefers-reduced-motion` renders static, the way Reveal does: content is
 * still swapped, just without the fade.
 */

export interface CrossfadeProps {
  /** Changes when the content should crossfade. */
  id: string | number;
  children: React.ReactNode;
  /** Sizing lives on this box; the layers fill it. */
  className?: string;
}

/**
 * Crossfade between keyed children. The outgoing layer fades a little slower
 * than the incoming one fades in, so the two always overlap and the box never
 * shows its background. The box must carry its own size (an aspect ratio or a
 * min-height): the layers are absolutely positioned.
 */
export function Crossfade({ id, children, className = '' }: CrossfadeProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0">{children}</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: CROSSFADE.in, ease: MOTION_EASE } }}
          exit={{ opacity: 0, transition: { duration: CROSSFADE.out, ease: MOTION_EASE } }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export interface FadeSwapProps {
  id: string | number;
  children: React.ReactNode;
  className?: string;
  /** Rise in px as it arrives. */
  y?: number;
}

/**
 * For the text beside a crossfading photo: the new copy arrives with a short
 * fade and lift. Height follows the content, so this does not layer the way
 * Crossfade does — the old copy leaves as the new one arrives.
 */
export function FadeSwap({ id, children, className = '', y = 8 }: FadeSwapProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      key={id}
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: MOTION_EASE }}
    >
      {children}
    </motion.div>
  );
}

export interface OverlayProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  label?: string;
  className?: string;
}

/**
 * A lightbox or modal that fades in over the page and scales its content up a
 * touch as it arrives, and reverses on the way out — instead of appearing and
 * vanishing in one frame. Escape and a click on the backdrop close it.
 */
export function Overlay({ open, onClose, children, label, className = '' }: OverlayProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const fade = reduceMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  const rise = reduceMotion
    ? {}
    : { initial: { opacity: 0, scale: 0.965 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.975 } };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...fade}
          transition={{ duration: 0.32, ease: MOTION_EASE }}
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 ${className}`}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <motion.div
            {...rise}
            transition={{ duration: 0.38, ease: MOTION_EASE }}
            className="relative flex max-h-full max-w-full items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
