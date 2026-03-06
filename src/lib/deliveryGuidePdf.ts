import jsPDF from 'jspdf';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import soleiaIcon from '@/assets/sol-icon.png';

// Font configuration for technical elegance
const FONTS = {
  header: {
    family: 'times',
    style: 'bold',
  },
  title: {
    family: 'times',
    style: 'bold',
  },
  body: {
    family: 'helvetica',
    style: 'normal',
  },
  bodyBold: {
    family: 'helvetica',
    style: 'bold',
  },
  accent: {
    family: 'times',
    style: 'italic',
  },
  mono: {
    family: 'courier',
    style: 'normal',
  },
  monoBold: {
    family: 'courier',
    style: 'bold',
  }
};

// Color scheme - elegant warm tones
const colors = {
  headerBg: [255, 248, 240],
  headerAccent: [217, 119, 6],
  gold: [245, 158, 11],
  titleText: [30, 25, 20],
  labelText: [120, 100, 80],
  valueText: [50, 40, 30],
  cardBg: [255, 253, 250],
  cardBorder: [230, 220, 200],
  footerText: [150, 140, 130],
  pageBg: [255, 255, 255],
  linkBlue: [37, 99, 235],
};

const displaySpecs = [
  {
    name: 'Television Displays',
    resolution: '1920×1080 or 3840×2160',
    format: 'MOV',
    codec: 'DXV3',
    maxSize: '8GB',
  },
  {
    name: 'LED Pixel Map',
    resolution: '3840×2160',
    format: 'MOV with Alpha',
    codec: 'DXV3',
    frameRate: '60 fps',
    maxSize: '30GB',
  },
];

const workflowSteps = [
  { step: 1, title: 'Prepare Your Video', description: 'Export your final video from After Effects, Premiere, or your editing tool in ProRes 422 or high-quality H.264.' },
  { step: 2, title: 'Download Resolume Alley (Free)', description: 'Our venue runs on Resolume media servers, which require DXV3-encoded files. Download the free encoder.' },
  { step: 3, title: 'Encode to DXV3', description: 'Open your video in Resolume Alley and encode using the DXV3 codec. For content with transparency, select "DXV3 Alpha."' },
  { step: 4, title: 'Check Specs', description: 'TV Displays: 1920x1080 or 3840x2160 | MOV | DXV3 | Max 8GB. LED Pixel Map: 3840x2160 | MOV w/ Alpha | DXV3 | 60fps | Max 30GB.' },
  { step: 5, title: 'Submit Content', description: 'Submit your encoded files at least 21 business days before your event so we can test and approve playback.' },
];

const proTips = [
  { title: 'Export in ProRes first', desc: 'For best quality before encoding to DXV3.' },
  { title: 'Avoid bright backgrounds', desc: 'LED screens are very bright—use darker tones.' },
  { title: 'Use light logos', desc: 'White or light logo versions display best on screens.' },
  { title: 'Include alpha channel', desc: 'Use DXV3 Alpha for transparent overlays on LED.' },
];

// Convert local asset to base64
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
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = assetPath;
    });
  } catch {
    return null;
  }
}

export async function generateDeliveryGuidePdf(livePageUrl: string): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
    putOnlyUsedFonts: true,
  });

  // Set PDF metadata for print
  pdf.setProperties({
    title: 'Soleia Content Delivery Guide',
    subject: 'DXV3 Format Specifications for Resolume Media Servers',
    author: 'Soleia Creative Team',
    keywords: 'DXV3, Resolume, Video Specs, LED, Content Delivery',
    creator: 'Soleia Portal'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Load logos
  const logoBase64 = await assetToBase64(soleiaLogo);
  const soleiaIconBase64 = await assetToBase64(soleiaIcon);

  // ========== HEADER ==========
  pdf.setFillColor(...colors.headerBg as [number, number, number]);
  pdf.rect(0, 0, pageWidth, 62, 'F');
  
  // Gold accent line
  pdf.setFillColor(...colors.gold as [number, number, number]);
  pdf.rect(0, 60, pageWidth, 2, 'F');

  // Logo
  if (logoBase64) {
    try {
      const logoWidth = 55;
      const logoHeight = 16;
      pdf.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, 6, logoWidth, logoHeight);
    } catch (e) {
      console.error('Failed to add logo:', e);
    }
  }

  // Title
  pdf.setTextColor(...colors.titleText as [number, number, number]);
  pdf.setFontSize(18);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text('CONTENT DELIVERY GUIDE', pageWidth / 2, 30, { align: 'center' });

  // Subtitle
  pdf.setTextColor(...colors.labelText as [number, number, number]);
  pdf.setFontSize(10);
  pdf.setFont(FONTS.accent.family, FONTS.accent.style);
  pdf.text('DXV3 Format Specifications for Resolume Media Servers', pageWidth / 2, 38, { align: 'center' });

  // Intro paragraph — bold and larger for readability
  pdf.setTextColor(...colors.titleText as [number, number, number]);
  pdf.setFontSize(10);
  pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
  const introText = 'We are providing you with an After Effects project file prepared specifically for our LED video configuration mapping. This template is pre-built to match our venue\'s exact screen layout, so you can drop in your content and export with confidence.';
  const introLines = pdf.splitTextToSize(introText, contentWidth - 20);
  pdf.text(introLines, pageWidth / 2, 46, { align: 'center' });

  let yPos = 46 + introLines.length * 5 + 8;

  const checkPageBreak = (needed: number) => {
    if (yPos + needed > pageHeight - 20) {
      pdf.addPage();
      yPos = 20;
    }
  };

  // ========== STEP-BY-STEP WORKFLOW ==========
  pdf.setTextColor(...colors.headerAccent as [number, number, number]);
  pdf.setFontSize(12);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text('STEP-BY-STEP WORKFLOW', margin, yPos);
  yPos += 8;

  workflowSteps.forEach((item) => {
    checkPageBreak(16);
    // Step number circle
    pdf.setFillColor(...colors.headerAccent as [number, number, number]);
    pdf.circle(margin + 5, yPos + 2, 4, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(String(item.step), margin + 5, yPos + 4, { align: 'center' });

    // Title
    pdf.setTextColor(...colors.titleText as [number, number, number]);
    pdf.setFontSize(9);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(item.title, margin + 14, yPos + 2);

    // Description
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

  // Specs table
  const colWidths = [50, 50, 32, 25, 25];
  const tableHeaders = ['Display Type', 'Resolution', 'Format', 'Codec', 'Frame Rate'];
  
  // Table header background
  pdf.setFillColor(...colors.headerAccent as [number, number, number]);
  pdf.rect(margin, yPos - 4, contentWidth, 8, 'F');
  
  // Table headers
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7);
  pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
  let xPos = margin + 2;
  tableHeaders.forEach((header, i) => {
    pdf.text(header, xPos, yPos);
    xPos += colWidths[i];
  });
  yPos += 6;

  // Table rows
  displaySpecs.forEach((spec, idx) => {
    const rowBg = idx % 2 === 0 ? colors.cardBg : [248, 245, 240];
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
  pdf.setFillColor(255, 251, 235);
  pdf.setDrawColor(...colors.gold as [number, number, number]);
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

  // ========== PRO TIPS ==========
  checkPageBreak(45);
  pdf.setTextColor(...colors.headerAccent as [number, number, number]);
  pdf.setFontSize(12);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text('PRO TIPS', margin, yPos);
  yPos += 8;

  const stepWidth = (contentWidth - 8) / 2;
  proTips.forEach((tip, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const tipX = margin + (col * (stepWidth + 8));
    const tipY = yPos + (row * 14);
    
    // Checkmark
    pdf.setTextColor(...colors.gold as [number, number, number]);
    pdf.setFontSize(10);
    pdf.text('✓', tipX, tipY + 4);
    
    // Tip title
    pdf.setTextColor(...colors.titleText as [number, number, number]);
    pdf.setFontSize(8);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(tip.title, tipX + 6, tipY + 4);
    
    // Tip description
    pdf.setTextColor(...colors.labelText as [number, number, number]);
    pdf.setFontSize(7);
    pdf.setFont(FONTS.body.family, FONTS.body.style);
    pdf.text(tip.desc, tipX + 6, tipY + 10);
  });

  yPos += 35;

  // ========== FOOTER ==========
  const footerY = pageHeight - 12;
  
  pdf.setDrawColor(...colors.gold as [number, number, number]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  pdf.setTextColor(...colors.footerText as [number, number, number]);
  pdf.setFontSize(7);
  pdf.setFont(FONTS.accent.family, FONTS.accent.style);
  pdf.text('Soleia Content Delivery Specifications', margin, footerY);
  
  
  // Date generated
  const dateText = `Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  pdf.text(dateText, pageWidth - margin, footerY, { align: 'right' });

  return pdf.output('blob');
}

export async function downloadDeliveryGuidePdf(livePageUrl: string): Promise<void> {
  const blob = await generateDeliveryGuidePdf(livePageUrl);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Soleia-Content-Delivery-Guide-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
