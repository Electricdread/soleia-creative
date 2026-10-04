import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Loader2 } from 'lucide-react';
import { Crossfade } from '@/components/motion/Crossfade';
import { openPdf, renderPdfPage } from '@/lib/pdfDocument';

interface PdfSlideshowProps {
  url: string;
  /** 1-based page to show. */
  page: number;
  /** Reports the page count once the document has opened. */
  onPageCount?: (count: number) => void;
  /** Sizing lives here; the slide is contained inside it. */
  className?: string;
  alt?: string;
}

/**
 * A PDF shown one page at a time, as slides. Each page is drawn once, kept as
 * an image, and crossfaded to the next; the page after the current one is
 * drawn ahead so stepping forward does not wait.
 */
export function PdfSlideshow({ url, page, onPageCount, className = '', alt }: PdfSlideshowProps) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState<{ page: number; src: string } | null>(null);
  const cache = useRef(new Map<number, Promise<string | null>>());
  const onPageCountRef = useRef(onPageCount);
  onPageCountRef.current = onPageCount;

  useEffect(() => {
    let cancelled = false;
    let opened: PDFDocumentProxy | null = null;
    const pages = cache.current;
    setDoc(null);
    setShown(null);
    setFailed(false);
    openPdf(url)
      .then((d) => {
        opened = d;
        if (cancelled) { void d.destroy(); return; }
        setDoc(d);
        onPageCountRef.current?.(d.numPages);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      pages.forEach((p) => void p.then((src) => src && URL.revokeObjectURL(src)));
      pages.clear();
      if (opened) void opened.destroy();
    };
  }, [url]);

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    const width = Math.min(2400, Math.round(window.innerWidth * Math.min(window.devicePixelRatio || 1, 2)));
    const draw = (n: number) => {
      if (n < 1 || n > doc.numPages) return null;
      let entry = cache.current.get(n);
      if (!entry) {
        entry = renderPdfPage(doc, n, width)
          .then((blob) => (blob ? URL.createObjectURL(blob) : null))
          .catch(() => null);
        cache.current.set(n, entry);
      }
      return entry;
    };
    const target = Math.min(Math.max(page, 1), doc.numPages);
    void draw(target)?.then((src) => {
      if (cancelled) return;
      if (src) setShown({ page: target, src });
      else setFailed(true);
      void draw(target + 1);
    });
    return () => { cancelled = true; };
  }, [doc, page]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center text-white/60 text-sm ${className}`}>
        <span>
          This PDF could not be shown here.{' '}
          <a href={url} target="_blank" rel="noopener noreferrer" className="underline">Open it in a new tab</a>
        </span>
      </div>
    );
  }

  if (!shown) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <Crossfade id={shown.page} className={className}>
      <img src={shown.src} alt={alt ? `${alt}, slide ${shown.page}` : `Slide ${shown.page}`} className="h-full w-full object-contain" draggable={false} />
    </Crossfade>
  );
}

/** The first page of a PDF as an image URL, for a card with no stored thumbnail. */
export function usePdfCover(url: string | null, enabled: boolean): string | null {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!url || !enabled) return;
    let cancelled = false;
    let made: string | null = null;
    openPdf(url)
      .then(async (doc) => {
        try {
          const blob = await renderPdfPage(doc, 1, 1000);
          if (blob && !cancelled) {
            made = URL.createObjectURL(blob);
            setSrc(made);
          }
        } finally {
          void doc.destroy();
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [url, enabled]);
  return src;
}
