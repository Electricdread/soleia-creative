import jsPDF from 'jspdf';
import tailgateLogo from '@/assets/tailgate-logo.png';
import displayDiagram from '@/assets/tailgate-display-diagram.png';

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
  { label: 'TV Displays', resolution: '1920x1080' },
  { label: 'Display 1 LED Screen', resolution: '5760x1000' },
  { label: 'Display 2A LED Screen', resolution: '1920x1056' },
  { label: 'Display 2 LED Screen', resolution: '1920x1056' },
];

const workflowSteps = [
  { step: 1, title: 'Prepare Your Video', description: 'Export your final video from After Effects, Premiere, or your editing tool in ProRes 422 or high-quality H.264.' },
  { step: 2, title: 'Download Resolume Alley (Free)', description: 'Our venue runs on Resolume media servers, which require DXV3-encoded files. Download the free encoder.' },
  { step: 3, title: 'Encode to DXV3', description: 'Open your video in Resolume Alley and encode using the DXV3 codec. For content with transparency, select "DXV3 Alpha."' },
  { step: 4, title: 'Submit Content', description: 'Submit your encoded files at least 21 business days before your event so we can test and approve playback.' },
];

async function assetToBase64(assetPath: string): Promise<{ data: string; width: number; height: number } | null> {
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve({ data: canvas.toDataURL('image/png'), width, height });
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

  const logoResult = await assetToBase64(tailgateLogo);

  // ========== HEADER ==========
  pdf.setFillColor(...colors.headerBg as [number, number, number]);
  pdf.rect(0, 0, pageWidth, 70, 'F');
  
  pdf.setFillColor(...colors.headerAccent as [number, number, number]);
  pdf.rect(0, 68, pageWidth, 2, 'F');

  if (logoResult) {
    try {
      const maxLogoWidth = 45;
      const aspectRatio = logoResult.height / logoResult.width;
      const logoWidth = maxLogoWidth;
      const logoHeight = maxLogoWidth * aspectRatio;
      pdf.addImage(logoResult.data, 'PNG', (pageWidth - logoWidth) / 2, 5, logoWidth, logoHeight);
    } catch (e) { console.error('Failed to add logo:', e); }
  }

  pdf.setTextColor(...colors.titleText as [number, number, number]);
  pdf.setFontSize(18);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text('CONTENT DELIVERY GUIDE', pageWidth / 2, 48, { align: 'center' });

  pdf.setTextColor(...colors.labelText as [number, number, number]);
  pdf.setFontSize(10);
  pdf.setFont(FONTS.accent.family, FONTS.accent.style);
  pdf.text('DXV3 Format Specifications for Resolume Media Servers', pageWidth / 2, 56, { align: 'center' });

  let yPos = 78;

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
  checkPageBreak(50);
  pdf.setTextColor(...colors.headerAccent as [number, number, number]);
  pdf.setFontSize(12);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text('DISPLAY SPECIFICATIONS', margin, yPos);
  yPos += 8;

  const specBoxWidth = (contentWidth - 6) / 2;
  const specBoxHeight = 18;
  let xOffset = margin;

  displaySpecs.forEach((spec, index) => {
    if (index === 2) {
      yPos += specBoxHeight + 3;
      xOffset = margin;
    }
    
    pdf.setFillColor(...colors.cardBg as [number, number, number]);
    pdf.setDrawColor(...colors.cardBorder as [number, number, number]);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(xOffset, yPos, specBoxWidth, specBoxHeight, 2, 2, 'FD');
    
    pdf.setTextColor(...colors.labelText as [number, number, number]);
    pdf.setFontSize(8);
    pdf.setFont(FONTS.body.family, FONTS.body.style);
    pdf.text(spec.label, xOffset + 4, yPos + 6);
    
    pdf.setTextColor(...colors.headerAccent as [number, number, number]);
    pdf.setFontSize(14);
    pdf.setFont(FONTS.title.family, FONTS.title.style);
    pdf.text(spec.resolution, xOffset + 4, yPos + 13);
    
    xOffset += specBoxWidth + 3;
  });

  yPos += specBoxHeight + 8;

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
