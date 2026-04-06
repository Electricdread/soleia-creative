import jsPDF from 'jspdf';

interface ProposalData {
  event_name: string;
  client_name: string;
  venue_name?: string | null;
  event_date?: string | null;
  quote_date?: string;
  validity_days?: number;
  contact_email?: string | null;
  signed_at?: string | null;
  client_signature?: string | null;
  status?: string;
}

interface ProposalItem {
  title: string;
  description?: string | null;
  price: number;
  quantity: number;
  category?: string | null;
  unit?: string | null;
  is_flat_fee?: boolean;
}

interface TimelinePhase {
  phase: string;
  duration: string;
  details?: string | null;
}

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

const DARK = '#1a1a1a';
const GOLD = '#c49a3c';
const GRAY = '#7f8c8d';
const LIGHT_GRAY = '#95a5a6';
const TEXT = '#2c3e50';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawSoleiaText(doc: jsPDF, x: number, y: number, size: number, color: string) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size);
  doc.setTextColor(color);
  doc.text('SOLEIA', x, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size * 0.35);
  doc.text('CREATIVE TEAM', x, y + size * 0.45, { align: 'center' });
}

async function generateCoverPage(doc: jsPDF, proposal: ProposalData, coverImageUrl: string) {
  // Dark background
  doc.setFillColor(DARK);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Try to load cover image
  const imgData = await loadImageAsBase64(coverImageUrl);
  if (imgData) {
    try {
      // Draw image centered with some padding, semi-transparent effect via overlay
      const imgY = 140;
      const imgH = 380;
      doc.addImage(imgData, 'JPEG', MARGIN, imgY, CONTENT_W, imgH);
      // Dark overlay gradient effect (top and bottom)
      doc.setFillColor(DARK);
      doc.setGState(new (doc as any).GState({ opacity: 0.6 }));
      doc.rect(MARGIN, imgY, CONTENT_W, 60, 'F');
      doc.rect(MARGIN, imgY + imgH - 60, CONTENT_W, 60, 'F');
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
    } catch {
      // Image failed, continue without
    }
  }

  // Logo at top
  drawSoleiaText(doc, PAGE_W / 2, 60, 28, '#ffffff');

  // Gold line
  doc.setDrawColor(GOLD);
  doc.setLineWidth(1);
  doc.line(PAGE_W / 2 - 40, 90, PAGE_W / 2 + 40, 90);

  // PROPOSAL badge
  doc.setFontSize(10);
  doc.setTextColor(GOLD);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSAL', PAGE_W / 2, 108, { align: 'center' });

  // Event info at bottom
  const bottomY = 580;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor('#ffffff');
  doc.text(proposal.event_name, PAGE_W / 2, bottomY, { align: 'center', maxWidth: CONTENT_W });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(LIGHT_GRAY);
  doc.text(`Prepared for ${proposal.client_name}`, PAGE_W / 2, bottomY + 30, { align: 'center' });

  if (proposal.venue_name) {
    doc.setFontSize(12);
    doc.text(`at ${proposal.venue_name}`, PAGE_W / 2, bottomY + 48, { align: 'center' });
  }

  if (proposal.event_date) {
    doc.setFontSize(11);
    doc.setTextColor(GOLD);
    doc.text(formatDate(proposal.event_date), PAGE_W / 2, bottomY + 68, { align: 'center' });
  }
}

interface GalleryImage {
  image_url: string;
  caption?: string | null;
}

export async function generateProposalPdf(
  proposal: ProposalData,
  items: ProposalItem[],
  timeline: TimelinePhase[],
  coverImageUrl?: string | null,
  galleryImages?: GalleryImage[]
) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  let y = 0;

  // === COVER PAGE (optional) ===
  if (coverImageUrl) {
    await generateCoverPage(doc, proposal, coverImageUrl);
    doc.addPage();
  }

  // === CONTENT PAGE ===
  // Dark header band
  doc.setFillColor(DARK);
  doc.rect(0, 0, PAGE_W, 70, 'F');

  // Logo in header
  drawSoleiaText(doc, 80, 30, 16, '#ffffff');

  // PROPOSAL badge
  doc.setFillColor(GOLD);
  doc.roundedRect(PAGE_W - MARGIN - 80, 22, 80, 24, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor('#ffffff');
  doc.text('PROPOSAL', PAGE_W - MARGIN - 40, 38, { align: 'center' });

  // Event info below header
  y = 95;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(TEXT);
  doc.text(proposal.event_name, MARGIN, y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(GRAY);
  const metaParts = [`Prepared for ${proposal.client_name}`];
  if (proposal.venue_name) metaParts.push(`at ${proposal.venue_name}`);
  if (proposal.event_date) metaParts.push(`· ${formatDate(proposal.event_date)}`);
  doc.text(metaParts.join(' '), MARGIN, y);

  y += 12;
  doc.setFontSize(8);
  doc.setTextColor(LIGHT_GRAY);
  const quoteDate = proposal.quote_date || new Date().toISOString().split('T')[0];
  doc.text(`Quote Date: ${formatDate(quoteDate)}  |  Valid for ${proposal.validity_days || 7} days`, MARGIN, y);

  // === SCOPE TABLE ===
  y += 20;
  doc.setDrawColor('#ecf0f1');
  doc.setLineWidth(0.5);

  // Table header
  doc.setFillColor('#f8f9fa');
  doc.rect(MARGIN, y, CONTENT_W, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(LIGHT_GRAY);

  const colX = { item: MARGIN + 6, type: MARGIN + CONTENT_W * 0.55, price: MARGIN + CONTENT_W - 6 };
  doc.text('ITEM', colX.item, y + 12);
  doc.text('TYPE', colX.type, y + 12);
  doc.text('PRICE', colX.price, y + 12, { align: 'right' });
  y += 18;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  let lastCategory = '';

  for (const item of items) {
    const lineTotal = item.is_flat_fee ? Number(item.price) : Number(item.price) * Number(item.quantity || 1);
    const needsCategory = item.category && item.category !== lastCategory;
    if (item.category) lastCategory = item.category;

    // Check page break
    const rowH = item.description ? 28 : 18;
    if (y + rowH > PAGE_H - 120) {
      doc.addPage();
      y = MARGIN;
    }

    if (needsCategory) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(GOLD);
      doc.text(item.category!.toUpperCase(), colX.item, y + 11);
      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
    }

    // Row line
    doc.setDrawColor('#f0f3f5');
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y);

    doc.setTextColor(TEXT);
    doc.setFont('helvetica', 'bold');
    doc.text(item.title, colX.item, y + 12, { maxWidth: CONTENT_W * 0.5 });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(GRAY);
    if (item.is_flat_fee) {
      doc.text('Flat Fee', colX.type, y + 12);
    } else {
      doc.text(`${item.quantity || 1} × ${item.unit || 'Unit'}`, colX.type, y + 12);
    }

    doc.setTextColor(TEXT);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(lineTotal), colX.price, y + 12, { align: 'right' });

    if (item.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(LIGHT_GRAY);
      doc.text(item.description, colX.item, y + 22, { maxWidth: CONTENT_W * 0.75 });
      doc.setFontSize(8.5);
      y += rowH;
    } else {
      y += 18;
    }
  }

  // Total row
  y += 4;
  doc.setFillColor(DARK);
  doc.rect(MARGIN, y, CONTENT_W, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor('#ffffff');
  doc.text('TOTAL', colX.item, y + 16);
  const grandTotal = items.reduce((sum, i) => sum + (i.is_flat_fee ? Number(i.price) : Number(i.price) * Number(i.quantity || 1)), 0);
  doc.text(formatCurrency(grandTotal), colX.price, y + 16, { align: 'right' });
  y += 34;

  // === TIMELINE (horizontal dots) ===
  if (timeline.length > 0) {
    if (y + 60 > PAGE_H - 80) { doc.addPage(); y = MARGIN; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(TEXT);
    doc.text('TIMELINE', MARGIN, y + 4);
    y += 14;

    const dotSpacing = CONTENT_W / timeline.length;
    for (let i = 0; i < timeline.length; i++) {
      const cx = MARGIN + dotSpacing * i + dotSpacing / 2;

      // Connector line
      if (i < timeline.length - 1) {
        doc.setDrawColor('#ecf0f1');
        doc.setLineWidth(1);
        doc.line(cx + 4, y + 4, cx + dotSpacing - 4, y + 4);
      }

      // Dot
      doc.setFillColor(GOLD);
      doc.circle(cx, y + 4, 3, 'F');

      // Phase name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(TEXT);
      doc.text(timeline[i].phase, cx, y + 16, { align: 'center', maxWidth: dotSpacing - 8 });

      // Duration
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(GRAY);
      doc.text(timeline[i].duration, cx, y + 24, { align: 'center' });
    }
    y += 36;
  }

  // === TERMS (2-column) ===
  if (y + 80 > PAGE_H - 40) { doc.addPage(); y = MARGIN; }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(TEXT);
  doc.text('TERMS & CONDITIONS', MARGIN, y + 4);
  y += 14;

  const terms = [
    'Creative licensing covers event duration only.',
    'Logo animations include up to 2 revision rounds.',
    'Content delivery via secure cloud links.',
    'All branding assets due 21 days before event.',
    'Payment terms: 50% deposit, 50% upon delivery.',
    'Cancellation policy applies per signed agreement.',
  ];

  const colWidth = (CONTENT_W - 12) / 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(GRAY);

  for (let i = 0; i < terms.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const tx = MARGIN + col * (colWidth + 12);
    const ty = y + row * 12;
    doc.text(`• ${terms[i]}`, tx, ty, { maxWidth: colWidth });
  }

  y += Math.ceil(terms.length / 2) * 12 + 8;

  // === SIGNATURE (if signed) ===
  if (proposal.signed_at && proposal.client_signature) {
    if (y + 40 > PAGE_H - 20) { doc.addPage(); y = MARGIN; }

    doc.setFillColor('#f0fdf4');
    doc.rect(MARGIN, y, CONTENT_W, 32, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor('#16a34a');
    doc.text(`✓ Accepted by ${proposal.client_signature}`, MARGIN + 10, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor('#4ade80');
    doc.text(`Signed on ${formatDate(proposal.signed_at.split('T')[0])}`, MARGIN + 10, y + 24);
  }

  // === REFERENCE IMAGES GRID PAGE ===
  const images = galleryImages?.filter(g => g.image_url) || [];
  if (images.length > 0) {
    doc.addPage();

    // Dark header band
    doc.setFillColor(DARK);
    doc.rect(0, 0, PAGE_W, 50, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor('#ffffff');
    doc.text('REFERENCE IMAGES', MARGIN, 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(LIGHT_GRAY);
    doc.text('Creative direction references — final designs are rebuilt for production', PAGE_W - MARGIN, 32, { align: 'right' });

    let gridY = 65;
    const cols = 2;
    const gap = 12;
    const cellW = (CONTENT_W - gap * (cols - 1)) / cols;
    const cellH = 180;
    const captionH = 18;

    // Load all images in parallel
    const imageDataArr = await Promise.all(images.map(img => loadImageAsBase64(img.image_url)));

    for (let i = 0; i < images.length; i++) {
      const col = i % cols;
      const x = MARGIN + col * (cellW + gap);

      // Page break check
      if (col === 0 && gridY + cellH + captionH > PAGE_H - 40) {
        doc.addPage();
        gridY = MARGIN;
      }

      const imgData = imageDataArr[i];

      // Image container with rounded corners
      doc.setFillColor('#f8f9fa');
      doc.roundedRect(x, gridY, cellW, cellH, 4, 4, 'F');

      if (imgData) {
        try {
          doc.addImage(imgData, 'JPEG', x + 2, gridY + 2, cellW - 4, cellH - 4);
        } catch {
          // Show placeholder
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(LIGHT_GRAY);
          doc.text('Image unavailable', x + cellW / 2, gridY + cellH / 2, { align: 'center' });
        }
      }

      // Border
      doc.setDrawColor('#ecf0f1');
      doc.setLineWidth(0.5);
      doc.roundedRect(x, gridY, cellW, cellH, 4, 4, 'S');

      // Caption
      if (images[i].caption) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(GRAY);
        doc.text(images[i].caption!, x + 4, gridY + cellH + 11, { maxWidth: cellW - 8 });
      }

      // Advance Y after every 2 images
      if (col === cols - 1) {
        gridY += cellH + captionH + gap;
      }
    }

    // Handle odd last row
    if (images.length % cols !== 0) {
      gridY += cellH + captionH + gap;
    }
  }

  // === FOOTER on all pages ===
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const footerY = PAGE_H - 25;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(LIGHT_GRAY);
    doc.text('Soleia Creative Team', PAGE_W / 2, footerY, { align: 'center' });
    doc.text(proposal.contact_email || 'luisdreamslv@gmail.com', PAGE_W / 2, footerY + 10, { align: 'center' });
  }

  // Set metadata
  doc.setProperties({
    title: `Proposal - ${proposal.event_name}`,
    subject: `Proposal for ${proposal.client_name}`,
    author: 'Soleia Creative Team',
  });

  doc.save(`Proposal_${proposal.event_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
