import jsPDF from 'jspdf';
import soleiaWideLogo from '@/assets/soleia-wide-logo.png';

const LOGO_ASPECT = 1006 / 345; // width / height
let cachedLogoDataUri: string | null = null;
async function getSoleiaLogoDataUri(): Promise<string | null> {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  try {
    const res = await fetch(`${soleiaWideLogo}?v=${Date.now()}`, { cache: 'no-store' });
    const blob = await res.blob();
    const uri: string = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    cachedLogoDataUri = uri;
    return uri;
  } catch {
    return null;
  }
}


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
  proposal_scenario?: 'pre_call_packet' | 'pre_packet_no_call' | 'direct_quote' | null;
  is_pre_call_packet?: boolean | null;
}


interface ProposalItem {
  title: string;
  description?: string | null;
  price: number;
  quantity: number;
  category?: string | null;
  unit?: string | null;
  is_flat_fee?: boolean;
  client_selected?: boolean;
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

import { calcLineTotal as sharedLineTotal } from './proposalTotals';

function itemTotal(item: ProposalItem) {
  return sharedLineTotal(item as any);
}

function proposalTotal(items: ProposalItem[]) {
  return items.reduce((sum, item) => sum + itemTotal(item), 0);
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const bustedUrl = url + (url.includes('?') ? '&' : '?') + `_=${Date.now()}`;
    const res = await fetch(bustedUrl, { signal: controller.signal, cache: 'no-store' });
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

async function generateCoverPage(doc: jsPDF, proposal: ProposalData, coverImageUrl: string, grandTotal: number) {
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
  const logoUri = await getSoleiaLogoDataUri();
  if (logoUri) {
    const lw = 180;
    const lh = lw / LOGO_ASPECT;
    doc.addImage(logoUri, 'PNG', PAGE_W / 2 - lw / 2, 36, lw, lh);
  } else {
    drawSoleiaText(doc, PAGE_W / 2, 60, 28, '#ffffff');
  }


  // Gold line
  doc.setDrawColor(GOLD);
  doc.setLineWidth(1);
  doc.line(PAGE_W / 2 - 40, 90, PAGE_W / 2 + 40, 90);

  // Label
  doc.setFontSize(10);
  doc.setTextColor(GOLD);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSAL', PAGE_W / 2, 108, { align: 'center' });

  // === BOTTOM TEXT BLOCK (dynamically measured) ===
  const titleMaxW = CONTENT_W - 40;

  // Auto-shrink title to fit in ≤2 lines if possible (cap at 3 lines)
  let titleSize = 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(titleSize);
  let titleLines: string[] = doc.splitTextToSize(proposal.event_name, titleMaxW);
  for (const trySize of [26, 22]) {
    if (titleLines.length <= 2) break;
    titleSize = trySize;
    doc.setFontSize(titleSize);
    titleLines = doc.splitTextToSize(proposal.event_name, titleMaxW);
  }
  if (titleLines.length > 3) titleLines = titleLines.slice(0, 3);

  const titleLH = titleSize * 1.1;
  const preparedLH = 18;
  const venueLH = 16;
  const dateLH = 16;

  const titleBlockH = titleLines.length * titleLH;
  const preparedH = preparedLH;
  const venueH = proposal.venue_name ? venueLH : 0;
  const dateH = proposal.event_date ? dateLH + 6 : 0; // small gap before gold date

  const totalTextH = titleBlockH + 14 + preparedH + venueH + dateH;
  const bottomPad = 80;
  const startY = PAGE_H - bottomPad - totalTextH;

  // Soft dark scrim behind text band for readability
  const scrimY = startY - 24;
  const scrimH = PAGE_H - scrimY;
  try {
    doc.setFillColor(DARK);
    doc.setGState(new (doc as any).GState({ opacity: 0.55 }));
    doc.rect(0, scrimY, PAGE_W, scrimH, 'F');
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
  } catch {
    // GState unsupported — skip scrim
  }

  // Title (wrapped, drawn line by line)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(titleSize);
  doc.setTextColor('#ffffff');
  let cursorY = startY + titleLH - titleSize * 0.2;
  for (const ln of titleLines) {
    doc.text(ln, PAGE_W / 2, cursorY, { align: 'center' });
    cursorY += titleLH;
  }

  // Prepared for
  cursorY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(LIGHT_GRAY);
  doc.text(`Prepared for ${proposal.client_name}`, PAGE_W / 2, cursorY, { align: 'center' });
  cursorY += preparedLH;

  // Venue
  if (proposal.venue_name) {
    doc.setFontSize(11);
    doc.text(`at ${proposal.venue_name}`, PAGE_W / 2, cursorY, { align: 'center' });
    cursorY += venueLH;
  }

  // Date
  if (proposal.event_date) {
    cursorY += 6;
    doc.setFontSize(11);
    doc.setTextColor(GOLD);
    doc.text(formatDate(proposal.event_date), PAGE_W / 2, cursorY, { align: 'center' });
    cursorY += 22;
  }

  if (grandTotal > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor('#ffffff');
    doc.text(`Proposal Total: ${formatCurrency(grandTotal)}`, PAGE_W / 2, cursorY, { align: 'center' });
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
  galleryImages?: GalleryImage[],
  options?: { returnBase64?: boolean; filename?: string }
) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  // Single source of truth: the accepted/quoted scope is ALWAYS items where
  // client_selected === true (set at signing time, or by admin pre-selection
  // when generating a draft). Never fall back to "all items" or the stored
  // total_amount snapshot — that's how the $10,000 ghost total kept coming back.
  const signed = !!proposal.signed_at;
  const selectedItems = items.filter(i => i.client_selected === true);
  if (signed) {
    items = selectedItems;
  }
  const grandTotal = proposalTotal(selectedItems);
  let y = 0;

  // === COVER PAGE (optional) ===
  if (coverImageUrl) {
    await generateCoverPage(doc, proposal, coverImageUrl, grandTotal);
    doc.addPage();
  }

  // === CONTENT PAGE ===
  // Dark header band
  doc.setFillColor(DARK);
  doc.rect(0, 0, PAGE_W, 70, 'F');

  // Logo in header
  const headerLogoUri = await getSoleiaLogoDataUri();
  if (headerLogoUri) {
    const lh = 28;
    const lw = lh * LOGO_ASPECT;
    doc.addImage(headerLogoUri, 'PNG', MARGIN, 21, lw, lh);
  } else {
    drawSoleiaText(doc, 80, 30, 16, '#ffffff');
  }

  // Right-side label
  const badgeLabel = 'PROPOSAL';
  const badgeW = Math.max(80, doc.getTextWidth(badgeLabel) + 24);
  doc.setFillColor(GOLD);
  doc.roundedRect(PAGE_W - MARGIN - badgeW, 22, badgeW, 24, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor('#ffffff');
  doc.text(badgeLabel, PAGE_W - MARGIN - badgeW / 2, 38, { align: 'center' });

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

  y += 18;
  doc.setFillColor('#faf8f4');
  doc.rect(MARGIN, y, CONTENT_W, 34, 'F');
  doc.setFillColor(GOLD);
  doc.rect(MARGIN, y, 3, 34, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(GRAY);
  doc.text('PROPOSAL TOTAL', MARGIN + 12, y + 21);
  doc.setFontSize(16);
  doc.setTextColor(TEXT);
  doc.text(formatCurrency(grandTotal), PAGE_W - MARGIN - 10, y + 22, { align: 'right' });


  // === CONTRACT INCLUSIONS BAND ===
  y += 46;
  const inclH = 44;
  doc.setFillColor('#faf8f4');
  doc.rect(MARGIN, y, CONTENT_W, inclH, 'F');
  doc.setFillColor(GOLD);
  doc.rect(MARGIN, y, 3, inclH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(GOLD);
  doc.text('INCLUDED IN YOUR VENUE CONTRACT', MARGIN + 12, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT);
  doc.text('• Up to 10 static logos — LED screens', MARGIN + 12, y + 24);
  doc.text('• 1 static logo — all TVs, Cabanas & Bungalows', MARGIN + 12, y + 35);
  y += inclH + 10;

  const tableItems = items;

  // === SCOPE TABLE ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(TEXT);
  doc.text('SERVICES', MARGIN, y);
  y += 8;
  doc.setDrawColor('#ecf0f1');
  doc.setLineWidth(0.5);

  // Column geometry — fixed anchors so columns never collide
  const COL_ITEM_X = MARGIN + 6;
  const COL_ITEM_W = CONTENT_W * 0.58 - 12;
  const COL_TYPE_RIGHT = MARGIN + CONTENT_W * 0.78;
  const COL_PRICE_RIGHT = MARGIN + CONTENT_W - 6;

  // Table header
  doc.setFillColor('#f8f9fa');
  doc.rect(MARGIN, y, CONTENT_W, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(LIGHT_GRAY);
  doc.text('ITEM', COL_ITEM_X, y + 10);
  doc.text('TYPE', COL_TYPE_RIGHT, y + 10, { align: 'right' });
  doc.text('PRICE', COL_PRICE_RIGHT, y + 10, { align: 'right' });
  y += 14;

  // Spacing constants — tightened for single-page fit
  const TITLE_SIZE = 8.5;
  const DESC_SIZE = 7;
  const TITLE_LH = 10;
  const DESC_LH = 8;
  const ROW_TOP_PAD = 3;
  const ROW_BOTTOM_PAD = 3;
  const TITLE_DESC_GAP = 2;
  const SECTION_HEADER_H = 12;

  let lastCategory = '';

  for (const item of tableItems) {
    const lineTotal = itemTotal(item);
    const needsCategory = !!item.category && item.category !== lastCategory;
    if (item.category) lastCategory = item.category;

    // Pre-measure wrapped text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(TITLE_SIZE);
    const titleLines: string[] = doc.splitTextToSize(item.title, COL_ITEM_W);

    let descLines: string[] = [];
    if (item.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(DESC_SIZE);
      descLines = doc.splitTextToSize(item.description, COL_ITEM_W);
    }

    const titleBlockH = titleLines.length * TITLE_LH;
    const descBlockH = descLines.length > 0 ? TITLE_DESC_GAP + descLines.length * DESC_LH : 0;
    const rowH = ROW_TOP_PAD + titleBlockH + descBlockH + ROW_BOTTOM_PAD;
    const sectionH = needsCategory ? SECTION_HEADER_H : 0;

    // Page break check — reserve for total (28) + timeline (32 if any) + terms (~46) + footer (30)
    const reserve = 30 + 46 + (timeline.length > 0 ? 32 : 0) + 28;
    if (y + sectionH + rowH > PAGE_H - reserve) {
      doc.addPage();
      y = MARGIN;
    }

    // Section header
    if (needsCategory) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(GOLD);
      doc.text(item.category!.toUpperCase(), COL_ITEM_X, y + 10);
      y += SECTION_HEADER_H;
    }

    // Top divider line
    doc.setDrawColor('#f0f3f5');
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y);

    // Title (wrapped, left column)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(TITLE_SIZE);
    doc.setTextColor(TEXT);
    let textY = y + ROW_TOP_PAD + TITLE_LH - 2;
    for (const ln of titleLines) {
      doc.text(ln, COL_ITEM_X, textY);
      textY += TITLE_LH;
    }

    // Description (wrapped, left column, smaller + lighter)
    if (descLines.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(DESC_SIZE);
      doc.setTextColor(LIGHT_GRAY);
      let descY = y + ROW_TOP_PAD + titleBlockH + TITLE_DESC_GAP + DESC_LH - 2;
      for (const ln of descLines) {
        doc.text(ln, COL_ITEM_X, descY);
        descY += DESC_LH;
      }
    }

    // Type column (right-aligned at COL_TYPE_RIGHT, vertically aligned with title)
    const rightColY = y + ROW_TOP_PAD + TITLE_LH - 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(TITLE_SIZE);
    doc.setTextColor(GRAY);
    const typeText = item.is_flat_fee ? 'Flat Fee' : `${item.quantity || 1} × ${item.unit || 'Unit'}`;
    doc.text(typeText, COL_TYPE_RIGHT, rightColY, { align: 'right' });

    // Price column (right-aligned at COL_PRICE_RIGHT)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT);
    doc.text(formatCurrency(lineTotal), COL_PRICE_RIGHT, rightColY, { align: 'right' });

    y += rowH;
  }

  // === TOTAL ===
  if (y + 28 > PAGE_H - 80) { doc.addPage(); y = MARGIN; }
  doc.setDrawColor('#ecf0f1');
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 4;
  doc.setFillColor('#faf8f4');
  doc.rect(MARGIN, y, CONTENT_W, 22, 'F');
  doc.setFillColor(GOLD);
  doc.rect(MARGIN, y, 3, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(GRAY);
  doc.text('TOTAL', MARGIN + 12, y + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(TEXT);
  doc.text(formatCurrency(grandTotal), PAGE_W - MARGIN - 6, y + 15, { align: 'right' });
  y += 28;



  // === TIMELINE (horizontal dots) ===
  if (timeline.length > 0) {
    if (y + 50 > PAGE_H - 70) { doc.addPage(); y = MARGIN; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(TEXT);
    doc.text('TIMELINE', MARGIN, y + 4);
    y += 12;

    const dotSpacing = CONTENT_W / timeline.length;
    for (let i = 0; i < timeline.length; i++) {
      const cx = MARGIN + dotSpacing * i + dotSpacing / 2;

      if (i < timeline.length - 1) {
        doc.setDrawColor('#ecf0f1');
        doc.setLineWidth(1);
        doc.line(cx + 4, y + 4, cx + dotSpacing - 4, y + 4);
      }

      doc.setFillColor(GOLD);
      doc.circle(cx, y + 4, 2.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(TEXT);
      doc.text(timeline[i].phase, cx, y + 14, { align: 'center', maxWidth: dotSpacing - 8 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(GRAY);
      doc.text(timeline[i].duration, cx, y + 22, { align: 'center' });
    }
    y += 30;
  }

  // === TERMS (2-column) ===
  if (y + 80 > PAGE_H - 40) { doc.addPage(); y = MARGIN; }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(TEXT);
  doc.text('TERMS & CONDITIONS', MARGIN, y + 4);
  y += 14;

  const terms = [
    'Work begins only after sign-off and all brand assets received.',
    '14 days from kickoff to first review cut delivery.',
    'Client review window: 3 days from delivery.',
    'One included revision round.',
    'Final revision requests due no later than 4 days before event.',
    'Creative licensing covers event duration only.',
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
    doc.text('Reference mockups — final designs are rebuilt for production', PAGE_W - MARGIN, 32, { align: 'right' });

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

  const safeName = proposal.event_name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = options?.filename || `Proposal_${safeName}.pdf`;
  if (options?.returnBase64) {
    // Strip the "data:application/pdf;filename=...;base64," prefix
    const dataUri = doc.output('datauristring', { filename }) as string;
    const base64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
    return { base64, filename };
  }
  doc.save(filename);
  return { base64: '', filename };
}
