import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import soleiaLogo from '@/assets/soleia-wide-logo.png';

interface SelectionForPdf {
  id: string;
  external_id: string;
  title: string;
  thumbnail: string;
  note: string;
  eventName: string;
  eventDate: string;
  placements: string[];
  category: string;
  resolution: string;
  duration: string;
  clientName?: string;
}

export interface PdfOptions {
  darkMode?: boolean;
}

// Font configuration for premium typography
// Using Times-Roman (serif) for headers and Helvetica for body as jsPDF built-in fonts
// These are enhanced with proper weights and styling for a luxury feel
const FONTS = {
  header: {
    family: 'times',
    style: 'bolditalic',
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
  }
};

// Format date as "Month Day, Year" (e.g., "January 26, 2026")
function formatEventDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    return format(date, 'MMMM d, yyyy');
  } catch {
    return dateString;
  }
}

// Convert image URL to base64 with better error handling
async function imageToBase64(url: string): Promise<string | null> {
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      
      img.onerror = () => {
        fetch(url, { mode: 'cors' })
          .then(response => response.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          })
          .catch(() => resolve(null));
      };
      
      img.src = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
      setTimeout(() => resolve(null), 5000);
    });
  } catch {
    return null;
  }
}

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

// Color schemes for light and dark modes
const colorSchemes = {
  light: {
    headerBg: [255, 255, 255],
    headerAccent: [245, 158, 11],
    eventTitle: [180, 120, 50],
    labelText: [120, 110, 100],
    valueText: [40, 35, 30],
    cardBg: [252, 252, 252],
    cardBorder: [230, 230, 230],
    titleText: [30, 30, 30],
    metaText: [120, 120, 120],
    noteBg: [255, 251, 235],
    noteText: [100, 80, 60],
    footerText: [150, 150, 150],
    pageBg: [255, 255, 255],
  },
  dark: {
    headerBg: [20, 15, 10],
    headerAccent: [245, 158, 11],
    eventTitle: [245, 200, 100],
    labelText: [180, 170, 150],
    valueText: [255, 255, 255],
    cardBg: [35, 30, 25],
    cardBorder: [60, 55, 50],
    titleText: [255, 255, 255],
    metaText: [180, 175, 170],
    noteBg: [50, 45, 35],
    noteText: [220, 200, 170],
    footerText: [150, 140, 130],
    pageBg: [25, 20, 15],
  }
};

export async function generateSelectionsPdf(
  selections: SelectionForPdf[], 
  options: PdfOptions = {}
): Promise<string> {
  const { darkMode = false } = options;
  const colors = darkMode ? colorSchemes.dark : colorSchemes.light;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Load Soleia logo
  const logoBase64 = await assetToBase64(soleiaLogo);
  
  // Extract event info from first selection
  const eventName = selections[0]?.eventName || 'Looks Collection';
  const eventDate = formatEventDate(selections[0]?.eventDate || '');
  const clientName = selections[0]?.clientName || '';
  
  // ========== PAGE BACKGROUND (for dark mode) ==========
  if (darkMode) {
    pdf.setFillColor(...colors.pageBg as [number, number, number]);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  }
  
  // ========== ELEGANT HEADER ==========
  pdf.setFillColor(...colors.headerBg as [number, number, number]);
  pdf.rect(0, 0, pageWidth, 70, 'F');
  
  // Gold accent stripe at bottom
  pdf.setFillColor(...colors.headerAccent as [number, number, number]);
  pdf.rect(0, 68, pageWidth, 2, 'F');
  
  // Soleia logo centered at top
  if (logoBase64) {
    try {
      const logoWidth = 60;
      const logoHeight = 18;
      pdf.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, 8, logoWidth, logoHeight);
    } catch (e) {
      console.error('Failed to add logo:', e);
    }
  }
  
  // Decorative line under logo
  pdf.setDrawColor(...colors.headerAccent as [number, number, number]);
  pdf.setLineWidth(0.3);
  pdf.line(pageWidth / 2 - 30, 32, pageWidth / 2 + 30, 32);
  
  // Event Name - Hero Typography with premium serif font
  pdf.setTextColor(...colors.eventTitle as [number, number, number]);
  pdf.setFontSize(20);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text(eventName.toUpperCase(), pageWidth / 2, 41, { align: 'center' });
  
  // Decorative divider
  pdf.setDrawColor(...colors.headerAccent as [number, number, number]);
  pdf.setLineWidth(0.5);
  pdf.line(pageWidth / 2 - 20, 45, pageWidth / 2 + 20, 45);
  
  // Client Name and Event Date - Elegant centered layout
  const infoY = 54;
  
  if (clientName && eventDate) {
    // Calculate total width for centered layout with premium fonts
    pdf.setFontSize(9);
    const hostedLabel = 'Hosted By:  ';
    const dateLabel = 'Event Date:  ';
    const divider = '     |     ';
    
    pdf.setFont(FONTS.accent.family, FONTS.accent.style);
    const hostedLabelWidth = pdf.getTextWidth(hostedLabel);
    const dateLabelWidth = pdf.getTextWidth(dateLabel);
    const dividerWidth = pdf.getTextWidth(divider);
    
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    const clientNameWidth = pdf.getTextWidth(clientName);
    const eventDateWidth = pdf.getTextWidth(eventDate);
    
    const totalWidth = hostedLabelWidth + clientNameWidth + dividerWidth + dateLabelWidth + eventDateWidth;
    let xPos = (pageWidth - totalWidth) / 2;
    
    // Hosted By label - italic serif for elegance
    pdf.setTextColor(...colors.labelText as [number, number, number]);
    pdf.setFont(FONTS.accent.family, FONTS.accent.style);
    pdf.text(hostedLabel, xPos, infoY);
    xPos += hostedLabelWidth;
    
    // Client name - bold sans-serif for clarity
    pdf.setTextColor(...colors.valueText as [number, number, number]);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(clientName, xPos, infoY);
    xPos += clientNameWidth;
    
    // Divider
    pdf.setTextColor(...colors.headerAccent as [number, number, number]);
    pdf.setFont(FONTS.body.family, FONTS.body.style);
    pdf.text(divider, xPos, infoY);
    xPos += dividerWidth;
    
    // Event Date label - italic serif for elegance
    pdf.setTextColor(...colors.labelText as [number, number, number]);
    pdf.setFont(FONTS.accent.family, FONTS.accent.style);
    pdf.text(dateLabel, xPos, infoY);
    xPos += dateLabelWidth;
    
    // Date value - bold sans-serif for clarity
    pdf.setTextColor(...colors.valueText as [number, number, number]);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(eventDate, xPos, infoY);
  } else if (clientName) {
    pdf.setFontSize(9);
    const label = 'Hosted By:  ';
    pdf.setFont(FONTS.accent.family, FONTS.accent.style);
    const labelWidth = pdf.getTextWidth(label);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    const valueWidth = pdf.getTextWidth(clientName);
    const totalWidth = labelWidth + valueWidth;
    let xPos = (pageWidth - totalWidth) / 2;
    
    pdf.setTextColor(...colors.labelText as [number, number, number]);
    pdf.setFont(FONTS.accent.family, FONTS.accent.style);
    pdf.text(label, xPos, infoY);
    pdf.setTextColor(...colors.valueText as [number, number, number]);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(clientName, xPos + labelWidth, infoY);
  } else if (eventDate) {
    pdf.setFontSize(9);
    const label = 'Event Date:  ';
    pdf.setFont(FONTS.accent.family, FONTS.accent.style);
    const labelWidth = pdf.getTextWidth(label);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    const valueWidth = pdf.getTextWidth(eventDate);
    const totalWidth = labelWidth + valueWidth;
    let xPos = (pageWidth - totalWidth) / 2;
    
    pdf.setTextColor(...colors.labelText as [number, number, number]);
    pdf.setFont(FONTS.accent.family, FONTS.accent.style);
    pdf.text(label, xPos, infoY);
    pdf.setTextColor(...colors.valueText as [number, number, number]);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(eventDate, xPos + labelWidth, infoY);
  }
  
  // Selection count - elegant serif italic
  pdf.setTextColor(...colors.labelText as [number, number, number]);
  pdf.setFontSize(9);
  pdf.setFont(FONTS.accent.family, FONTS.accent.style);
  pdf.text(`${selections.length} clips selected`, pageWidth / 2, 62, { align: 'center' });
  
  // ========== CONTENT SECTION ==========
  let yPosition = 82;
  const thumbnailWidth = 50;
  const thumbnailHeight = 28;
  const rowHeight = 48;

  for (let i = 0; i < selections.length; i++) {
    const selection = selections[i];
    
    // Check if we need a new page
    if (yPosition + rowHeight > pageHeight - 25) {
      pdf.addPage();
      yPosition = 20;
      
      // Page background for dark mode
      if (darkMode) {
        pdf.setFillColor(...colors.pageBg as [number, number, number]);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      }
      
      // Mini header on subsequent pages
      pdf.setFillColor(...colors.headerBg as [number, number, number]);
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setFillColor(...colors.headerAccent as [number, number, number]);
      pdf.rect(0, 14, pageWidth, 1, 'F');
      pdf.setTextColor(...colors.eventTitle as [number, number, number]);
      pdf.setFontSize(10);
      pdf.setFont(FONTS.title.family, FONTS.title.style);
      pdf.text(eventName.toUpperCase(), margin, 10);
      pdf.setTextColor(...colors.valueText as [number, number, number]);
      pdf.setFont(FONTS.body.family, FONTS.body.style);
      pdf.setFontSize(8);
      pdf.text(`Page ${pdf.internal.pages.length - 1}`, pageWidth - margin, 10, { align: 'right' });
      yPosition = 25;
    }

    // Card background
    pdf.setFillColor(...colors.cardBg as [number, number, number]);
    pdf.setDrawColor(...colors.cardBorder as [number, number, number]);
    pdf.roundedRect(margin, yPosition - 2, contentWidth, rowHeight - 4, 3, 3, 'FD');

    // Thumbnail
    const base64Image = await imageToBase64(selection.thumbnail);
    if (base64Image) {
      try {
        pdf.setFillColor(darkMode ? 50 : 240, darkMode ? 45 : 240, darkMode ? 40 : 240);
        pdf.roundedRect(margin + 3, yPosition + 1, thumbnailWidth, thumbnailHeight, 2, 2, 'F');
        pdf.addImage(base64Image, 'JPEG', margin + 3, yPosition + 1, thumbnailWidth, thumbnailHeight);
      } catch {
        drawThumbnailPlaceholder(pdf, margin + 3, yPosition + 1, thumbnailWidth, thumbnailHeight, darkMode);
      }
    } else {
      drawThumbnailPlaceholder(pdf, margin + 3, yPosition + 1, thumbnailWidth, thumbnailHeight, darkMode);
    }

    // Title and details
    const textX = margin + thumbnailWidth + 10;
    const textMaxWidth = contentWidth - thumbnailWidth - 15;
    
    // Clip number badge
    pdf.setFillColor(...colors.headerAccent as [number, number, number]);
    pdf.circle(textX + 3, yPosition + 5, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(6);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(`${i + 1}`, textX + 3, yPosition + 6.5, { align: 'center' });
    
    // Title - Premium serif font for elegance
    pdf.setTextColor(...colors.titleText as [number, number, number]);
    pdf.setFontSize(11);
    pdf.setFont(FONTS.title.family, FONTS.title.style);
    
    let title = selection.title;
    while (pdf.getTextWidth(title) > textMaxWidth - 15 && title.length > 0) {
      title = title.slice(0, -1);
    }
    if (title !== selection.title) title += '...';
    
    pdf.text(title, textX + 10, yPosition + 6);

    // Metadata
    pdf.setTextColor(...colors.metaText as [number, number, number]);
    pdf.setFontSize(8);
    pdf.setFont(FONTS.body.family, FONTS.body.style);
    const metaParts = [selection.resolution, selection.duration, selection.category].filter(Boolean);
    const metaText = metaParts.join(' - ');
    pdf.text(metaText, textX + 10, yPosition + 13);

    // Placements
    let detailY = yPosition + 20;
    if (selection.placements && selection.placements.length > 0) {
      pdf.setTextColor(...colors.headerAccent as [number, number, number]);
      pdf.setFontSize(8);
      pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
      pdf.text('Placements:', textX + 10, detailY);
      pdf.setTextColor(...colors.noteText as [number, number, number]);
      pdf.setFont(FONTS.body.family, FONTS.body.style);
      pdf.text(selection.placements.join(', '), textX + 35, detailY);
      detailY += 6;
    }

    // Note
    if (selection.note) {
      pdf.setFillColor(...colors.noteBg as [number, number, number]);
      pdf.roundedRect(textX + 8, detailY - 3, textMaxWidth - 10, 12, 1, 1, 'F');
      
      pdf.setTextColor(...colors.noteText as [number, number, number]);
      pdf.setFontSize(7);
      pdf.setFont(FONTS.accent.family, FONTS.accent.style);
      
      const noteText = '"' + selection.note + '"';
      const noteLines = pdf.splitTextToSize(noteText, textMaxWidth - 15);
      pdf.text(noteLines.slice(0, 2), textX + 10, detailY + 2);
    }

    yPosition += rowHeight;
  }

  // ========== FOOTER ==========
  const footerY = pageHeight - 12;
  
  pdf.setDrawColor(...colors.headerAccent as [number, number, number]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  pdf.setTextColor(...colors.footerText as [number, number, number]);
  pdf.setFontSize(8);
  pdf.setFont(FONTS.accent.family, FONTS.accent.style);
  pdf.text('Generated by Soleia Looks Collection', margin, footerY);
  pdf.text(`Page ${pdf.internal.pages.length - 1} of ${pdf.internal.pages.length - 1}`, pageWidth - margin, footerY, { align: 'right' });

  const pdfBase64 = pdf.output('datauristring');
  return pdfBase64.split(',')[1];
}

// Generate full data URI for preview
export async function generateSelectionsPdfDataUri(
  selections: SelectionForPdf[], 
  options: PdfOptions = {}
): Promise<string> {
  const { darkMode = false } = options;
  const colors = darkMode ? colorSchemes.dark : colorSchemes.light;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  const logoBase64 = await assetToBase64(soleiaLogo);
  
  const eventName = selections[0]?.eventName || 'Looks Collection';
  const eventDate = formatEventDate(selections[0]?.eventDate || '');
  const clientName = selections[0]?.clientName || '';
  
  if (darkMode) {
    pdf.setFillColor(...colors.pageBg as [number, number, number]);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  }
  
  pdf.setFillColor(...colors.headerBg as [number, number, number]);
  pdf.rect(0, 0, pageWidth, 70, 'F');
  
  pdf.setFillColor(...colors.headerAccent as [number, number, number]);
  pdf.rect(0, 68, pageWidth, 2, 'F');
  
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, 'PNG', (pageWidth - 60) / 2, 8, 60, 18);
    } catch (e) {
      console.error('Failed to add logo:', e);
    }
  }
  
  pdf.setDrawColor(...colors.headerAccent as [number, number, number]);
  pdf.setLineWidth(0.3);
  pdf.line(pageWidth / 2 - 30, 32, pageWidth / 2 + 30, 32);
  
  pdf.setTextColor(...colors.eventTitle as [number, number, number]);
  pdf.setFontSize(20);
  pdf.setFont(FONTS.title.family, FONTS.title.style);
  pdf.text(eventName.toUpperCase(), pageWidth / 2, 41, { align: 'center' });
  
  pdf.setDrawColor(...colors.headerAccent as [number, number, number]);
  pdf.setLineWidth(0.5);
  pdf.line(pageWidth / 2 - 20, 45, pageWidth / 2 + 20, 45);
  
  const infoY = 54;
  
  if (clientName && eventDate) {
    pdf.setFontSize(9);
    const hostedLabel = 'Hosted By:  ';
    const dateLabel = 'Event Date:  ';
    const divider = '     |     ';
    
    pdf.setFont(FONTS.accent.family, FONTS.accent.style);
    const hostedLabelWidth = pdf.getTextWidth(hostedLabel);
    const dateLabelWidth = pdf.getTextWidth(dateLabel);
    const dividerWidth = pdf.getTextWidth(divider);
    
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    const clientNameWidth = pdf.getTextWidth(clientName);
    const eventDateWidth = pdf.getTextWidth(eventDate);
    
    const totalWidth = hostedLabelWidth + clientNameWidth + dividerWidth + dateLabelWidth + eventDateWidth;
    let xPos = (pageWidth - totalWidth) / 2;
    
    pdf.setTextColor(...colors.labelText as [number, number, number]);
    pdf.setFont(FONTS.accent.family, FONTS.accent.style);
    pdf.text(hostedLabel, xPos, infoY);
    xPos += hostedLabelWidth;
    
    pdf.setTextColor(...colors.valueText as [number, number, number]);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(clientName, xPos, infoY);
    xPos += clientNameWidth;
    
    pdf.setTextColor(...colors.headerAccent as [number, number, number]);
    pdf.setFont(FONTS.body.family, FONTS.body.style);
    pdf.text(divider, xPos, infoY);
    xPos += dividerWidth;
    
    pdf.setTextColor(...colors.labelText as [number, number, number]);
    pdf.setFont(FONTS.accent.family, FONTS.accent.style);
    pdf.text(dateLabel, xPos, infoY);
    xPos += dateLabelWidth;
    
    pdf.setTextColor(...colors.valueText as [number, number, number]);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(eventDate, xPos, infoY);
  } else if (clientName) {
    pdf.setFontSize(9);
    const label = 'Hosted By:  ';
    pdf.setFont(FONTS.accent.family, FONTS.accent.style);
    const labelWidth = pdf.getTextWidth(label);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    const valueWidth = pdf.getTextWidth(clientName);
    const totalWidth = labelWidth + valueWidth;
    let xPos = (pageWidth - totalWidth) / 2;
    
    pdf.setTextColor(...colors.labelText as [number, number, number]);
    pdf.setFont(FONTS.accent.family, FONTS.accent.style);
    pdf.text(label, xPos, infoY);
    pdf.setTextColor(...colors.valueText as [number, number, number]);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(clientName, xPos + labelWidth, infoY);
  } else if (eventDate) {
    pdf.setFontSize(9);
    const label = 'Event Date:  ';
    pdf.setFont(FONTS.accent.family, FONTS.accent.style);
    const labelWidth = pdf.getTextWidth(label);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    const valueWidth = pdf.getTextWidth(eventDate);
    const totalWidth = labelWidth + valueWidth;
    let xPos = (pageWidth - totalWidth) / 2;
    
    pdf.setTextColor(...colors.labelText as [number, number, number]);
    pdf.setFont(FONTS.accent.family, FONTS.accent.style);
    pdf.text(label, xPos, infoY);
    pdf.setTextColor(...colors.valueText as [number, number, number]);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(eventDate, xPos + labelWidth, infoY);
  }
  
  pdf.setTextColor(...colors.labelText as [number, number, number]);
  pdf.setFontSize(9);
  pdf.setFont(FONTS.accent.family, FONTS.accent.style);
  pdf.text(`${selections.length} clips selected`, pageWidth / 2, 62, { align: 'center' });
  
  let yPosition = 82;
  const thumbnailWidth = 50;
  const thumbnailHeight = 28;
  const rowHeight = 48;

  for (let i = 0; i < selections.length; i++) {
    const selection = selections[i];
    
    if (yPosition + rowHeight > pageHeight - 25) {
      pdf.addPage();
      yPosition = 20;
      
      if (darkMode) {
        pdf.setFillColor(...colors.pageBg as [number, number, number]);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      }
      
      pdf.setFillColor(...colors.headerBg as [number, number, number]);
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setFillColor(...colors.headerAccent as [number, number, number]);
      pdf.rect(0, 14, pageWidth, 1, 'F');
      pdf.setTextColor(...colors.eventTitle as [number, number, number]);
      pdf.setFontSize(10);
      pdf.setFont(FONTS.title.family, FONTS.title.style);
      pdf.text(eventName.toUpperCase(), margin, 10);
      pdf.setTextColor(...colors.valueText as [number, number, number]);
      pdf.setFont(FONTS.body.family, FONTS.body.style);
      pdf.setFontSize(8);
      pdf.text(`Page ${pdf.internal.pages.length - 1}`, pageWidth - margin, 10, { align: 'right' });
      yPosition = 25;
    }

    pdf.setFillColor(...colors.cardBg as [number, number, number]);
    pdf.setDrawColor(...colors.cardBorder as [number, number, number]);
    pdf.roundedRect(margin, yPosition - 2, contentWidth, rowHeight - 4, 3, 3, 'FD');

    const base64Image = await imageToBase64(selection.thumbnail);
    if (base64Image) {
      try {
        pdf.setFillColor(darkMode ? 50 : 240, darkMode ? 45 : 240, darkMode ? 40 : 240);
        pdf.roundedRect(margin + 3, yPosition + 1, thumbnailWidth, thumbnailHeight, 2, 2, 'F');
        pdf.addImage(base64Image, 'JPEG', margin + 3, yPosition + 1, thumbnailWidth, thumbnailHeight);
      } catch {
        drawThumbnailPlaceholder(pdf, margin + 3, yPosition + 1, thumbnailWidth, thumbnailHeight, darkMode);
      }
    } else {
      drawThumbnailPlaceholder(pdf, margin + 3, yPosition + 1, thumbnailWidth, thumbnailHeight, darkMode);
    }

    const textX = margin + thumbnailWidth + 10;
    const textMaxWidth = contentWidth - thumbnailWidth - 15;
    
    pdf.setFillColor(...colors.headerAccent as [number, number, number]);
    pdf.circle(textX + 3, yPosition + 5, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(6);
    pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
    pdf.text(`${i + 1}`, textX + 3, yPosition + 6.5, { align: 'center' });
    
    pdf.setTextColor(...colors.titleText as [number, number, number]);
    pdf.setFontSize(11);
    pdf.setFont(FONTS.title.family, FONTS.title.style);
    
    let title = selection.title;
    while (pdf.getTextWidth(title) > textMaxWidth - 15 && title.length > 0) {
      title = title.slice(0, -1);
    }
    if (title !== selection.title) title += '...';
    
    pdf.text(title, textX + 10, yPosition + 6);

    pdf.setTextColor(...colors.metaText as [number, number, number]);
    pdf.setFontSize(8);
    pdf.setFont(FONTS.body.family, FONTS.body.style);
    const metaParts = [selection.resolution, selection.duration, selection.category].filter(Boolean);
    const metaText = metaParts.join(' - ');
    pdf.text(metaText, textX + 10, yPosition + 13);

    let detailY = yPosition + 20;
    if (selection.placements && selection.placements.length > 0) {
      pdf.setTextColor(...colors.headerAccent as [number, number, number]);
      pdf.setFontSize(8);
      pdf.setFont(FONTS.bodyBold.family, FONTS.bodyBold.style);
      pdf.text('Placements:', textX + 10, detailY);
      pdf.setTextColor(...colors.noteText as [number, number, number]);
      pdf.setFont(FONTS.body.family, FONTS.body.style);
      pdf.text(selection.placements.join(', '), textX + 35, detailY);
      detailY += 6;
    }

    if (selection.note) {
      pdf.setFillColor(...colors.noteBg as [number, number, number]);
      pdf.roundedRect(textX + 8, detailY - 3, textMaxWidth - 10, 12, 1, 1, 'F');
      
      pdf.setTextColor(...colors.noteText as [number, number, number]);
      pdf.setFontSize(7);
      pdf.setFont(FONTS.accent.family, FONTS.accent.style);
      
      const noteText = '"' + selection.note + '"';
      const noteLines = pdf.splitTextToSize(noteText, textMaxWidth - 15);
      pdf.text(noteLines.slice(0, 2), textX + 10, detailY + 2);
    }

    yPosition += rowHeight;
  }

  const footerY = pageHeight - 12;
  
  pdf.setDrawColor(...colors.headerAccent as [number, number, number]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  pdf.setTextColor(...colors.footerText as [number, number, number]);
  pdf.setFontSize(8);
  pdf.setFont(FONTS.accent.family, FONTS.accent.style);
  pdf.text('Generated by Soleia Looks Collection', margin, footerY);
  pdf.text(`Page ${pdf.internal.pages.length - 1} of ${pdf.internal.pages.length - 1}`, pageWidth - margin, footerY, { align: 'right' });

  return pdf.output('datauristring');
}

function drawThumbnailPlaceholder(pdf: jsPDF, x: number, y: number, width: number, height: number, darkMode: boolean = false) {
  pdf.setFillColor(darkMode ? 50 : 245, darkMode ? 45 : 240, darkMode ? 40 : 230);
  pdf.roundedRect(x, y, width, height, 2, 2, 'F');
  
  pdf.setDrawColor(darkMode ? 80 : 220, darkMode ? 75 : 210, darkMode ? 70 : 195);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x + 1, y + 1, width - 2, height - 2, 1, 1, 'S');
  
  pdf.setFillColor(245, 158, 11);
  pdf.circle(x + width/2, y + height/2 - 2, 5, 'F');
  
  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(0.5);
  for (let angle = 0; angle < 360; angle += 45) {
    const rad = (angle * Math.PI) / 180;
    const startR = 7;
    const endR = 10;
    pdf.line(
      x + width/2 + Math.cos(rad) * startR,
      y + height/2 - 2 + Math.sin(rad) * startR,
      x + width/2 + Math.cos(rad) * endR,
      y + height/2 - 2 + Math.sin(rad) * endR
    );
  }
  
  pdf.setTextColor(darkMode ? 150 : 180, darkMode ? 140 : 170, darkMode ? 130 : 155);
  pdf.setFontSize(6);
  pdf.setFont(FONTS.body.family, FONTS.body.style);
  pdf.text('Preview', x + width/2, y + height - 3, { align: 'center' });
}
