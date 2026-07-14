import jsPDF from 'jspdf';

export interface LineItemTemplate {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
}

const GOLD: [number, number, number] = [196, 154, 60];
const INK: [number, number, number] = [24, 24, 27];
const SOFT_INK: [number, number, number] = [90, 90, 95];
const MUTED: [number, number, number] = [140, 140, 145];
const HAIR: [number, number, number] = [225, 220, 210];
const CREAM: [number, number, number] = [250, 247, 240];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n || 0);

// Strip non-ASCII so jsPDF default fonts render cleanly
const ascii = (s: string) => (s || '').replace(/[^\x20-\x7E]/g, '');

export function generateLineItemLibraryPdf(templates: LineItemTemplate[]): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 64;
  const contentW = pageW - marginX * 2;

  // ============ COVER PAGE ============
  // Cream background
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Thin gold frame
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.rect(36, 36, pageW - 72, pageH - 72);

  // Top wordmark
  doc.setTextColor(...GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SOLEIA CREATIVE TEAM', pageW / 2, 110, { align: 'center' });

  // Hairline under wordmark
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(pageW / 2 - 30, 120, pageW / 2 + 30, 120);

  // Editorial serif title
  doc.setTextColor(...INK);
  doc.setFont('times', 'normal');
  doc.setFontSize(48);
  doc.text('Services', pageW / 2, pageH / 2 - 40, { align: 'center' });
  doc.setFont('times', 'italic');
  doc.setFontSize(36);
  doc.text('& Investment', pageW / 2, pageH / 2 + 4, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SOFT_INK);
  const year = new Date().getFullYear();
  doc.text(`PRICING GUIDE  ${String.fromCharCode(0xB7)}  ${year}`, pageW / 2, pageH / 2 + 40, { align: 'center' });

  // Bottom mark
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.text('soleiacreative.app', pageW / 2, pageH - 70, { align: 'center' });

  // ============ CONTENT PAGES ============
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, 'F');

  let y = 90;

  const drawPageHeader = () => {
    doc.setTextColor(...GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('SOLEIA CREATIVE TEAM', marginX, 50);
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.text('Services & Investment', pageW - marginX, 50, { align: 'right' });
    doc.setDrawColor(...HAIR);
    doc.setLineWidth(0.4);
    doc.line(marginX, 60, pageW - marginX, 60);
  };
  drawPageHeader();

  const ensureSpace = (h: number) => {
    if (y + h > pageH - 80) {
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageW, pageH, 'F');
      drawPageHeader();
      y = 90;
    }
  };

  // Group by category (preserve original order of first appearance)
  const grouped = new Map<string, LineItemTemplate[]>();
  for (const t of templates) {
    const k = t.category?.trim() || 'Additional Services';
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(t);
  }
  const categories = [...grouped.keys()];

  for (const cat of categories) {
    ensureSpace(70);

    // Category header — elegant serif with gold rule
    doc.setTextColor(...INK);
    doc.setFont('times', 'italic');
    doc.setFontSize(20);
    doc.text(ascii(cat), marginX, y);

    y += 10;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.6);
    doc.line(marginX, y, marginX + 40, y);
    y += 24;

    const items = grouped.get(cat)!;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const priceStr = fmt(Number(item.price) || 0);
      const priceW = doc.getTextWidth(priceStr) + 4;
      const titleMaxW = contentW - priceW - 20;

      const titleLines = doc.splitTextToSize(ascii(item.title), titleMaxW);
      const descLines = item.description
        ? doc.splitTextToSize(ascii(item.description), contentW - 20)
        : [];

      const rowH = titleLines.length * 13 + descLines.length * 12 + (descLines.length ? 8 : 0) + 18;
      ensureSpace(rowH);

      // Title
      doc.setTextColor(...INK);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(titleLines, marginX, y);

      // Price (right)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...INK);
      doc.text(priceStr, pageW - marginX, y, { align: 'right' });

      let lineY = y + titleLines.length * 13;

      if (descLines.length) {
        doc.setFont('times', 'italic');
        doc.setFontSize(9.5);
        doc.setTextColor(...SOFT_INK);
        lineY += 4;
        doc.text(descLines, marginX, lineY);
        lineY += descLines.length * 12;
      }

      y = lineY + 12;

      // Divider (skip after last item in category)
      if (i < items.length - 1) {
        doc.setDrawColor(...HAIR);
        doc.setLineWidth(0.3);
        doc.line(marginX, y - 4, pageW - marginX, y - 4);
        y += 6;
      }
    }

    y += 26;
  }

  // Closing note
  ensureSpace(80);
  y += 10;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(pageW / 2 - 24, y, pageW / 2 + 24, y);
  y += 22;
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...SOFT_INK);
  doc.text('Pricing is a guide; final proposals are tailored to each engagement.', pageW / 2, y, { align: 'center' });

  // Page footers (skip cover)
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`${i - 1} / ${pageCount - 1}`, pageW - marginX, pageH - 40, { align: 'right' });
    doc.text('soleiacreative.app', marginX, pageH - 40);
  }

  return doc;
}

export function downloadLineItemLibraryPdf(templates: LineItemTemplate[]) {
  const doc = generateLineItemLibraryPdf(templates);
  const date = new Date().toISOString().split('T')[0];
  doc.save(`soleia-price-sheet-${date}.pdf`);
}

export function printLineItemLibraryPdf(templates: LineItemTemplate[]) {
  const doc = generateLineItemLibraryPdf(templates);
  doc.autoPrint();
  const url = doc.output('bloburl');
  const win = window.open(url, '_blank');
  if (!win) {
    downloadLineItemLibraryPdf(templates);
  }
}
