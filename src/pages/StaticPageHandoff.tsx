import { useEffect } from "react";

/**
 * Paths that are static pages in public/ (the screens guide), not app routes.
 *
 * Netlify serves them directly. The app only renders here when a service
 * worker from before the path was excluded handed a returning visitor the
 * app shell instead. Drop the worker and fetch the page from the network,
 * once per tab, so a bad deploy can never loop.
 */
const StaticPageHandoff = () => {
  useEffect(() => {
    const key = `static-handoff:${window.location.pathname}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // storage blocked: still try once
    }
    const reload = () => window.location.reload();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .finally(reload);
    } else {
      reload();
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      Loading…
    </div>
  );
};

export default StaticPageHandoff;
