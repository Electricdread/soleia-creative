import { useEffect } from 'react';

/**
 * Hold the page still while a full-screen layer is up.
 *
 * On iOS a finger dragged across a fixed overlay scrolls the page behind it,
 * so a lightbox drifts the guide underneath and closing it lands somewhere
 * else. Radix dialogs already guard against this; our own overlays use this.
 * Counted, so two layers open at once release only when both have closed.
 */
let locks = 0;
let saved = '';

export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    if (locks++ === 0) {
      saved = root.style.overflow;
      root.style.overflow = 'hidden';
    }
    return () => {
      if (--locks === 0) root.style.overflow = saved;
    };
  }, [active]);
}
