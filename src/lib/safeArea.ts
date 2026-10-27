import { useEffect, useState } from 'react';

/**
 * The top safe-area inset in CSS px: the Dynamic Island / status bar of an
 * installed iPhone or iPad app, 0 in a browser tab and on desktop.
 *
 * CSS can say env(safe-area-inset-top) directly; this is for the scripts that
 * position things in px (a scroll-spy line, a scrollTo target), which would
 * otherwise sit that many pixels too high in the installed app.
 */
let probe: HTMLDivElement | null = null;

function readSafeAreaTop(): number {
  if (typeof document === 'undefined') return 0;
  if (!probe) {
    probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px)';
    document.body.appendChild(probe);
  }
  return parseFloat(getComputedStyle(probe).paddingTop) || 0;
}

export function useSafeAreaTop(): number {
  const [top, setTop] = useState(0);
  useEffect(() => {
    const update = () => setTop(readSafeAreaTop());
    update();
    // The inset changes with rotation (an iPhone has none in landscape).
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return top;
}
