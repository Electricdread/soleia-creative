import jsPDF from 'jspdf';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import showbloxIcon from '@/assets/showblox-icon.png';

// Font configuration for technical elegance
const FONTS = {
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
  linkBlue: [37, 99, 235],
};

const workflowSteps = [
  { step: 1, title: 'Export Source Video', description: 'Export in ProRes 422 or high-quality H264 from your editing software.' },
  { step: 2, title: 'Open Resolume Alley', description: 'Download the free encoder from resolume.com/software/alley' },
  { step: 3, title: 'Encode to DXV3', description: 'Select DXV3 codec and export your content.' },
  { step: 4, title: 'Submit Content', description: 'Deliver at least 21 business days before your event.' },
];

const proTips = [
  { title: 'Export in ProRes first', desc: 'For best quality before encoding to DXV3.' },
  { title: 'Avoid bright backgrounds', desc: 'LED screens are very bright—use darker tones.' },
  { title: 'Use light logos', desc: 'White or light logo versions display best on screens.' },
  { title: 'Include alpha channel', desc: 'Use DXV3 Alpha for transparent overlays on LED.' },
  { title: 'Test your content', desc: 'Preview your video at full resolution before submitting.' },
  { title: 'Keep file sizes reasonable', desc: 'Large files take longer to process and test.' },
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
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Load logos
  const logoBase64 = await assetToBase64(soleiaLogo);
  const showbloxBase64 = await assetToBase64(showbloxIcon);

  // ========== HEADER ==========
  pdf.setFillColor(...colors.headerBg as [number, number, number]);
  pdf.rect(0, 0, pageWidth, 55, 'F');
  
  // Gold accent line
  pdf.setFillColor(...colors.gold as [number, number, number]);
  pdf.rect(0, 53, pageWidth, 2, 'F');

  // Logo
  if (logoBase64) {
    try {
      const logoWidth = 55;
      const logoHeight = 16;
      pdf.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, 8, logoWidth, logoHeight);
    } catch (e) {
      console.error('Failed to add logo:', e);
    }
  }

  // Title
  pdf.setTextColor(...colors.titleText as [number, number, number]);
  pdf.setFontSize(18);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text('CONTENT PREPARATION GUIDE', pageWidth / 2, 34, { align: 'center' });

  // Subtitle
  pdf.setTextColor(...colors.labelText as [number, number, number]);
  pdf.setFontSize(10);
  pdf.setFont(FONTS.accent.family, FONTS.accent.style);
  pdf.text('DXV3 Encoding for Resolume Media Servers', pageWidth / 2, 42, { align: 'center' });

  // Live page link
  pdf.setTextColor(...colors.linkBlue as [number, number, number]);
  pdf.setFontSize(8);
  pdf.setFont(FONTS.body.family, FONTS.body.style);
  const linkText = 'View Interactive Guide Online';
  const linkWidth = pdf.getTextWidth(linkText);
  pdf.textWithLink(linkText, (pageWidth - linkWidth) / 2, 49, { url: livePageUrl });
  pdf.setDrawColor(...colors.linkBlue as [number, number, number]);
  pdf.setLineWidth(0.3);
  pdf.line((pageWidth - linkWidth) / 2, 50, (pageWidth + linkWidth) / 2, 50);

  let yPos = 65;

  // ========== ABOUT DXV3 ==========
  pdf.setTextColor(...colors.headerAccent as [number, number, number]);
  pdf.setFontSize(12);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text('WHAT IS DXV3?', margin, yPos);
  yPos += 8;

  pdf.setFillColor(...colors.cardBg as [number, number, number]);
  pdf.setDrawColor(...colors.cardBorder as [number, number, number]);
  pdf.roundedRect(margin, yPos, contentWidth, 28, 2, 2, 'FD');
  
  pdf.setTextColor(...colors.valueText as [number, number, number]);
  pdf.setFontSize(9);
  pdf.setFont(FONTS.body.family, FONTS.body.style);
  const aboutText = [
    'DXV3 is a GPU-accelerated codec designed for real-time video playback on Resolume media servers.',
    'It provides instant random access to any frame, making it ideal for live event visuals.',
    'The codec supports alpha channels for transparent overlays and handles high resolutions smoothly.'
  ];
  aboutText.forEach((line, i) => {
    pdf.text(line, margin + 5, yPos + 8 + (i * 6));
  });
  
  yPos += 38;

  // ========== ENCODING WORKFLOW ==========
  pdf.setTextColor(...colors.headerAccent as [number, number, number]);
  pdf.setFontSize(12);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text('ENCODING WORKFLOW', margin, yPos);
  yPos += 10;

  // Workflow steps in 2x2 grid
  const stepWidth = (contentWidth - 8) / 2;
  const stepHeight = 24;
  
  workflowSteps.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const stepX = margin + (col * (stepWidth + 8));
    const stepY = yPos + (row * (stepHeight + 4));
    
    // Card background
    pdf.setFillColor(...colors.cardBg as [number, number, number]);
    pdf.setDrawColor(...colors.cardBorder as [number, number, number]);
    pdf.roundedRect(stepX, stepY, stepWidth, stepHeight, 2, 2, 'FD');
    
    // Step number circle
    pdf.setFillColor(...colors.gold as [number, number, number]);
    pdf.circle(stepX + 8, stepY + 9, 5, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(String(item.step), stepX + 8, stepY + 11, { align: 'center' });
    
    // Step title
    pdf.setTextColor(...colors.titleText as [number, number, number]);
    pdf.setFontSize(9);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(item.title, stepX + 17, stepY + 10);
    
    // Step description
    pdf.setTextColor(...colors.labelText as [number, number, number]);
    pdf.setFontSize(7);
    pdf.setFont(FONTS.body.family, FONTS.body.style);
    const descLines = pdf.splitTextToSize(item.description, stepWidth - 20);
    pdf.text(descLines.slice(0, 2), stepX + 17, stepY + 17);
  });

  yPos += (stepHeight * 2) + 18;

  // ========== SUBMISSION TIMELINE ==========
  pdf.setFillColor(255, 251, 235);
  pdf.setDrawColor(...colors.gold as [number, number, number]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, yPos, contentWidth, 22, 3, 3, 'FD');
  
  pdf.setTextColor(...colors.headerAccent as [number, number, number]);
  pdf.setFontSize(24);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text('21', margin + 10, yPos + 15);
  
  pdf.setTextColor(...colors.titleText as [number, number, number]);
  pdf.setFontSize(10);
  pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
  pdf.text('Business Days Minimum', margin + 28, yPos + 10);
  
  pdf.setTextColor(...colors.labelText as [number, number, number]);
  pdf.setFontSize(8);
  pdf.setFont(FONTS.body.family, FONTS.body.style);
  pdf.text('Submit your content at least 21 business days before your event for testing and approval.', margin + 28, yPos + 17);

  yPos += 32;

  // ========== PRO TIPS ==========
  pdf.setTextColor(...colors.headerAccent as [number, number, number]);
  pdf.setFontSize(12);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text('PRO TIPS', margin, yPos);
  yPos += 8;

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

  yPos += 50;

  // ========== RESOLUME DOWNLOAD BOX ==========
  pdf.setFillColor(...colors.cardBg as [number, number, number]);
  pdf.setDrawColor(...colors.headerAccent as [number, number, number]);
  pdf.setLineWidth(1);
  pdf.roundedRect(margin, yPos, contentWidth, 24, 3, 3, 'FD');
  
  pdf.setTextColor(...colors.titleText as [number, number, number]);
  pdf.setFontSize(10);
  pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
  pdf.text('Download Resolume Alley (Free)', margin + 8, yPos + 9);
  
  pdf.setTextColor(...colors.labelText as [number, number, number]);
  pdf.setFontSize(8);
  pdf.setFont(FONTS.body.family, FONTS.body.style);
  pdf.text('Convert your videos to DXV3 format using the free Resolume Alley encoder.', margin + 8, yPos + 15);
  
  pdf.setTextColor(...colors.linkBlue as [number, number, number]);
  pdf.setFontSize(8);
  pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
  const resolumeLinkText = 'resolume.com/software/alley';
  pdf.textWithLink(resolumeLinkText, margin + 8, yPos + 21, { url: 'https://resolume.com/software/alley' });
  pdf.setDrawColor(...colors.linkBlue as [number, number, number]);
  pdf.setLineWidth(0.3);
  pdf.line(margin + 8, yPos + 22, margin + 8 + pdf.getTextWidth(resolumeLinkText), yPos + 22);

  // ========== FOOTER ==========
  const footerY = pageHeight - 12;
  
  pdf.setDrawColor(...colors.gold as [number, number, number]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  pdf.setTextColor(...colors.footerText as [number, number, number]);
  pdf.setFontSize(7);
  pdf.setFont(FONTS.accent.family, FONTS.accent.style);
  pdf.text('Soleia Content Preparation Guide', margin, footerY);
  
  // ShowBlox branding
  const poweredByText = 'Powered by';
  pdf.setFontSize(6);
  pdf.setFont(FONTS.body.family, FONTS.body.style);
  const poweredByWidth = pdf.getTextWidth(poweredByText);
  const iconWidth = 4;
  const totalBrandWidth = poweredByWidth + iconWidth + 2;
  const brandX = (pageWidth - totalBrandWidth) / 2;
  
  pdf.text(poweredByText, brandX, footerY);
  
  if (showbloxBase64) {
    try {
      pdf.addImage(showbloxBase64, 'PNG', brandX + poweredByWidth + 2, footerY - 3.5, iconWidth, iconWidth);
    } catch (e) {
      console.error('Failed to add ShowBlox icon:', e);
    }
  }
  
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
  link.download = `Soleia-Content-Preparation-Guide-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
