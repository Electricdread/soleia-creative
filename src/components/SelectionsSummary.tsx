import React, { useState } from 'react';
import { ArrowLeft, Download, Mail, Check, FileText, MapPin, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { generateSelectionsPdf } from '@/lib/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import soleiaLogo from '@/assets/soleia-logo-new.png';
import { type ArtlistClip } from '@/lib/api/artlist';

interface SelectedClip extends ArtlistClip {
  note: string;
  eventName: string;
  eventDate: string;
  placements: string[];
}

interface SelectionsSummaryProps {
  selectedClips: SelectedClip[];
  onBack: () => void;
  onClearSelections: () => void;
  selectedCategory: string;
}

const SelectionsSummary: React.FC<SelectionsSummaryProps> = ({
  selectedClips,
  onBack,
  onClearSelections,
  selectedCategory
}) => {
  const { toast } = useToast();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isSignedOff, setIsSignedOff] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  const generatePdfData = async () => {
    return await generateSelectionsPdf(
      selectedClips.map(clip => ({
        id: clip.id,
        external_id: clip.id, // Use id as external_id
        title: clip.title,
        thumbnail: clip.thumbnail,
        note: clip.note,
        eventName: clip.eventName,
        eventDate: clip.eventDate,
        placements: clip.placements,
        category: clip.category,
        resolution: clip.resolution,
        duration: clip.duration,
      }))
    );
  };

  const downloadPdf = async () => {
    if (selectedClips.length === 0) return;
    
    setIsDownloading(true);
    
    try {
      const pdfBase64 = await generatePdfData();
      
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `soleia-selections-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setPdfDownloaded(true);
      toast({
        title: "PDF Downloaded",
        description: `Your ${selectedClips.length} selections have been saved`,
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message || "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const sendSelections = async () => {
    if (selectedClips.length === 0) return;
    
    const emailToSend = clientEmail.trim() || 'ninemilelion@gmail.com';
    
    setIsSendingEmail(true);
    
    try {
      const pdfBase64 = await generatePdfData();
      
      const { data, error } = await supabase.functions.invoke('send-selections-pdf', {
        body: {
          selections: selectedClips.map(clip => ({
            external_id: clip.id,
            title: clip.title,
            thumbnail: clip.thumbnail,
            note: clip.note,
            eventName: clip.eventName,
            eventDate: clip.eventDate,
            placements: clip.placements,
            category: selectedCategory
          })),
          pdfBase64,
          recipientEmail: emailToSend
        }
      });
      
      if (error) throw error;
      
      setEmailSent(true);
      toast({
        title: "Email sent!",
        description: `Your ${selectedClips.length} selections have been sent to ${emailToSend}`,
      });
    } catch (error: any) {
      console.error('Send error:', error);
      toast({
        title: "Failed to send",
        description: error.message || "Could not send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleComplete = () => {
    onClearSelections();
    onBack();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-30 border-b border-primary/10">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="gap-2 hover:bg-primary/10"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Gallery
            </Button>
            <img 
              src={soleiaLogo} 
              alt="Soleia" 
              className="h-12 object-contain"
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Title Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-light tracking-[0.2em] uppercase text-gradient-gold mb-2">
            Selection Summary
          </h1>
          <p className="text-muted-foreground">
            {selectedClips.length} clip{selectedClips.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* Clips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {selectedClips.map((clip, index) => (
            <div 
              key={clip.id}
              className="glass rounded-xl overflow-hidden border border-primary/10"
            >
              <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary/20">
                  <img 
                    src={clip.thumbnail} 
                    alt={clip.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h3 className="font-medium text-foreground truncate">
                      {clip.title}
                    </h3>
                  </div>
                  
                  {/* Placements */}
                  {clip.placements.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-primary mb-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{clip.placements.join(', ')}</span>
                    </div>
                  )}
                  
                  {/* Event info */}
                  {(clip.eventName || clip.eventDate) && (
                    <p className="text-xs text-muted-foreground">
                      {[clip.eventName, clip.eventDate].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  
                  {/* Note */}
                  {clip.note && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground bg-secondary/30 rounded px-2 py-1">
                      <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{clip.note}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Client Sign-Off Section */}
        <div className="glass rounded-2xl p-8 border border-primary/20 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Client Sign-Off
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="client-name">Client Name</Label>
              <Input
                id="client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Client Email (optional)</Label>
              <Input
                id="client-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Email for PDF delivery"
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
            <Checkbox
              id="sign-off"
              checked={isSignedOff}
              onCheckedChange={(checked) => setIsSignedOff(checked === true)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label 
                htmlFor="sign-off" 
                className="text-foreground cursor-pointer font-medium"
              >
                I approve these selections
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                By checking this box, I confirm that the {selectedClips.length} selected clips are approved for use.
              </p>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="glass rounded-2xl p-8 border border-primary/20">
          <h2 className="text-xl font-semibold mb-6">Export & Share</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={downloadPdf}
              disabled={isDownloading || selectedClips.length === 0}
              className="flex-1 gap-2 rounded-xl h-12"
              variant={pdfDownloaded ? "outline" : "default"}
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : pdfDownloaded ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {pdfDownloaded ? 'PDF Downloaded' : 'Download PDF'}
            </Button>
            
            <Button
              onClick={sendSelections}
              disabled={isSendingEmail || selectedClips.length === 0}
              className="flex-1 gap-2 rounded-xl h-12 glow-gold bg-gradient-to-r from-primary to-accent"
              variant={emailSent ? "outline" : "default"}
            >
              {isSendingEmail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : emailSent ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {emailSent ? 'Email Sent' : 'Send via Email'}
            </Button>
          </div>

          {/* Completion indicator */}
          {isSignedOff && (pdfDownloaded || emailSent) && (
            <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <div className="flex-1">
                <p className="font-medium text-green-600">Selections Complete</p>
                <p className="text-sm text-muted-foreground">
                  {clientName ? `Approved by ${clientName}` : 'Client has approved selections'}
                </p>
              </div>
              <Button 
                onClick={handleComplete}
                variant="outline"
                className="rounded-xl border-green-500/30 text-green-600 hover:bg-green-500/10"
              >
                Start New Selection
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SelectionsSummary;
