import jsPDF from 'jspdf';
import tailgateLogo from '@/assets/tailgate-logo.png';

const FONTS = {
  header: { family: 'times', style: 'bold' },
  title: { family: 'times', style: 'bold' },
  body: { family: 'helvetica', style: 'normal' },
  bodyBold: { family: 'helvetica', style: 'bold' },
  accent: { family: 'times', style: 'italic' },
  mono: { family: 'courier', style: 'normal' },
};

const colors = {
  headerBg: [240, 245, 250],
  headerAccent: [43, 76, 111],
  coral: [232, 111, 91],
  titleText: [30, 35, 45],
  labelText: [100, 110, 125],
  valueText: [40, 50, 60],
  cardBg: [250, 252, 255],
  cardBorder: [210, 220, 230],
  footerText: [140, 150, 160],
  pageBg: [255, 255, 255],
  linkBlue: [37, 99, 235],
};

const displaySpecs = [
  { name: 'Television Displays', resolution: '1920×1080 or 3840×2160', format: 'MOV', codec: 'DXV3', maxSize: '8GB' },
  { name: 'LED Pixel Map', resolution: '3840×2160', format: 'MOV with Alpha', codec: 'DXV3', frameRate: '60 fps', maxSize: '30GB' },
];

const workflowSteps = [
  { step: 1, title: 'Prepare Your Video', description: 'Export your final video from After Effects, Premiere, or your editing tool in ProRes 422 or high-quality H.264.' },
  { step: 2, title: 'Download Resolume Alley (Free)', description: 'Our venue runs on Resolume media servers, which require DXV3-encoded files. Download the free encoder.' },
  { step: 3, title: 'Encode to DXV3', description: 'Open your video in Resolume Alley and encode using the DXV3 codec. For content with transparency, select "DXV3 Alpha."' },
  { step: 4, title: 'Check Specs', description: 'TV Displays: 1920x1080 or 3840x2160 | MOV | DXV3 | Max 8GB. LED Pixel Map: 3840x2160 | MOV w/ Alpha | DXV3 | 60fps | Max 30GB.' },
  { step: 5, title: 'Submit Content', description: 'Submit your encoded files at least 21 business days before your event so we can test and approve playback.' },
];

async function assetToBase64(assetPath: string): Promise<string | null> {
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = assetPath;
    });
  } catch { return null; }
}

export async function generateTailgateDeliveryGuidePdf(): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true });

  pdf.setProperties({
    title: 'Tailgate Beach Club Content Delivery Guide',
    subject: 'DXV3 Format Specifications for Resolume Media Servers',
    author: 'Tailgate Beach Club Creative Team',
    keywords: 'DXV3, Resolume, Video Specs, LED, Content Delivery',
    creator: 'Tailgate Beach Club'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  const logoBase64 = await assetToBase64(tailgateLogo);

  // ========== HEADER ==========
  pdf.setFillColor(...colors.headerBg as [number, number, number]);
  pdf.rect(0, 0, pageWidth, 62, 'F');
  
  pdf.setFillColor(...colors.headerAccent as [number, number, number]);
  pdf.rect(0, 60, pageWidth, 2, 'F');

  if (logoBase64) {
    try {
      const logoWidth = 55;
      const logoHeight = 22;
      pdf.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, 4, logoWidth, logoHeight);
    } catch (e) { console.error('Failed to add logo:', e); }
  }

  pdf.setTextColor(...colors.titleText as [number, number, number]);
  pdf.setFontSize(18);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text('CONTENT DELIVERY GUIDE', pageWidth / 2, 32, { align: 'center' });

  pdf.setTextColor(...colors.labelText as [number, number, number]);
  pdf.setFontSize(10);
  pdf.setFont(FONTS.accent.family, FONTS.accent.style);
  pdf.text('DXV3 Format Specifications for Resolume Media Servers', pageWidth / 2, 40, { align: 'center' });

  pdf.setTextColor(...colors.titleText as [number, number, number]);
  pdf.setFontSize(10);
  pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
  const introText = 'We are providing you with an After Effects project file prepared specifically for our LED video configuration mapping. This template is pre-built to match our venue\'s exact screen layout, so you can drop in your content and export with confidence.';
  const introLines = pdf.splitTextToSize(introText, contentWidth - 20);
  pdf.text(introLines, pageWidth / 2, 48, { align: 'center' });

  let yPos = 48 + introLines.length * 5 + 8;

  const checkPageBreak = (needed: number) => {
    if (yPos + needed > pageHeight - 20) { pdf.addPage(); yPos = 20; }
  };

  // ========== STEP-BY-STEP WORKFLOW ==========
  pdf.setTextColor(...colors.headerAccent as [number, number, number]);
  pdf.setFontSize(12);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text('STEP-BY-STEP WORKFLOW', margin, yPos);
  yPos += 8;

  workflowSteps.forEach((item) => {
    checkPageBreak(16);
    pdf.setFillColor(...colors.headerAccent as [number, number, number]);
    pdf.circle(margin + 5, yPos + 2, 4, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(String(item.step), margin + 5, yPos + 4, { align: 'center' });

    pdf.setTextColor(...colors.titleText as [number, number, number]);
    pdf.setFontSize(9);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(item.title, margin + 14, yPos + 2);

    pdf.setTextColor(...colors.labelText as [number, number, number]);
    pdf.setFontSize(7.5);
    pdf.setFont(FONTS.body.family, FONTS.body.style);
    const descLines = pdf.splitTextToSize(item.description, contentWidth - 18);
    pdf.text(descLines, margin + 14, yPos + 7);
    yPos += 7 + descLines.length * 4 + 3;
  });

  yPos += 4;

  // ========== RESOLUME DOWNLOAD BOX ==========
  checkPageBreak(25);
  pdf.setFillColor(...colors.cardBg as [number, number, number]);
  pdf.setDrawColor(...colors.headerAccent as [number, number, number]);
  pdf.setLineWidth(1);
  pdf.roundedRect(margin, yPos, contentWidth, 22, 3, 3, 'FD');
  
  pdf.setTextColor(...colors.titleText as [number, number, number]);
  pdf.setFontSize(10);
  pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
  pdf.text('DXV3 Codec Required', margin + 8, yPos + 8);
  
  pdf.setTextColor(...colors.labelText as [number, number, number]);
  pdf.setFontSize(8);
  pdf.setFont(FONTS.body.family, FONTS.body.style);
  pdf.text('Download the free Resolume Alley encoder to convert your videos to DXV3 format.', margin + 8, yPos + 14);
  
  pdf.setTextColor(...colors.linkBlue as [number, number, number]);
  pdf.setFontSize(8);
  pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
  const resolumeLinkText = 'resolume.com/software/alley';
  pdf.textWithLink(resolumeLinkText, margin + 8, yPos + 20, { url: 'https://resolume.com/software/alley' });
  pdf.setDrawColor(...colors.linkBlue as [number, number, number]);
  pdf.setLineWidth(0.3);
  pdf.line(margin + 8, yPos + 21, margin + 8 + pdf.getTextWidth(resolumeLinkText), yPos + 21);

  yPos += 30;

  // ========== DISPLAY SPECIFICATIONS ==========
  checkPageBreak(40);
  pdf.setTextColor(...colors.headerAccent as [number, number, number]);
  pdf.setFontSize(12);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text('DISPLAY SPECIFICATIONS', margin, yPos);
  yPos += 8;

  const colWidths = [50, 50, 32, 25, 25];
  const tableHeaders = ['Display Type', 'Resolution', 'Format', 'Codec', 'Frame Rate'];
  
  pdf.setFillColor(...colors.headerAccent as [number, number, number]);
  pdf.rect(margin, yPos - 4, contentWidth, 8, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7);
  pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
  let xPos = margin + 2;
  tableHeaders.forEach((header, i) => { pdf.text(header, xPos, yPos); xPos += colWidths[i]; });
  yPos += 6;

  displaySpecs.forEach((spec, idx) => {
    const rowBg = idx % 2 === 0 ? colors.cardBg : [240, 244, 250];
    pdf.setFillColor(...rowBg as [number, number, number]);
    pdf.rect(margin, yPos - 4, contentWidth, 10, 'F');
    
    xPos = margin + 2;
    pdf.setTextColor(...colors.titleText as [number, number, number]);
    pdf.setFontSize(8);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(spec.name, xPos, yPos);
    xPos += colWidths[0];
    
    pdf.setFont(FONTS.mono.family, FONTS.mono.style);
    pdf.setFontSize(7);
    pdf.setTextColor(...colors.valueText as [number, number, number]);
    pdf.text(spec.resolution, xPos, yPos);
    xPos += colWidths[1];
    pdf.text(spec.format, xPos, yPos);
    xPos += colWidths[2];
    pdf.text(spec.codec || '-', xPos, yPos);
    xPos += colWidths[3];
    pdf.text(spec.frameRate || '-', xPos, yPos);
    
    yPos += 10;
  });

  yPos += 8;

  // ========== SUBMISSION TIMELINE ==========
  checkPageBreak(30);
  pdf.setFillColor(240, 248, 255);
  pdf.setDrawColor(...colors.headerAccent as [number, number, number]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'FD');
  
  pdf.setTextColor(...colors.headerAccent as [number, number, number]);
  pdf.setFontSize(24);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text('21', margin + 10, yPos + 14);
  
  pdf.setTextColor(...colors.titleText as [number, number, number]);
  pdf.setFontSize(10);
  pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
  pdf.text('Business Days Minimum', margin + 28, yPos + 9);
  
  pdf.setTextColor(...colors.labelText as [number, number, number]);
  pdf.setFontSize(8);
  pdf.setFont(FONTS.body.family, FONTS.body.style);
  pdf.text('Submit your content at least 21 business days before your event for testing and approval.', margin + 28, yPos + 16);

  yPos += 30;

  // ========== FOOTER ==========
  const footerY = pageHeight - 12;
  pdf.setDrawColor(...colors.headerAccent as [number, number, number]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  pdf.setTextColor(...colors.footerText as [number, number, number]);
  pdf.setFontSize(7);
  pdf.setFont(FONTS.accent.family, FONTS.accent.style);
  pdf.text('Tailgate Beach Club Content Delivery Specifications', margin, footerY);
  
  const dateText = `Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  pdf.text(dateText, pageWidth - margin, footerY, { align: 'right' });

  return pdf.output('blob');
}

export async function downloadTailgateDeliveryGuidePdf(): Promise<void> {
  const blob = await generateTailgateDeliveryGuidePdf();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Tailgate-Beach-Club-Content-Delivery-Guide-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
