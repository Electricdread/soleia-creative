import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Scroll-reveal wrapper — the site's restrained, interface-led motion primitive.
 *
 * Follows the Technical Brand Geometry motion spec: ~500ms timing on the
 * cubic-bezier(0.4, 0, 0.2, 1) easing, single play (`once`), subtle upward
 * translate. Honors `prefers-reduced-motion` by rendering the content statically
 * with no transform or fade, so the "minimal" motion level never becomes a
 * barrier for motion-sensitive users.
 */

// Spec easing token (cubic-bezier(0.4, 0, 0.2, 1)).
const EASE = [0.4, 0, 0.2, 1] as const;

export interface RevealProps {
  children: React.ReactNode;
  /** Stagger offset in seconds. */
  delay?: number;
  /** Initial vertical offset in px. */
  y?: number;
  /** Fraction of the element that must be in view before it plays. */
  amount?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, y = 22, amount = 0.2, className = '' }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;
