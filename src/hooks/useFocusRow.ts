import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Scrolls the row named by `?focus=<id>` into view and rings it briefly.
 *
 * Dashboard rows and search results used to navigate to a bare list route,
 * throwing away the id they already held — so you landed on a list and re-found
 * by eye the thing you had just clicked. Every list marks its rows with
 * `data-focus-id`, and this brings the right one to you.
 *
 * @param ready pass the page's loaded flag; the row does not exist until the
 *              list has rendered.
 */
export function useFocusRow(ready: boolean) {
  const [params, setParams] = useSearchParams();
  const focusId = params.get('focus');

  useEffect(() => {
    if (!ready || !focusId) return;

    // The list renders in the same commit that flips `ready`, so wait a frame
    // for the DOM before looking for the row.
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-focus-id="${CSS.escape(focusId)}"]`);
      if (!el) return;

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      el.classList.add('focus-flash');

      window.setTimeout(() => {
        el.classList.remove('focus-flash');
        // Drop the param so a refresh does not replay the flash.
        setParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete('focus');
            return next;
          },
          { replace: true },
        );
      }, 2400);
    });

    return () => cancelAnimationFrame(raf);
    // setParams is stable across renders; including it would re-run on every
    // query-string change and cancel the flash it just started.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, focusId]);
}
