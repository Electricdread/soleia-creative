import React from 'react';
import { motion } from 'framer-motion';
import { Download, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DISPLAY_TYPES, type DisplayType } from '@/lib/creativeGuide';
import { TickerVideoCarousel } from './TickerVideoCarousel';
import { LEDPixelMapCarousel } from './LEDPixelMapCarousel';
import solIcon from '@/assets/sol-icon.png';

const TICKER_ASSETS_ZIP = '/creative-guide/TICKER-MARQUEE.zip';
const LED_PIXELMAP_IMAGE = '/creative-guide/led-main-interior-pixelmap.png';
const LED_AE_TEMPLATE_ZIP = '/creative-guide/After_Effects_Template.zip';

interface DisplaySpecsViewProps {
  onSelectDisplay?: (displayId: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'tv': <img src={solIcon} alt="" className="w-5 h-5 object-contain" />,
  'elevator': <img src={solIcon} alt="" className="w-5 h-5 object-contain" />,
  'led': <img src={solIcon} alt="" className="w-5 h-5 object-contain" />,
  'ticker': <img src={solIcon} alt="" className="w-5 h-5 object-contain" />,
};

const categoryColors: Record<string, string> = {
  'tv': 'bg-primary/20 text-primary border-primary/30',
  'elevator': 'bg-accent/20 text-accent border-accent/30',
  'led': 'bg-primary/25 text-primary border-primary/40',
  'ticker': 'bg-success/20 text-success border-success/30',
};

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-sm text-foreground text-right font-mono">{value}</span>
    </div>
  );
}

function DisplayCard({ display }: { display: DisplayType }) {
  const isTicker = display.category === 'ticker';
  const isLED = display.category === 'led';
  
  const handleDownloadTickerAssets = () => {
    const link = document.createElement('a');
    link.href = TICKER_ASSETS_ZIP;
    link.download = 'TICKER-MARQUEE.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadLEDPixelmap = () => {
    const link = document.createElement('a');
    link.href = LED_PIXELMAP_IMAGE;
    link.download = 'LED-Main-Interior-Pixelmap.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadLEDTemplate = () => {
    const link = document.createElement('a');
    link.href = LED_AE_TEMPLATE_ZIP;
    link.download = 'After_Effects_Template.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full group cursor-pointer"
    >
      <Card className="h-full glass border-border/50 overflow-hidden transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4),0_0_80px_-20px_hsl(var(--primary)/0.2)]">
        {/* Image or Video Carousel */}
        <div className="relative aspect-video overflow-hidden">
          {isTicker ? (
            <TickerVideoCarousel />
          ) : isLED ? (
            <LEDPixelMapCarousel />
          ) : (
            <img 
              src={display.image} 
              alt={display.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent pointer-events-none" />
          <Badge 
            className={`absolute top-3 left-3 ${categoryColors[display.category]} text-xs`}
          >
            {categoryIcons[display.category]}
            <span className="ml-1.5 capitalize">{display.category}</span>
          </Badge>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{display.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{display.description}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs defaultValue="video" className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-9">
              <TabsTrigger value="video" className="text-xs">Video Specs</TabsTrigger>
              <TabsTrigger value="graphic" className="text-xs">Graphic Specs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="video" className="mt-3 space-y-1">
              <SpecRow label="Resolution" value={display.videoSpecs.resolution} />
              <SpecRow label="Format" value={display.videoSpecs.format} />
              {display.videoSpecs.codec && (
                <SpecRow label="Codec" value={display.videoSpecs.codec} />
              )}
              {display.videoSpecs.frameRate && (
                <SpecRow label="Frame Rate" value={display.videoSpecs.frameRate} />
              )}
              {display.videoSpecs.duration && (
                <SpecRow label="Duration" value={display.videoSpecs.duration} />
              )}
              {display.videoSpecs.fileSize && (
                <SpecRow label="Max File Size" value={display.videoSpecs.fileSize} />
              )}
            </TabsContent>

            <TabsContent value="graphic" className="mt-3 space-y-1">
              <SpecRow label="Resolution" value={display.graphicSpecs.resolution} />
              <SpecRow label="Format" value={display.graphicSpecs.format} />
              
              {/* Ticker Pixelmap & Work Comp download */}
              {isTicker && (
                <div className="pt-3 mt-2 border-t border-border/30">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTickerAssets}
                    className="w-full gap-2 text-xs border-primary/30 hover:bg-primary/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Pixelmap & Work Comp
                  </Button>
                </div>
              )}

              {/* LED Pixelmap & AE Template downloads */}
              {isLED && (
                <div className="pt-3 mt-2 border-t border-border/30 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadLEDPixelmap}
                    className="w-full gap-2 text-xs border-primary/30 hover:bg-primary/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Pixelmap
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadLEDTemplate}
                    className="w-full gap-2 text-xs border-primary/30 hover:bg-primary/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download After Effects Template
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Deliverables */}
          {display.deliverables && display.deliverables.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Total Deliverables: {display.deliverables.length} Files
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {display.deliverables.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Creative Notes */}
          {display.creativeNotes && display.creativeNotes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Creative Notes
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                {display.creativeNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">⚡</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dimensions */}
          {display.dimensions && display.dimensions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Screen Dimensions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {display.dimensions.map((dim, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px] font-mono">
                    {dim.label}: {dim.width}×{dim.height}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DisplaySpecsView({ onSelectDisplay }: DisplaySpecsViewProps) {
  const handlePrintSpecs = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Soleia Display Specifications</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #D4AF37; }
              .header img { max-width: 280px; height: auto; margin-bottom: 16px; }
              .header h1 { color: #D4AF37; margin: 0 0 8px 0; font-size: 24px; }
              .header p { color: #666; margin: 0; }
              h2 { color: #333; margin-top: 24px; }
              .spec-group { background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 12px 0; }
              .spec-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
              .spec-row:last-child { border-bottom: none; }
              .label { color: #666; }
              .value { font-family: monospace; font-weight: 600; }
              .notes { font-size: 12px; color: #888; margin-top: 8px; }
              .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
              .powered-by { display: flex; align-items: center; justify-content: center; gap: 8px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
              .powered-by img { height: 20px; width: auto; }
              @media print { body { padding: 20px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="/soleia-logo-black.png" alt="Soleia Las Vegas" />
              <h1>Display Specifications</h1>
              <p>Quick Reference Guide for Content Creation</p>
            </div>
            ${DISPLAY_TYPES.map(d => `
              <h2>${d.name}</h2>
              <div class="spec-group">
                <strong>Video Specs</strong>
                <div class="spec-row"><span class="label">Resolution</span><span class="value">${d.videoSpecs.resolution}</span></div>
                <div class="spec-row"><span class="label">Format</span><span class="value">${d.videoSpecs.format}</span></div>
                ${d.videoSpecs.codec ? `<div class="spec-row"><span class="label">Codec</span><span class="value">${d.videoSpecs.codec}</span></div>` : ''}
                ${d.videoSpecs.frameRate ? `<div class="spec-row"><span class="label">Frame Rate</span><span class="value">${d.videoSpecs.frameRate}</span></div>` : ''}
                ${d.videoSpecs.duration ? `<div class="spec-row"><span class="label">Duration</span><span class="value">${d.videoSpecs.duration}</span></div>` : ''}
                ${d.videoSpecs.fileSize ? `<div class="spec-row"><span class="label">Max Size</span><span class="value">${d.videoSpecs.fileSize}</span></div>` : ''}
              </div>
              <div class="spec-group">
                <strong>Graphic Specs</strong>
                <div class="spec-row"><span class="label">Resolution</span><span class="value">${d.graphicSpecs.resolution}</span></div>
                <div class="spec-row"><span class="label">Format</span><span class="value">${d.graphicSpecs.format}</span></div>
              </div>
              ${d.creativeNotes ? `<p class="notes"><strong>Notes:</strong> ${d.creativeNotes.join(' ')}</p>` : ''}
            `).join('')}
            <div class="footer">
              <p style="color: #999; font-size: 12px; margin-bottom: 12px;">Generated from Soleia Creative Guide</p>
              <div class="powered-by">
                <span>Powered by</span>
                <img src="/assets/showblox-icon.png" alt="ShowBlox" style="height: 24px; width: auto;" onerror="this.style.display='none'" />
                <span>ShowBlox</span>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gradient-gold">Display Specifications</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Technical requirements for all display types at Soleia. Use these specifications when preparing your branded content.
        </p>
      </div>

      {/* Quick Reference Download Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass border-primary/30 overflow-hidden group hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                  <img src={solIcon} alt="" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Quick Reference Sheet</h3>
                  <p className="text-sm text-muted-foreground">
                    All technical specs in a printable format
                  </p>
                </div>
              </div>
              <Button 
                onClick={handlePrintSpecs}
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 shrink-0"
              >
                <Printer className="w-4 h-4" />
                Print Specs
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DISPLAY_TYPES.map((display, index) => (
          <motion.div
            key={display.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <DisplayCard display={display} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default DisplaySpecsView;
