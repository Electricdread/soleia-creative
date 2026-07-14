import type jsPDF from 'jspdf';

export interface EditorialTemplate {
  id: string;
  title: string;
  description?: string | null;
  long_description?: string | null;
  deliverables?: string[] | null;
  ideal_for?: string | null;
  price: number;
  category: string | null;
  sort_order?: number | null;
  created_at?: string;
}

export interface CategoryIntro {
  name: string;
  intro: string | null;
  sort_order: number | null;
}

const GOLD: [number, number, number] = [196, 154, 60];
const INK: [number, number, number] = [24, 24, 27];
const SOFT_INK: [number, number, number] = [90, 90, 95];
const MUTED: [number, number, number] = [140, 140, 145];
const HAIR: [number, number, number] = [225, 220, 210];
const CREAM: [number, number, number] = [250, 247, 240];

const ascii = (s: string) =>
  (s || '')
    .replace(/[\u2013\u2014]/g, '-') // en/em dash
    .replace(/[\u2018\u2019]/g, "'") // curly single quotes
    .replace(/[\u201C\u201D]/g, '"') // curly double quotes
    .replace(/\u2026/g, '...')       // ellipsis
    .replace(/\u00A0/g, ' ')          // nbsp
    .replace(/[^\x20-\x7E]/g, '');


const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n || 0);

interface RenderOptions {
  /** Section-opening title on the first page. Default: "Our Services" */
  sectionTitle?: string;
  /** Section-opening kicker. Default: "The Editorial Guide" */
  sectionKicker?: string;
  /** Section-opening standfirst paragraph. */
  sectionStandfirst?: string;
}

export function renderEditorialPages(
  doc: jsPDF,
  templates: EditorialTemplate[],
  categoryIntros: CategoryIntro[] = [],
  options: RenderOptions = {}
) {
  if (!templates.length) return;

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 64;
  const contentW = pageW - marginX * 2;

  const introMap = new Map<string, CategoryIntro>();
  categoryIntros.forEach(c => introMap.set(c.name, c));

  // Group templates by category, preserving intro-defined order first
  const buckets = new Map<string, EditorialTemplate[]>();
  for (const t of templates) {
    const k = (t.category || '').trim() || 'Additional Services';
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(t);
  }
  const categories = [...buckets.keys()].sort((a, b) => {
    const sa = introMap.get(a)?.sort_order ?? 9999;
    const sb = introMap.get(b)?.sort_order ?? 9999;
    if (sa !== sb) return sa - sb;
    return a.localeCompare(b);
  });
  for (const cat of categories) {
    buckets.get(cat)!.sort((a, b) => {
      const sa = a.sort_order ?? 9999;
      const sb = b.sort_order ?? 9999;
      if (sa !== sb) return sa - sb;
      return (a.created_at || '').localeCompare(b.created_at || '');
    });
  }

  // (Section opener page intentionally removed — chapters open directly.)


  // ============ CATEGORY + ITEM PAGES ============
  let y = 0;

  const runningHeader = () => {
    doc.setTextColor(...GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('SOLEIA CREATIVE TEAM  -  SERVICES', marginX, 44);
    doc.setDrawColor(...HAIR);
    doc.setLineWidth(0.3);
    doc.line(marginX, 52, pageW - marginX, 52);
  };

  // Footers are drawn by the outer document (avoid duplicate page numbers).

  const newContentPage = () => {
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, 'F');
    runningHeader();
    y = 80;
  };


  const ensureSpace = (h: number) => {
    if (y + h > pageH - 70) newContentPage();
  };

  let chapter = 0;
  for (const cat of categories) {
    chapter++;
    const intro = introMap.get(cat)?.intro || '';
    const items = buckets.get(cat)!;

    // --- Chapter opener (compact, top of new page)
    newContentPage();

    doc.setTextColor(...GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const chapterLabel = `CHAPTER ${String(chapter).padStart(2, '0')}`;
    doc.text(chapterLabel, marginX, y);
    y += 34; // extra space so serif title ascender doesn't collide with kicker

    doc.setTextColor(...INK);
    doc.setFont('times', 'normal');
    doc.setFontSize(34);
    const catLines = doc.splitTextToSize(ascii(cat), contentW);
    catLines.forEach((ln: string) => {
      doc.text(ln, marginX, y);
      y += 40;
    });


    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.8);
    doc.line(marginX, y, marginX + 48, y);
    y += 18;

    if (intro && intro.trim()) {
      doc.setFont('times', 'italic');
      doc.setFontSize(12);
      doc.setTextColor(...SOFT_INK);
      const introLines = doc.splitTextToSize(ascii(intro), contentW - 40);
      introLines.forEach((ln: string) => {
        ensureSpace(16);
        doc.text(ln, marginX, y);
        y += 16;
      });
      y += 10;
    } else {
      y += 4;
    }

    // Editorial column geometry
    const colLeftW = contentW * 0.38;
    const colRightX = marginX + contentW * 0.44;
    const colRightW = contentW - contentW * 0.44;

    for (const item of items) {
      // Pre-measure the block
      doc.setFont('times', 'normal');
      doc.setFontSize(18);
      const titleLines = doc.splitTextToSize(ascii(item.title), colLeftW);

      doc.setFont('times', 'italic');
      doc.setFontSize(9.5);
      const idealLines = item.ideal_for
        ? doc.splitTextToSize(ascii(`Best for  -  ${item.ideal_for}`), colLeftW)
        : [];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const longText = item.long_description?.trim() || item.description?.trim() || '';
      const longLines = longText ? doc.splitTextToSize(ascii(longText), colRightW) : [];

      const deliverables = (item.deliverables || []).filter(d => d && d.trim());
      const deliverableLines: string[][] = deliverables.map(d =>
        doc.splitTextToSize(ascii(d), colRightW - 14)
      );

      const leftH =
        titleLines.length * 20 +
        10 + // gold rule + spacing
        (idealLines.length ? idealLines.length * 12 + 8 : 0) +
        18; // price line

      const rightH =
        longLines.length * 13 +
        (deliverables.length
          ? 22 + deliverableLines.reduce((sum, dl) => sum + dl.length * 12 + 4, 0)
          : 0);

      const blockH = Math.max(leftH, rightH) + 26;
      ensureSpace(blockH);

      const blockTop = y;

      // LEFT COLUMN
      let ly = blockTop + 22;
      doc.setTextColor(...INK);
      doc.setFont('times', 'normal');
      doc.setFontSize(18);
      titleLines.forEach((ln: string) => {
        doc.text(ln, marginX, ly);
        ly += 20;
      });

      // Gold hairline
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.6);
      doc.line(marginX, ly - 6, marginX + 28, ly - 6);
      ly += 6;

      if (idealLines.length) {
        doc.setFont('times', 'italic');
        doc.setFontSize(9.5);
        doc.setTextColor(...SOFT_INK);
        idealLines.forEach((ln: string) => {
          doc.text(ln, marginX, ly);
          ly += 12;
        });
        ly += 6;
      }

      // Price
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...GOLD);
      doc.text('FROM', marginX, ly);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(...INK);
      doc.text(fmt(Number(item.price) || 0), marginX + 32, ly);

      // RIGHT COLUMN
      let ry = blockTop + 22;
      if (longLines.length) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...SOFT_INK);
        longLines.forEach((ln: string) => {
          doc.text(ln, colRightX, ry);
          ry += 13;
        });
      }

      if (deliverables.length) {
        ry += 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...GOLD);
        doc.text("WHAT'S INCLUDED", colRightX, ry);
        ry += 12;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...INK);
        deliverableLines.forEach((dl, di) => {
          // Gold star bullet
          doc.setTextColor(...GOLD);
          doc.text('+', colRightX, ry);
          doc.setTextColor(...INK);
          dl.forEach((ln, li) => {
            doc.text(ln, colRightX + 14, ry);
            if (li < dl.length - 1) ry += 12;
          });
          ry += 12;
          // Small gap between bullets
          if (di < deliverableLines.length - 1) ry += 2;
        });
      }

      // Advance y to the taller column + separator
      y = Math.max(ly, ry) + 14;

      // Subtle divider between items
      doc.setDrawColor(...HAIR);
      doc.setLineWidth(0.3);
      doc.line(marginX, y, pageW - marginX, y);
      y += 14;
    }
  }
}
