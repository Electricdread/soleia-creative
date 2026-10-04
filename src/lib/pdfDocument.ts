import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * pdf.js, loaded only when a PDF is actually on screen. The legacy build is
 * deliberate: the modern one needs Promise.withResolvers, which the iPads
 * clients review on do not all have.
 */
let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist/legacy/build/pdf.mjs'),
      import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs as unknown as typeof import('pdfjs-dist');
    });
  }
  return pdfjsPromise;
}

/** Open a PDF from a URL or from bytes already in hand (a file being uploaded). */
export async function openPdf(source: string | ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfjs();
  const task = typeof source === 'string' ? pdfjs.getDocument({ url: source }) : pdfjs.getDocument({ data: source });
  return task.promise;
}

/** Render one page (1-based) to a JPEG no wider than `maxWidth` pixels. */
export async function renderPdfPage(doc: PDFDocumentProxy, pageNumber: number, maxWidth: number): Promise<Blob | null> {
  const page = await doc.getPage(pageNumber);
  const natural = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: maxWidth / natural.width });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  // A page with no background of its own is white paper, not a transparent hole.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
}

/** The first page of a PDF file as a JPEG, for the item's stored thumbnail. */
export async function pdfCoverFromFile(file: File, maxWidth = 1280): Promise<Blob | null> {
  try {
    const doc = await openPdf(await file.arrayBuffer());
    try {
      return await renderPdfPage(doc, 1, maxWidth);
    } finally {
      void doc.destroy();
    }
  } catch {
    return null;
  }
}
