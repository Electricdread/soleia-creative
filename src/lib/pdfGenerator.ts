import jsPDF from 'jspdf';
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

// Convert image URL to base64 with better error handling
async function imageToBase64(url: string): Promise<string | null> {
  try {
    // Create an image element and load via canvas to avoid CORS issues
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
        // Try fetch as fallback
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
      
      // Add cache-busting and try loading
      img.src = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
      
      // Timeout fallback
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

export async function generateSelectionsPdf(selections: SelectionForPdf[]): Promise<string> {
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
  const eventDate = selections[0]?.eventDate || '';
  const clientName = selections[0]?.clientName || '';
  
  // ========== ELEGANT HEADER ==========
  // Dark luxury header background 
  pdf.setFillColor(20, 15, 10); // Dark warm brown/black
  pdf.rect(0, 0, pageWidth, 70, 'F');
  
  // Add subtle gold accent stripe at bottom
  pdf.setFillColor(245, 158, 11); // Gold accent
  pdf.rect(0, 68, pageWidth, 2, 'F');
  
  // Add Soleia logo centered at top - wider logo
  if (logoBase64) {
    try {
      const logoWidth = 70;
      const logoHeight = 25;
      pdf.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, 5, logoWidth, logoHeight);
    } catch (e) {
      console.error('Failed to add logo:', e);
    }
  }
  
  // Decorative line under logo
  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(0.3);
  pdf.line(pageWidth / 2 - 30, 32, pageWidth / 2 + 30, 32);
  
  // Event Name - Hero Typography (centered)
  pdf.setTextColor(245, 200, 100); // Gold text
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(eventName.toUpperCase(), pageWidth / 2, 41, { align: 'center' });
  
  // Decorative divider
  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(0.5);
  pdf.line(pageWidth / 2 - 20, 45, pageWidth / 2 + 20, 45);
  
  // Client Name with "Hosted By" label and Event Date
  pdf.setFontSize(9);
  const infoY = 53;
  
  if (clientName && eventDate) {
    // Hosted By label and client name
    pdf.setTextColor(180, 170, 150);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Hosted By:', pageWidth / 2 - 45, infoY, { align: 'right' });
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text(clientName, pageWidth / 2 - 43, infoY, { align: 'left' });
    
    // Divider
    pdf.setTextColor(245, 158, 11);
    pdf.text('|', pageWidth / 2, infoY, { align: 'center' });
    
    // Event Date label and date
    pdf.setTextColor(180, 170, 150);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Event Date:', pageWidth / 2 + 5, infoY, { align: 'left' });
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text(eventDate, pageWidth / 2 + 30, infoY, { align: 'left' });
  } else if (clientName) {
    pdf.setTextColor(180, 170, 150);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Hosted By:', pageWidth / 2 - 5, infoY, { align: 'right' });
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text(clientName, pageWidth / 2, infoY, { align: 'left' });
  } else if (eventDate) {
    pdf.setTextColor(180, 170, 150);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Event Date:', pageWidth / 2 - 5, infoY, { align: 'right' });
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text(eventDate, pageWidth / 2, infoY, { align: 'left' });
  }
  
  // Selection count
  pdf.setTextColor(200, 180, 150);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
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
      
      // Mini header on subsequent pages - dark background
      pdf.setFillColor(20, 15, 10);
      pdf.rect(0, 0, pageWidth, 15, 'F');
      // Gold accent stripe
      pdf.setFillColor(245, 158, 11);
      pdf.rect(0, 14, pageWidth, 1, 'F');
      pdf.setTextColor(245, 200, 100);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(eventName.toUpperCase(), margin, 10);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(`Page ${pdf.internal.pages.length - 1}`, pageWidth - margin, 10, { align: 'right' });
      yPosition = 25;
    }

    // Card background with subtle border
    pdf.setFillColor(252, 252, 252);
    pdf.setDrawColor(230, 230, 230);
    pdf.roundedRect(margin, yPosition - 2, contentWidth, rowHeight - 4, 3, 3, 'FD');

    // Try to load and add thumbnail
    const base64Image = await imageToBase64(selection.thumbnail);
    if (base64Image) {
      try {
        // Add rounded thumbnail placeholder first
        pdf.setFillColor(240, 240, 240);
        pdf.roundedRect(margin + 3, yPosition + 1, thumbnailWidth, thumbnailHeight, 2, 2, 'F');
        pdf.addImage(base64Image, 'JPEG', margin + 3, yPosition + 1, thumbnailWidth, thumbnailHeight);
      } catch {
        // Draw elegant placeholder if image fails
        drawThumbnailPlaceholder(pdf, margin + 3, yPosition + 1, thumbnailWidth, thumbnailHeight);
      }
    } else {
      // Draw elegant placeholder
      drawThumbnailPlaceholder(pdf, margin + 3, yPosition + 1, thumbnailWidth, thumbnailHeight);
    }

    // Title and details
    const textX = margin + thumbnailWidth + 10;
    const textMaxWidth = contentWidth - thumbnailWidth - 15;
    
    // Clip number badge
    pdf.setFillColor(245, 158, 11);
    pdf.circle(textX + 3, yPosition + 5, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${i + 1}`, textX + 3, yPosition + 6.5, { align: 'center' });
    
    // Title
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    
    // Truncate title if too long
    let title = selection.title;
    while (pdf.getTextWidth(title) > textMaxWidth - 15 && title.length > 0) {
      title = title.slice(0, -1);
    }
    if (title !== selection.title) title += '...';
    
    pdf.text(title, textX + 10, yPosition + 6);

    // Metadata
    pdf.setTextColor(120, 120, 120);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const metaParts = [selection.resolution, selection.duration, selection.category].filter(Boolean);
    const metaText = metaParts.join(' - ');
    pdf.text(metaText, textX + 10, yPosition + 13);

    // Placements
    let detailY = yPosition + 20;
    if (selection.placements && selection.placements.length > 0) {
      pdf.setTextColor(245, 158, 11); // Gold color
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Placements:', textX + 10, detailY);
      pdf.setTextColor(100, 80, 60);
      pdf.setFont('helvetica', 'normal');
      pdf.text(selection.placements.join(', '), textX + 35, detailY);
      detailY += 6;
    }

    // Note with styled background
    if (selection.note) {
      pdf.setFillColor(255, 251, 235); // Light amber background
      pdf.roundedRect(textX + 8, detailY - 3, textMaxWidth - 10, 12, 1, 1, 'F');
      
      pdf.setTextColor(100, 80, 60);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'italic');
      
      // Wrap note text - use simple quotes instead of smart quotes
      const noteText = '"' + selection.note + '"';
      const noteLines = pdf.splitTextToSize(noteText, textMaxWidth - 15);
      pdf.text(noteLines.slice(0, 2), textX + 10, detailY + 2);
    }

    yPosition += rowHeight;
  }

  // ========== FOOTER ==========
  const footerY = pageHeight - 12;
  
  // Footer line
  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Generated by Soleia Looks Collection', margin, footerY);
  pdf.text(`Page ${pdf.internal.pages.length - 1} of ${pdf.internal.pages.length - 1}`, pageWidth - margin, footerY, { align: 'right' });

  // Return base64 without the data URI prefix
  const pdfBase64 = pdf.output('datauristring');
  return pdfBase64.split(',')[1];
}

// Helper function to draw an elegant thumbnail placeholder
function drawThumbnailPlaceholder(pdf: jsPDF, x: number, y: number, width: number, height: number) {
  // Gradient-like background
  pdf.setFillColor(245, 240, 230);
  pdf.roundedRect(x, y, width, height, 2, 2, 'F');
  
  // Inner border
  pdf.setDrawColor(220, 210, 195);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x + 1, y + 1, width - 2, height - 2, 1, 1, 'S');
  
  // Sun icon placeholder
  pdf.setFillColor(245, 158, 11);
  pdf.circle(x + width/2, y + height/2 - 2, 5, 'F');
  
  // Rays
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
  
  // Text
  pdf.setTextColor(180, 170, 155);
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Preview', x + width/2, y + height - 3, { align: 'center' });
}
