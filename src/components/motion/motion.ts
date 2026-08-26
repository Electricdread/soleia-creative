import { useEffect } from 'react';

/**
 * The guide's motion tokens (owner's standard, 2026-08-26). Kept apart from
 * the components in Crossfade.tsx so that file exports components only and
 * fast refresh keeps working.
 */

/** The site's easing token — cubic-bezier(0.4, 0, 0.2, 1). */
export const MOTION_EASE = [0.4, 0, 0.2, 1] as const;

/** Photo-to-photo crossfade. Incoming and outgoing overlap; there is no hole. */
export const CROSSFADE = { in: 0.45, out: 0.55 };

/** A spring for a highlight sliding between tabs — settles fast, no bounce. */
export const HIGHLIGHT_SPRING = { type: 'spring', stiffness: 420, damping: 38, mass: 0.8 } as const;

/**
 * Ask the browser for these images now, so the crossfade they will take part
 * in never waits on the network. Cheap: the strip of thumbnails that usually
 * sits beside a viewer already asks for the same files.
 */
export function useWarmImages(srcs: readonly string[]) {
  useEffect(() => {
    if (typeof Image === 'undefined') return;
    const imgs = srcs.map((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      return img;
    });
    return () => {
      // Dropping the references lets the browser cancel anything still in flight.
      imgs.forEach((img) => (img.src = ''));
    };
  }, [srcs]);
}
