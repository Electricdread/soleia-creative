import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, Loader2, Moon, Sun } from 'lucide-react';
import { generateSelectionsPdfDataUri, generateSelectionsPdf } from '@/lib/pdfGenerator';

interface SelectionForPreview {
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

interface PdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selections: SelectionForPreview[];
  clientName: string;
}

const PdfPreviewDialog: React.FC<PdfPreviewDialogProps> = ({
  open,
  onOpenChange,
  selections,
  clientName,
}) => {
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (open && selections.length > 0) {
      generatePreview();
    }
  }, [open, selections, darkMode]);

  const generatePreview = async () => {
    setIsLoading(true);
    try {
      const dataUri = await generateSelectionsPdfDataUri(selections, { darkMode });
      setPdfDataUri(dataUri);
    } catch (error) {
      console.error('Failed to generate PDF preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const pdfBase64 = await generateSelectionsPdf(selections, { darkMode });
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `${clientName.replace(/\s+/g, '-')}-selections-${darkMode ? 'dark' : 'light'}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-light tracking-wide">
              PDF Preview
            </DialogTitle>
            <div className="flex items-center gap-6">
              {/* Dark Mode Toggle */}
              <div className="flex items-center gap-3">
                <Sun className="w-4 h-4 text-muted-foreground" />
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
                <Moon className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="dark-mode" className="text-sm text-muted-foreground">
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </Label>
              </div>
              
              {/* Download Button */}
              <Button
                onClick={handleDownload}
                disabled={isDownloading || isLoading}
                className="gap-2"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden bg-muted/30 p-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Generating preview...</p>
              </div>
            </div>
          ) : pdfDataUri ? (
            <iframe
              src={pdfDataUri}
              className="w-full h-full rounded-lg border border-border/50 bg-white"
              title="PDF Preview"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">No preview available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfPreviewDialog;
