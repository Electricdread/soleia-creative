import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Download, ArrowLeft, MessageCircle, Printer } from 'lucide-react';
import { format } from 'date-fns';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import jsPDF from 'jspdf';

interface ApprovedItem {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  url: string | null;
  item_type: string;
  description: string | null;
  added_by: string | null;
}

interface CommentData {
  id: string;
  item_id: string;
  commenter_name: string;
  content: string;
  created_at: string;
}

interface ApprovalSummaryProps {
  items: ApprovedItem[];
  comments: CommentData[];
  clientName: string;
  projectName: string;
  sessionDate: string;
  onBack: () => void;
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
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

function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = base64;
  });
}

function fitImageInBox(imgW: number, imgH: number, boxW: number, boxH: number) {
  const scale = Math.min(boxW / imgW, boxH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  return { w, h, x: (boxW - w) / 2, y: (boxH - h) / 2 };
}

export function ApprovalSummary({
  items,
  comments,
  clientName,
  projectName,
  sessionDate,
  onBack,
}: ApprovalSummaryProps) {
  const [generating, setGenerating] = useState(false);
  const [signOffName, setSignOffName] = useState('');
  const [signedOff, setSignedOff] = useState(false);

  const isSignOffValid = signOffName.trim().toLowerCase() === clientName.trim().toLowerCase();

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const checkPageBreak = (needed: number) => {
        if (y + needed > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      // Header with Soleia logo
      pdf.setFillColor(15, 15, 15);
      pdf.rect(0, 0, pageWidth, 48, 'F');

      // Add Soleia logo
      const logoData = await loadImageAsBase64(soleiaLogo);
      if (logoData) {
        try {
          const logoDims = await getImageDimensions(logoData);
          const logoH = 8;
          const logoW = (logoDims.width / logoDims.height) * logoH;
          pdf.addImage(logoData, 'PNG', margin, 8, logoW, logoH);
        } catch { /* skip logo */ }
      }

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(projectName.toUpperCase(), margin, 26);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(180, 180, 180);
      pdf.text(`Client: ${clientName}`, margin, 33);
      pdf.text(`Date: ${format(new Date(sessionDate), 'MMMM d, yyyy')}`, margin, 39);

      pdf.setTextColor(100, 200, 150);
      pdf.setFontSize(9);
      pdf.text(`${items.length} APPROVED ITEM${items.length !== 1 ? 'S' : ''}`, pageWidth - margin, 26, { align: 'right' });

      pdf.setTextColor(180, 180, 180);
      pdf.setFontSize(7);
      pdf.text('CREATIVE SESSION — APPROVAL SUMMARY', pageWidth - margin, 39, { align: 'right' });

      y = 56;

      // Items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemComments = comments.filter((c) => c.item_id === item.id);

        // Calculate needed height: thumbnail + title + comments
        const estimatedHeight = 60 + itemComments.length * 8;
        checkPageBreak(estimatedHeight);

        // Item number badge
        pdf.setFillColor(30, 30, 30);
        pdf.roundedRect(margin, y, contentWidth, Math.max(55, estimatedHeight), 3, 3, 'F');

        // Thumbnail — preserve aspect ratio
        const thumbUrl = item.thumbnail_url || item.file_url || item.url;
        const thumbBoxW = 45;
        const thumbBoxH = 35;
        const thumbBoxX = margin + 3;
        const thumbBoxY = y + 3;
        // Dark background for thumbnail area
        pdf.setFillColor(20, 20, 20);
        pdf.rect(thumbBoxX, thumbBoxY, thumbBoxW, thumbBoxH, 'F');

        if (thumbUrl) {
          const imgData = await loadImageAsBase64(thumbUrl);
          if (imgData) {
            try {
              const dims = await getImageDimensions(imgData);
              const fit = fitImageInBox(dims.width, dims.height, thumbBoxW, thumbBoxH);
              pdf.addImage(imgData, 'JPEG', thumbBoxX + fit.x, thumbBoxY + fit.y, fit.w, fit.h);
            } catch {
              pdf.setTextColor(120, 120, 120);
              pdf.setFontSize(7);
              pdf.text('No Preview', thumbBoxX + thumbBoxW / 2, thumbBoxY + thumbBoxH / 2, { align: 'center' });
            }
          }
        }

        // Item details
        const textX = margin + 53;
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${i + 1}. ${item.title || 'Untitled'}`, textX, y + 10);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(150, 150, 150);

        const typeBadge = item.item_type.toUpperCase();
        pdf.text(typeBadge, textX, y + 17);

        if (item.description) {
          pdf.setTextColor(200, 200, 200);
          const descLines = pdf.splitTextToSize(item.description, contentWidth - 58);
          pdf.text(descLines.slice(0, 2), textX, y + 24);
        }

        if (item.added_by) {
          pdf.setTextColor(120, 120, 120);
          pdf.setFontSize(7);
          pdf.text(`Added by ${item.added_by}`, textX, y + 35);
        }

        // Comments below thumbnail area
        if (itemComments.length > 0) {
          let commentY = y + 42;
          pdf.setFontSize(7);
          pdf.setTextColor(100, 180, 140);
          pdf.text('NOTES:', textX, commentY);
          commentY += 5;

          for (const comment of itemComments.slice(0, 4)) {
            pdf.setTextColor(180, 180, 180);
            const commentText = `${comment.commenter_name}: ${comment.content}`;
            const lines = pdf.splitTextToSize(commentText, contentWidth - 58);
            pdf.text(lines.slice(0, 2), textX, commentY);
            commentY += lines.slice(0, 2).length * 4;
          }

          y = Math.max(y + 55, commentY + 5);
        } else {
          y += 55;
        }

        y += 5;
      }

      // Client Sign-Off
      checkPageBreak(80);
      y += 10;
      pdf.setDrawColor(60, 60, 60);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CLIENT SIGN-OFF', margin, y);
      y += 10;

      // Client Name
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Client Name', margin, y);
      y += 6;
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.text(clientName, margin, y);
      pdf.setDrawColor(100, 100, 100);
      pdf.line(margin, y + 2, margin + 80, y + 2);
      y += 12;

      // Signed-off name (typed confirmation)
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(8);
      pdf.text('Approved By (Typed Confirmation)', margin, y);
      y += 6;
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(signedOff ? clientName : '___________________', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setDrawColor(100, 100, 100);
      pdf.line(margin, y + 2, margin + 80, y + 2);
      y += 14;

      // Date
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(8);
      pdf.text('Date', margin, y);
      y += 6;
      pdf.setTextColor(200, 200, 200);
      pdf.text(format(new Date(), 'MMMM d, yyyy'), margin, y);
      pdf.setDrawColor(100, 100, 100);
      pdf.line(margin, y + 2, margin + 80, y + 2);
      y += 14;

      // Legal disclaimer
      pdf.setFillColor(25, 25, 25);
      const disclaimerText = 'By signing above, the undersigned client acknowledges and approves the creative selections listed in this document. This approval authorizes the production team to proceed with the approved content as outlined. Any modifications or additions beyond the scope of these approved items may incur additional costs and require a separate approval. All creative assets remain the intellectual property of their respective owners until final delivery and payment. This document serves as a record of creative direction approval and does not constitute a binding contract for services not previously agreed upon.';
      const disclaimerLines = pdf.splitTextToSize(disclaimerText, contentWidth - 10);
      const disclaimerHeight = disclaimerLines.length * 3.5 + 8;
      checkPageBreak(disclaimerHeight + 5);
      pdf.roundedRect(margin, y, contentWidth, disclaimerHeight, 2, 2, 'F');
      pdf.setTextColor(130, 130, 130);
      pdf.setFontSize(6);
      pdf.text(disclaimerLines, margin + 5, y + 5);
      y += disclaimerHeight + 8;

      // Footer
      checkPageBreak(15);
      pdf.setDrawColor(60, 60, 60);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      pdf.setTextColor(120, 120, 120);
      pdf.setFontSize(7);
      pdf.text('This document was generated from Soleia Creative Session.', margin, y);
      pdf.text(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`, pageWidth - margin, y, { align: 'right' });

      // Metadata
      pdf.setProperties({
        title: `${projectName} — Approval Summary`,
        subject: 'Creative Session Approved Selections',
        author: clientName,
      });

      pdf.save(`${projectName.replace(/\s+/g, '-').toLowerCase()}-approval-summary.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              size="sm"
              onClick={generatePDF}
              disabled={generating}
              className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download className="h-3.5 w-3.5" />
              {generating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </header>

      {/* Printable Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 print:py-4 print:px-0">
        {/* Title Section */}
        <div className="text-center space-y-3 pb-6 border-b border-border/50">
          <img src={soleiaLogo} alt="Soleia" className="h-8 mx-auto opacity-60" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {projectName}
          </h1>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <span>{clientName}</span>
            <span className="text-border">•</span>
            <span>{format(new Date(sessionDate), 'MMMM d, yyyy')}</span>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {items.length} Approved Item{items.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Approved Items Grid */}
        <div className="space-y-4">
          {items.map((item, index) => {
            const itemComments = comments.filter((c) => c.item_id === item.id);
            const thumbUrl = item.thumbnail_url || item.file_url || item.url;

            return (
              <Card
                key={item.id}
                className="border border-border/50 overflow-hidden print:break-inside-avoid"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <div className="sm:w-48 sm:flex-shrink-0">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={item.title || 'Approved item'}
                        className="w-full h-40 sm:h-full object-cover bg-secondary/30"
                      />
                    ) : (
                      <div className="w-full h-40 sm:h-full bg-secondary/30 flex items-center justify-center">
                        <span className="text-muted-foreground/40 text-xs uppercase">
                          {item.item_type}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <CardContent className="flex-1 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            #{index + 1}
                          </span>
                          <h3 className="text-sm font-semibold text-foreground">
                            {item.title || 'Untitled'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[9px] uppercase">
                            {item.item_type}
                          </Badge>
                          {item.added_by && (
                            <span className="text-[10px] text-muted-foreground">
                              by {item.added_by}
                            </span>
                          )}
                        </div>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    </div>

                    {item.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Comments / Notes */}
                    {itemComments.length > 0 && (
                      <div className="border-t border-border/50 pt-2 space-y-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                          <MessageCircle className="h-3 w-3" />
                          Notes ({itemComments.length})
                        </div>
                        {itemComments.map((comment) => (
                          <div
                            key={comment.id}
                            className="text-[11px] bg-secondary/30 rounded-md px-2.5 py-1.5"
                          >
                            <span className="font-medium text-foreground">
                              {comment.commenter_name}
                            </span>
                            <span className="text-muted-foreground/60 ml-1.5 text-[9px]">
                              {format(new Date(comment.created_at), 'MMM d')}
                            </span>
                            <p className="text-muted-foreground mt-0.5">
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Client Sign-Off */}
        <div className="border-t border-border/50 pt-8 space-y-6 print:mt-8 print:break-inside-avoid">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Client Sign-Off
          </h2>

          {signedOff ? (
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Approved by {clientName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(), 'MMMM d, yyyy • h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                To confirm your approval, type your full name below exactly as it appears: <span className="text-foreground font-medium">{clientName}</span>
              </p>
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Type Your Full Name to Approve
                </label>
                <Input
                  value={signOffName}
                  onChange={(e) => setSignOffName(e.target.value)}
                  placeholder={clientName}
                  className="h-12 text-base bg-secondary/30 border-border/50 focus:border-primary/50"
                />
              </div>
              <Button
                onClick={() => {
                  setSignedOff(true);
                  toast.success('Approval confirmed!');
                }}
                disabled={!isSignOffValid}
                className="w-full h-11 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm Approval
              </Button>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Date
            </label>
            <div className="border-b border-foreground/20 pb-2">
              <span className="text-sm text-muted-foreground">{format(new Date(), 'MMMM d, yyyy')}</span>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-2 print:bg-transparent print:border print:border-border">
            <p className="text-[9px] text-muted-foreground/80 leading-relaxed">
              By signing above, the undersigned client acknowledges and approves the creative selections listed in this document. 
              This approval authorizes the production team to proceed with the approved content as outlined. Any modifications 
              or additions beyond the scope of these approved items may incur additional costs and require a separate approval.
            </p>
            <p className="text-[9px] text-muted-foreground/80 leading-relaxed">
              All creative assets remain the intellectual property of their respective owners until final delivery and payment. 
              This document serves as a record of creative direction approval and does not constitute a binding contract for 
              services not previously agreed upon. The client assumes responsibility for ensuring all approved content complies 
              with applicable laws and regulations.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-border/50 print:mt-8">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
            Generated from Soleia Creative Session • {format(new Date(), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
    </div>
  );
}
