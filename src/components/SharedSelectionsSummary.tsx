import React, { useState } from 'react';
import { ArrowLeft, Download, Mail, FileText, MessageSquare, Loader2, CheckCircle2, Pencil, X, Save, Calendar, Users, LayoutGrid, Monitor, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { generateSelectionsPdf } from '@/lib/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import PlacementBadges from '@/components/PlacementBadges';
import PlacementSummaryByScreen from '@/components/PlacementSummaryByScreen';
import PdfPreviewDialog from '@/components/PdfPreviewDialog';
import soleiaLogo from '@/assets/soleia-logo-new.png';
import { format } from 'date-fns';

interface ClientLink {
  id: string;
  token: string;
  client_name: string;
  event_name: string;
  event_date: string | null;
  is_active: boolean;
}

interface SharedSelection {
  id: string;
  link_id: string;
  clip_id: string;
  clip_title: string;
  clip_thumbnail: string | null;
  clip_category: string | null;
  note: string;
  placements: string[];
}

interface SharedSelectionsSummaryProps {
  clientLink: ClientLink;
  selections: SharedSelection[];
  onBack: () => void;
  onClearSelections: () => void;
  updateNote: (clipId: string, note: string) => Promise<void>;
  updatePlacements: (clipId: string, placements: string[]) => Promise<void>;
}

const SharedSelectionsSummary: React.FC<SharedSelectionsSummaryProps> = ({
  clientLink,
  selections,
  onBack,
  onClearSelections,
  updateNote,
  updatePlacements,
}) => {
  const { toast } = useToast();
  const [approverName, setApproverName] = useState('');
  const [approverEmail, setApproverEmail] = useState('');
  const [isSignedOff, setIsSignedOff] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const getPdfSelections = () => {
    return selections.map(selection => ({
      id: selection.clip_id,
      external_id: selection.clip_id,
      title: selection.clip_title,
      thumbnail: selection.clip_thumbnail || '',
      note: selection.note,
      eventName: clientLink.event_name,
      eventDate: clientLink.event_date || '',
      placements: selection.placements,
      category: selection.clip_category || '',
      resolution: '',
      duration: '',
      clientName: clientLink.client_name,
    }));
  };

  const generatePdfData = async () => {
    return await generateSelectionsPdf(getPdfSelections());
  };

  const downloadPdf = async () => {
    if (selections.length === 0) return;
    
    setIsDownloading(true);
    
    try {
      const pdfBase64 = await generatePdfData();
      
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `${clientLink.client_name.replace(/\s+/g, '-')}-selections-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setPdfDownloaded(true);
      toast({
        title: "PDF Downloaded",
        description: `Your ${selections.length} selections have been saved`,
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
    if (selections.length === 0) return;
    
    const emailToSend = approverEmail.trim() || 'ninemilelion@gmail.com';
    
    setIsSendingEmail(true);
    
    try {
      const pdfBase64 = await generatePdfData();
      
      const { data, error } = await supabase.functions.invoke('send-selections-pdf', {
        body: {
          selections: selections.map(selection => ({
            external_id: selection.clip_id,
            title: selection.clip_title,
            thumbnail: selection.clip_thumbnail,
            note: selection.note,
            eventName: clientLink.event_name,
            eventDate: clientLink.event_date,
            placements: selection.placements,
            category: selection.clip_category,
          })),
          pdfBase64,
          recipientEmail: emailToSend,
          clientName: clientLink.client_name,
          eventName: clientLink.event_name,
          approverName: approverName,
        }
      });
      
      if (error) throw error;
      
      setEmailSent(true);
      toast({
        title: "Email sent!",
        description: `Your ${selections.length} selections have been sent`,
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

  const handleSaveNote = async (clipId: string) => {
    await updateNote(clipId, editingNote);
    setEditingClipId(null);
    setEditingNote('');
    toast({
      title: "Note updated",
      description: "Your changes have been saved and synced",
    });
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
        {/* Event Info Card */}
        <div className="glass rounded-2xl p-6 border border-primary/20 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-light tracking-wide text-gradient-gold mb-1">
                {clientLink.event_name}
              </h1>
              <p className="text-lg text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                {clientLink.client_name}
              </p>
            </div>
            {clientLink.event_date && (
              <div className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">
                  {format(new Date(clientLink.event_date), 'MMMM d, yyyy')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="clips" className="mb-10">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="clips" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              By Clip
            </TabsTrigger>
            <TabsTrigger value="screens" className="gap-2">
              <Monitor className="w-4 h-4" />
              By Screen
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="clips">
            {/* Title Section */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-light tracking-[0.2em] uppercase text-gradient-gold mb-2">
                Clip Selection Summary
              </h2>
              <p className="text-muted-foreground">
                {selections.length} clip{selections.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            {/* Clips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selections.map((selection, index) => (
                <div 
                  key={selection.id}
                  className="glass rounded-xl overflow-hidden border border-primary/10"
                >
                  <div className="flex gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary/20">
                      {selection.clip_thumbnail && (
                        <img 
                          src={selection.clip_thumbnail} 
                          alt={selection.clip_title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h3 className="font-medium text-foreground truncate">
                          {selection.clip_title}
                        </h3>
                      </div>
                      
                      {/* Placements */}
                      {selection.placements.length > 0 && (
                        <div className="mb-2">
                          <PlacementBadges placements={selection.placements} compact />
                        </div>
                      )}
                      
                      {/* Editable Note Section */}
                      <div className="mt-2">
                        {editingClipId === selection.clip_id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingNote}
                              onChange={(e) => setEditingNote(e.target.value)}
                              placeholder="Add notes about this clip..."
                              className="min-h-[60px] text-xs bg-background/50 resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs gap-1 rounded-lg"
                                onClick={() => handleSaveNote(selection.clip_id)}
                              >
                                <Save className="w-3 h-3" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs gap-1 rounded-lg"
                                onClick={() => {
                                  setEditingClipId(null);
                                  setEditingNote('');
                                }}
                              >
                                <X className="w-3 h-3" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            {selection.note ? (
                              <div className="flex-1 flex items-start gap-1.5 text-xs text-muted-foreground bg-secondary/30 rounded px-2 py-1">
                                <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{selection.note}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/60 italic">No notes</span>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 rounded-full hover:bg-primary/10"
                              onClick={() => {
                                setEditingClipId(selection.clip_id);
                                setEditingNote(selection.note || '');
                              }}
                            >
                              <Pencil className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="screens">
            {/* Title Section */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-light tracking-[0.2em] uppercase text-gradient-gold mb-2">
                Screen Assignment Summary
              </h2>
              <p className="text-muted-foreground">
                View clips grouped by venue screen location
              </p>
            </div>

            {/* Placement Summary by Screen */}
            <PlacementSummaryByScreen selections={selections} />
          </TabsContent>
        </Tabs>

        {/* Sign-Off Section */}
        <div className="glass rounded-2xl p-8 border border-primary/20 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Approval & Sign-Off
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="approver-name">Your Name</Label>
              <Input
                id="approver-name"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                placeholder="Enter your name"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approver-email">Your Email (optional)</Label>
              <Input
                id="approver-email"
                type="email"
                value={approverEmail}
                onChange={(e) => setApproverEmail(e.target.value)}
                placeholder="Email for PDF copy"
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
                By checking this box, I confirm that the {selections.length} selected clips are approved for the {clientLink.event_name} event.
              </p>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="glass rounded-2xl p-8 border border-primary/20">
          <h2 className="text-xl font-semibold mb-6">Export & Share</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => setShowPdfPreview(true)}
              disabled={selections.length === 0}
              variant="outline"
              className="flex-1 gap-2 rounded-xl h-12"
            >
              <Eye className="w-4 h-4" />
              Preview PDF
            </Button>
            
            <Button
              onClick={downloadPdf}
              disabled={isDownloading || selections.length === 0}
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
              disabled={isSendingEmail || selections.length === 0}
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
              {emailSent ? 'Email Sent' : 'Submit Selections'}
            </Button>
          </div>

          {/* Completion indicator */}
          {isSignedOff && (pdfDownloaded || emailSent) && (
            <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <div className="flex-1">
                <p className="font-medium text-green-600">Selections Complete</p>
                <p className="text-sm text-muted-foreground">
                  {approverName ? `Approved by ${approverName}` : 'Selections have been approved'}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* PDF Preview Dialog */}
      <PdfPreviewDialog
        open={showPdfPreview}
        onOpenChange={setShowPdfPreview}
        selections={getPdfSelections()}
        clientName={clientLink.client_name}
      />
    </div>
  );
};

export default SharedSelectionsSummary;
