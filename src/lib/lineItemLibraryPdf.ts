import jsPDF from 'jspdf';

export interface LineItemTemplate {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
}

const GOLD = '#c49a3c';
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n || 0);

// Strip non-ASCII so jsPDF default fonts render cleanly
const ascii = (s: string) => (s || '').replace(/[^\x20-\x7E]/g, '');

export function generateLineItemLibraryPdf(templates: LineItemTemplate[]): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 48;
  let y = 0;

  // Header band
  doc.setFillColor(15, 15, 17);
  doc.rect(0, 0, pageW, 90, 'F');
  doc.setFillColor(GOLD);
  doc.rect(0, 90, pageW, 2, 'F');

  doc.setTextColor(GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SOLEIA CREATIVE TEAM', marginX, 38);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(20);
  doc.text('Line Item Library', marginX, 66);

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(9);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`${templates.length} item${templates.length === 1 ? '' : 's'}  ${String.fromCharCode(0xB7)}  ${dateStr}`, marginX, 80);

  y = 120;

  // Group by category
  const grouped = new Map<string, LineItemTemplate[]>();
  for (const t of templates) {
    const k = t.category?.trim() || 'Uncategorized';
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(t);
  }
  const categories = [...grouped.keys()].sort((a, b) => a.localeCompare(b));

  const ensureSpace = (h: number) => {
    if (y + h > pageH - 60) {
      doc.addPage();
      y = 60;
    }
  };

  for (const cat of categories) {
    ensureSpace(40);
    // Category header
    doc.setFillColor(245, 243, 238);
    doc.rect(marginX, y, pageW - marginX * 2, 22, 'F');
    doc.setTextColor(80, 60, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(ascii(cat).toUpperCase(), marginX + 10, y + 15);
    y += 30;

    // Column headers
    doc.setTextColor(140, 140, 140);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('ITEM', marginX, y);
    doc.text('PRICE', pageW - marginX, y, { align: 'right' });
    y += 6;
    doc.setDrawColor(220, 220, 220);
    doc.line(marginX, y, pageW - marginX, y);
    y += 12;

    for (const item of grouped.get(cat)!) {
      const titleLines = doc.splitTextToSize(ascii(item.title), pageW - marginX * 2 - 90);
      const descLines = item.description
        ? doc.splitTextToSize(ascii(item.description), pageW - marginX * 2 - 90)
        : [];
      const rowH = titleLines.length * 12 + descLines.length * 11 + 10;
      ensureSpace(rowH);

      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(titleLines, marginX, y);

      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(fmt(Number(item.price) || 0), pageW - marginX, y, { align: 'right' });

      let lineY = y + titleLines.length * 12;

      if (descLines.length) {
        doc.setTextColor(110, 110, 110);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(descLines, marginX, lineY);
        lineY += descLines.length * 11;
      }

      y = lineY + 8;
      doc.setDrawColor(235, 235, 235);
      doc.line(marginX, y, pageW - marginX, y);
      y += 8;
    }

    y += 10;
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(`${i} / ${pageCount}`, pageW - marginX, pageH - 24, { align: 'right' });
    doc.text('soleiacreative.app', marginX, pageH - 24);
  }

  return doc;
}

export function downloadLineItemLibraryPdf(templates: LineItemTemplate[]) {
  const doc = generateLineItemLibraryPdf(templates);
  const date = new Date().toISOString().split('T')[0];
  doc.save(`soleia-line-item-library-${date}.pdf`);
}

export function printLineItemLibraryPdf(templates: LineItemTemplate[]) {
  const doc = generateLineItemLibraryPdf(templates);
  doc.autoPrint();
  const url = doc.output('bloburl');
  const win = window.open(url, '_blank');
  if (!win) {
    // Fallback: download
    downloadLineItemLibraryPdf(templates);
  }
}
