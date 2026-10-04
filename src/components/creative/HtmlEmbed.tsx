import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface HtmlEmbedProps {
  url: string;
  title: string;
  /**
   * 'preview' draws the page at a fixed 1280x720 and scales it to the box, with
   * no pointer input: a live thumbnail. 'full' fills the box and takes input.
   */
  mode: 'preview' | 'full';
  className?: string;
}

const PREVIEW_W = 1280;
const PREVIEW_H = 720;

/**
 * An uploaded HTML file, running inside the session.
 *
 * Storage serves .html as plain text, so the file is fetched and handed to the
 * frame as `srcdoc`. The sandbox allows scripts and nothing else: with no
 * `allow-same-origin` the page runs in an origin of its own and cannot reach
 * this app's storage, session or DOM, and it cannot open windows, submit forms
 * or navigate the tab. That also means the file must be self-contained; files
 * referenced beside it do not exist here, while absolute URLs (fonts, a CDN
 * script) load normally.
 */
export function HtmlEmbed({ url, title, mode, className = '' }: HtmlEmbedProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setFailed(false);
    fetch(url)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((text) => { if (!cancelled) setHtml(text); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [url]);

  useEffect(() => {
    if (mode !== 'preview' || !boxRef.current) return;
    const el = boxRef.current;
    const measure = () => setScale(el.clientWidth / PREVIEW_W);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);

  const frame = html !== null && (
    <iframe
      title={title}
      srcDoc={html}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      loading={mode === 'preview' ? 'lazy' : undefined}
      tabIndex={mode === 'preview' ? -1 : undefined}
      // index.css caps every iframe at max-width 100% and height auto below 640px; this one is sized on purpose.
      className="border-0 bg-white"
      style={
        mode === 'preview'
          ? { width: PREVIEW_W, height: PREVIEW_H, maxWidth: 'none', transform: `scale(${scale})`, transformOrigin: '0 0', pointerEvents: 'none' }
          : { width: '100%', height: '100%', maxWidth: 'none' }
      }
    />
  );

  return (
    <div
      ref={boxRef}
      className={`relative overflow-hidden ${className}`}
      style={mode === 'preview' ? { aspectRatio: `${PREVIEW_W} / ${PREVIEW_H}` } : undefined}
    >
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          This file could not be loaded.
        </div>
      ) : html === null ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : mode === 'preview' ? (
        <div className="absolute left-0 top-0">{scale > 0 && frame}</div>
      ) : (
        frame
      )}
    </div>
  );
}
