/**
 * Keep open tabs on the current build.
 *
 * The generated service worker already uses skipWaiting + clientsClaim, so a
 * new build takes control as soon as the browser finds it. The gap is that the
 * browser only looks for a new worker on navigation — a tab left open, or a
 * client sitting on a proposal link, can serve a stale build indefinitely.
 *
 * This closes that gap: check for a new worker periodically and when the tab
 * regains focus, then reload once the new worker actually takes over.
 */

const UPDATE_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const FOCUS_THROTTLE_MS = 5 * 60 * 1000; // don't re-check on every tab switch

export function registerServiceWorkerAutoUpdate(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // A controller already present means this page is being served by a worker,
  // so a later controllerchange is a genuine update rather than the first
  // install claiming the page. Reloading on first install would be a pointless
  // refresh for every new visitor.
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  navigator.serviceWorker.ready
    .then((registration) => {
      let lastCheck = Date.now();
      const check = () => {
        lastCheck = Date.now();
        // Network hiccups and offline tabs must not surface as unhandled
        // rejections — a failed check simply means we try again later.
        registration.update().catch(() => {});
      };

      window.setInterval(check, UPDATE_INTERVAL_MS);

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        if (Date.now() - lastCheck < FOCUS_THROTTLE_MS) return;
        check();
      });
    })
    .catch(() => {
      // No registration (unsupported, or blocked by browser settings) — the app
      // still works, it just won't self-refresh.
    });
}
