import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import solIcon from '@/assets/sol-icon.png';
import servicesPage1 from '@/assets/docs/services-page-1.jpg';
import presentationPage1 from '@/assets/docs/presentation-page-1.jpg';

const DOCS: Record<
  string,
  { title: string; pages: string[]; pdf: string; download: string }
> = {
  services: {
    title: 'Soleia Creative Services',
    pages: [servicesPage1],
    pdf: '/Soleia-Creative-Services-No-Pricing.pdf',
    download: 'Soleia-Creative-Services.pdf',
  },
  presentation: {
    title: 'Soleia Presentation Guide',
    pages: [presentationPage1],
    pdf: '/Soleia-Presentation-Guide.pdf',
    download: 'Soleia-Presentation-Guide.pdf',
  },
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

const clamp = (v: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v));

export default function DocumentViewer() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const doc = slug ? DOCS[slug] : undefined;

  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* fullscreen unavailable */
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') setZoom((z) => clamp(z * 1.15));
      else if (e.key === '-' || e.key === '_') setZoom((z) => clamp(z / 1.15));
      else if (e.key === '0') setZoom(1);
      else if (e.key.toLowerCase() === 'f') toggleFullscreen();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [toggleFullscreen]);

  // Ctrl/pinch wheel zoom (non-passive so preventDefault works)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      setZoom(clamp(zoomRef.current * Math.exp(-dy * 0.0015)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [doc]);

  if (!doc) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Document not found.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-auto">
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-2 px-3 sm:px-8 py-3 glass border-b border-primary/15">
        {!isFullscreen ? (
          <button
            onClick={() => navigate('/creative-guide/services')}
            className="tap-44 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px] uppercase tracking-[0.2em]">Services</span>
          </button>
        ) : (
          <span className="w-8" />
        )}

        <img src={solIcon} alt="Soleia" className="h-8 w-auto object-contain hidden sm:block" />

        <div className="flex items-center gap-1 sm:gap-2">
          <div
            className="flex items-center gap-1 rounded-full border border-primary/30 px-1"
            role="group"
            aria-label="Zoom controls"
          >
            <button
              onClick={() => setZoom((z) => clamp(z / 1.15))}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out"
              className="tap-44 min-h-11 min-w-11 inline-flex items-center justify-center text-primary disabled:opacity-40"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span
              className="text-[11px] tabular-nums text-muted-foreground w-11 text-center"
              aria-live="polite"
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => clamp(z * 1.15))}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom in"
              className="tap-44 min-h-11 min-w-11 inline-flex items-center justify-center text-primary disabled:opacity-40"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              aria-label="Reset zoom"
              className="tap-44 min-h-11 min-w-11 inline-flex items-center justify-center text-muted-foreground hover:text-primary"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit reading mode' : 'Enter fullscreen reading mode'}
            className="tap-44 min-h-11 min-w-11 inline-flex items-center justify-center rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <a
            href={doc.pdf}
            download={doc.download}
            aria-label="Download PDF"
            className="tap-44 min-h-11 inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 text-[11px] uppercase tracking-[0.2em] text-primary hover:bg-primary/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>
        </div>
      </header>

      <main className="pt-24 pb-24 px-3 sm:px-8">
        {!isFullscreen && (
          <h1 className="font-display text-3xl sm:text-4xl text-center mb-8">{doc.title}</h1>
        )}
        <div
          className="mx-auto space-y-6 origin-top transition-transform duration-150"
          style={{ maxWidth: '56rem', transform: `scale(${zoom})` }}
        >
          {doc.pages.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${doc.title} — page ${i + 1}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="w-full h-auto rounded-xl border border-border/60 shadow-sm bg-white"
            />
          ))}
        </div>
        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          + / − to zoom · 0 to reset · F for fullscreen
        </p>
      </main>
    </div>
  );
}
