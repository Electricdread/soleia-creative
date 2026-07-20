import jsPDF from 'jspdf';

export interface RateCardAddon {
  title: string;
  price: number;
}

const IVORY: [number, number, number] = [247, 242, 234];
const GOLD: [number, number, number] = [177, 137, 63];
const GOLD_DEEP: [number, number, number] = [154, 111, 42];
const GOLD_TINT: [number, number, number] = [243, 233, 210];
const INK: [number, number, number] = [58, 51, 42];
const SOFT_INK: [number, number, number] = [110, 100, 85];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n || 0);

const ascii = (s: string) =>
  (s || '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00B7/g, '-')
    .replace(/\u00D7/g, 'x')
    .replace(/[^\x20-\x7E]/g, '');

export function generateRateCardPdf(addons: RateCardAddon[] = []): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Ivory background
  doc.setFillColor(...IVORY);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Decorative double-hairline gold border
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.rect(30, 30, pageW - 60, pageH - 60);
  doc.setLineWidth(0.3);
  doc.rect(36, 36, pageW - 72, pageH - 72);

  const cx = pageW / 2;
  let y = 76;

  // Wordmark
  doc.setFont('times', 'normal');
  doc.setFontSize(30);
  doc.setTextColor(...INK);
  doc.text('SOLEIA', cx, y, { align: 'center' });
  y += 6;
  // small gold sun mark
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.circle(cx, y + 6, 3);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GOLD_DEEP);
  doc.text('L A S   V E G A S', cx, y, { align: 'center' });

  // Tagline
  y += 22;
  doc.setFontSize(7.5);
  doc.setTextColor(...SOFT_INK);
  doc.text('C R E A T I V E   S E R V I C E S   &   R A T E   C A R D', cx, y, { align: 'center' });

  // Title
  y += 30;
  doc.setFont('times', 'normal');
  doc.setFontSize(22);
  doc.setTextColor(...INK);
  const titlePre = 'Soleia Creative ';
  const titlePost = ' Immersive LED';
  const preW = doc.getTextWidth(titlePre);
  const ampW = (() => {
    doc.setFont('times', 'italic');
    return doc.getTextWidth('&');
  })();
  doc.setFont('times', 'normal');
  const postW = doc.getTextWidth(titlePost);
  const totalW = preW + ampW + postW;
  let tx = cx - totalW / 2;
  doc.setFont('times', 'normal');
  doc.text(titlePre, tx, y);
  tx += preW;
  doc.setFont('times', 'italic');
  doc.setTextColor(...GOLD_DEEP);
  doc.text('&', tx, y);
  tx += ampW;
  doc.setFont('times', 'normal');
  doc.setTextColor(...INK);
  doc.text(titlePost, tx, y);

  // Subtitle
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...SOFT_INK);
  doc.text('E N V I R O N M E N T S   -   B R A N D E D   O V E R L A Y S   -   M A P P I N G', cx, y, { align: 'center' });

  // Hairline
  y += 18;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(cx - 30, y, cx + 30, y);

  // ===== Section 1: Featured Package =====
  y += 24;
  const boxX = 64;
  const boxW = pageW - 128;
  const boxY = y;
  const padX = 22;
  const padY = 20;

  // Compute box height first
  doc.setFont('times', 'normal');
  doc.setFontSize(14);
  const itemName = ascii('Immersive LED Environments & Branded Overlay Design');
  const nameLines = doc.splitTextToSize(itemName, boxW - padX * 2 - 110);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const desc = ascii(
    "We will animate your brand's visual assets and turn them into Soleia's immersive experience. Our team manages the entire video mapping workflow and delivers animations directly to our playback server for stable, optimized performance. You will supply brand assets, logos, graphics, and mood board references, and we will develop a storyboard for a memorable guest journey, including a dynamic elevator animation to greet guests upon arrival."
  );
  const descLines = doc.splitTextToSize(desc, boxW - padX * 2);
  const boxH = padY * 2 + nameLines.length * 16 + 10 + descLines.length * 12 + 24;

  // Gold-tinted box
  doc.setFillColor(...GOLD_TINT);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3, 'FD');

  // Right side: STARTING AT / $3,000
  const priceRightX = boxX + boxW - padX;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GOLD_DEEP);
  doc.text('S T A R T I N G   A T', priceRightX, boxY + padY + 4, { align: 'right' });
  doc.setFont('times', 'normal');
  doc.setFontSize(26);
  doc.setTextColor(...INK);
  doc.text('$3,000', priceRightX, boxY + padY + 30, { align: 'right' });

  // Item name (left)
  doc.setFont('times', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text(nameLines, boxX + padX, boxY + padY + 12);

  // Description
  let dy = boxY + padY + 12 + nameLines.length * 16 + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SOFT_INK);
  doc.text(descLines, boxX + padX, dy);
  dy += descLines.length * 12 + 8;

  // Qty
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GOLD_DEEP);
  doc.text('Q T Y', boxX + padX, dy + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text('1 x Unit', boxX + padX + 30, dy + 4);

  y = boxY + boxH + 14;

  // ===== Callout: Venue contract =====
  const calloutH = 44;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.roundedRect(boxX, y, boxW, calloutH, 2, 2, 'FD');
  // Gold left accent
  doc.setFillColor(...GOLD);
  doc.rect(boxX, y, 3, calloutH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GOLD_DEEP);
  doc.text('I N C L U D E D   I N   Y O U R   V E N U E   C O N T R A C T', boxX + 14, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(ascii('- Up to 10 static logos - LED screens'), boxX + 14, y + 26);
  doc.text(ascii('- 1 static logo - all TVs, Cabanas & Bungalows'), boxX + 14, y + 38);

  y += calloutH + 22;

  // ===== Section 2: Additional Services =====
  if (addons.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GOLD_DEEP);
    doc.text('A D D I T I O N A L   S E R V I C E S', boxX, y);
    y += 6;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.line(boxX, y, boxX + boxW, y);
    y += 14;

    // Cap to keep single page
    const maxItems = Math.min(addons.length, 8);
    for (let i = 0; i < maxItems; i++) {
      if (y > pageH - 90) break;
      const item = addons[i];
      const price = fmt(Number(item.price) || 0);
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...INK);
      const title = ascii(item.title);
      const titleMax = boxW - doc.getTextWidth(price) - 16;
      const titleClip = doc.splitTextToSize(title, titleMax)[0];
      doc.text(titleClip, boxX, y);

      // Dot leader
      const titleW = doc.getTextWidth(titleClip);
      const priceW = doc.getTextWidth(price);
      const dotStart = boxX + titleW + 6;
      const dotEnd = boxX + boxW - priceW - 6;
      if (dotEnd > dotStart) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...SOFT_INK);
        const dots = '.'.repeat(Math.max(0, Math.floor((dotEnd - dotStart) / 3)));
        doc.text(dots, dotStart, y);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...INK);
      doc.text(price, boxX + boxW, y, { align: 'right' });

      y += 18;
    }
  }

  // ===== Footer =====
  const footY = pageH - 60;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(cx - 24, footY - 18, cx + 24, footY - 18);
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...SOFT_INK);
  doc.text('Pricing is a guide; final proposals are tailored to each engagement.', cx, footY - 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD_DEEP);
  doc.text('soleiacreative.app   -   Las Vegas', cx, footY + 10, { align: 'center' });

  return doc;
}

export function downloadRateCardPdf(addons: RateCardAddon[] = []) {
  const doc = generateRateCardPdf(addons);
  const date = new Date().toISOString().split('T')[0];
  doc.save(`soleia-rate-card-${date}.pdf`);
}
