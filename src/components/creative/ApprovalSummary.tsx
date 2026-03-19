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

export function ApprovalSummary({
  items,
  comments,
  clientName,
  projectName,
  sessionDate,
  onBack,
}: ApprovalSummaryProps) {
  const [generating, setGenerating] = useState(false);

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

      // Header
      pdf.setFillColor(15, 15, 15);
      pdf.rect(0, 0, pageWidth, 40, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(projectName.toUpperCase(), margin, 18);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(180, 180, 180);
      pdf.text(`Client: ${clientName}`, margin, 26);
      pdf.text(`Date: ${format(new Date(sessionDate), 'MMMM d, yyyy')}`, margin, 32);

      pdf.setTextColor(100, 200, 150);
      pdf.text(`${items.length} APPROVED ITEM${items.length !== 1 ? 'S' : ''}`, pageWidth - margin, 18, { align: 'right' });

      pdf.setTextColor(180, 180, 180);
      pdf.setFontSize(7);
      pdf.text('CREATIVE SESSION — APPROVAL SUMMARY', pageWidth - margin, 32, { align: 'right' });

      y = 50;

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

        // Thumbnail
        const thumbUrl = item.thumbnail_url || item.file_url || item.url;
        if (thumbUrl) {
          const imgData = await loadImageAsBase64(thumbUrl);
          if (imgData) {
            try {
              pdf.addImage(imgData, 'JPEG', margin + 3, y + 3, 45, 35);
            } catch {
              // fallback placeholder
              pdf.setFillColor(50, 50, 50);
              pdf.rect(margin + 3, y + 3, 45, 35, 'F');
              pdf.setTextColor(120, 120, 120);
              pdf.setFontSize(7);
              pdf.text('No Preview', margin + 25, y + 22, { align: 'center' });
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

      // Footer
      checkPageBreak(25);
      y += 5;
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
