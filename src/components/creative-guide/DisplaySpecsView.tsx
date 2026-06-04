import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Printer, ExternalLink, Sparkles, X, Clock, FileVideo } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DISPLAY_TYPES, type DisplayType } from '@/lib/creativeGuide';

import { LEDPixelMapCarousel } from './LEDPixelMapCarousel';
import { TVVideoCarousel } from './TVVideoCarousel';
import { ElevatorVideoPreview } from './ElevatorVideoPreview';
import solIcon from '@/assets/sol-icon.png';


const LED_PIXELMAP_IMAGE = '/creative-guide/led-main-interior-pixelmap.png';
const LED_AE_TEMPLATE_ZIP = 'https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/creative-guide-template/CREATIVE_GUIDE_June2026_Soleia.zip';
const ELEVATOR_PIXELMAP_IMAGE = '/creative-guide/elevator-pixelmap.png';
const TV_PIXELMAP_IMAGE = '/creative-guide/tv-pixelmap.png';
const RESOLUME_URL = 'https://www.resolume.com';
const RESOLUME_ALLEY_URL = 'https://resolume.com/software/alley';

const downloadAETemplate = () => {
  const link = document.createElement('a');
  link.href = LED_AE_TEMPLATE_ZIP;
  link.download = 'CREATIVE_GUIDE_June2026_Soleia.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

interface DisplaySpecsViewProps {
  onSelectDisplay?: (displayId: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'tv': <img src={solIcon} alt="" className="w-5 h-5 object-contain" />,
  'elevator': <img src={solIcon} alt="" className="w-5 h-5 object-contain" />,
  'led': <img src={solIcon} alt="" className="w-5 h-5 object-contain" />,
};

const categoryColors: Record<string, string> = {
  'tv': 'bg-primary/20 text-primary border-primary/30',
  'elevator': 'bg-accent/20 text-accent border-accent/30',
  'led': 'bg-primary/25 text-primary border-primary/40',
};

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-sm text-foreground text-right font-mono">{value}</span>
    </div>
  );
}

function DisplayCard({ display, highlightAE = false }: { display: DisplayType; highlightAE?: boolean }) {
  const isLED = display.category === 'led';
  const isTV = display.category === 'tv';
  const isElevator = display.category === 'elevator';
  const cardRef = useRef<HTMLDivElement>(null);
  const showHighlight = isLED && highlightAE;


  const handleDownloadLEDPixelmap = () => {
    const link = document.createElement('a');
    link.href = LED_PIXELMAP_IMAGE;
    link.download = 'LED-Main-Interior-Pixelmap.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadElevatorPixelmap = () => {
    const link = document.createElement('a');
    link.href = ELEVATOR_PIXELMAP_IMAGE;
    link.download = 'Elevator-Pixelmap.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTVPixelmap = () => {
    const link = document.createElement('a');
    link.href = TV_PIXELMAP_IMAGE;
    link.download = 'TV-Pixelmap.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full group cursor-pointer"
    >
      <Card className={`h-full glass border-border/50 overflow-hidden transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4),0_0_80px_-20px_hsl(var(--primary)/0.2)] ${showHighlight ? 'ring-2 ring-primary border-primary/60 shadow-[0_0_60px_-10px_hsl(var(--primary)/0.6)] animate-pulse' : ''}`}>

        {/* Image or Video Carousel */}
        <div className="relative aspect-video overflow-hidden">
          {isTicker ? (
            <TickerVideoCarousel />
          ) : isLED ? (
            <LEDPixelMapCarousel />
          ) : isTV ? (
            <TVVideoCarousel />
          ) : isElevator ? (
            <ElevatorVideoPreview />
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
              
              {/* TV Pixelmap & Resolume link */}
              {isTV && (
                <div className="pt-3 mt-2 border-t border-border/30 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTVPixelmap}
                    className="w-full gap-2 text-xs border-primary/30 hover:bg-primary/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Pixelmap
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(RESOLUME_URL, '_blank')}
                    className="w-full gap-2 text-xs border-primary/30 hover:bg-primary/10"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Resolume Video Encoder
                  </Button>
                </div>
              )}

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
                    id={isLED ? 'ae-template' : undefined}
                    size="default"
                    onClick={downloadAETemplate}
                    className={`w-full gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md ${showHighlight ? 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background' : ''}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Download After Effects Template
                  </Button>
                </div>
              )}

              {/* Elevator Pixelmap download */}
              {isElevator && (
                <div className="pt-3 mt-2 border-t border-border/30">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadElevatorPixelmap}
                    className="w-full gap-2 text-xs border-primary/30 hover:bg-primary/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Pixelmap
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
  const [highlightAE, setHighlightAE] = useState(false);
  const [showAEBanner, setShowAEBanner] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'display-specs' || hash === 'ae-template') {
      setHighlightAE(true);
      setShowAEBanner(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const t = setTimeout(() => setHighlightAE(false), 4000);
      return () => clearTimeout(t);
    }
  }, []);

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
                <span>Soleia Creative Team</span>
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

      {/* AE Template Highlight Banner (hash-triggered) */}
      <AnimatePresence>
        {showAEBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-primary/60 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-semibold text-foreground text-sm">After Effects Template Ready</p>
                  <p className="text-xs text-muted-foreground">Download the LED After Effects template to start your build.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={downloadAETemplate} size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Download className="w-4 h-4" />
                    Download Template
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowAEBanner(false)} className="h-8 w-8">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DISPLAY_TYPES.map((display, index) => (
          <motion.div
            key={display.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <DisplayCard display={display} highlightAE={highlightAE} />
          </motion.div>
        ))}
      </div>

      {/* Content Delivery — compact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-2"
      >
        <Card className="glass border-border/50">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <FileVideo className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Content Delivery</h3>
            </div>

            {/* Resolume row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="text-sm">
                <p className="font-medium text-foreground">DXV3 codec required</p>
                <p className="text-xs text-muted-foreground">Use the free Resolume Alley encoder to convert your videos.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => window.open(RESOLUME_ALLEY_URL, '_blank')} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Resolume Alley
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open(RESOLUME_URL, '_blank')} className="gap-2 border-primary/30">
                  <ExternalLink className="w-3.5 h-3.5" />
                  resolume.com
                </Button>
              </div>
            </div>

            {/* Inline 4-step workflow */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { n: 1, t: 'Export Source', d: 'ProRes or H264' },
                { n: 2, t: 'Open Alley', d: 'Free encoder' },
                { n: 3, t: 'Encode DXV3', d: 'Select & export' },
                { n: 4, t: 'Submit', d: '21 business days prior' },
              ].map(step => (
                <div key={step.n} className="flex items-start gap-2 p-2 rounded-md border border-border/30">
                  <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">{step.n}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{step.t}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline callout */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-l-2 border-primary/40 pl-3">
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Submit final content at least <span className="text-foreground font-semibold">21 business days</span> before your event for testing and approval.</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default DisplaySpecsView;
