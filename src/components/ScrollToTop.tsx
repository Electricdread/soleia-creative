import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Start every navigation at the top of the page.
 *
 * A single-page app keeps the existing scroll position when the route changes,
 * so following a link from halfway down one page drops you halfway down the
 * next. This resets to the top on navigation, with two exceptions:
 *
 *  - a hash target (/creative-guide#specs) scrolls to that element instead,
 *    which is what makes the guide's section links work from any sub-page;
 *  - browser back/forward restores the previous position, as users expect.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // POP is back/forward — leave the browser's own restoration alone.
    if (navigationType === 'POP') return;

    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      // The target may not be mounted on the first frame after a route change,
      // so try immediately and once more after paint before giving up.
      const scrollToTarget = () => {
        const el = document.getElementById(id);
        if (!el) return false;
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
        return true;
      };
      if (scrollToTarget()) return;
      const raf = requestAnimationFrame(() => {
        if (!scrollToTarget()) window.scrollTo(0, 0);
      });
      return () => cancelAnimationFrame(raf);
    }

    window.scrollTo(0, 0);
  }, [pathname, hash, navigationType]);

  return null;
}

export default ScrollToTop;
