import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  FileVideo, 
  Monitor,
  Tv,
  LayoutGrid,
  Gauge,
  Clock,
  Sparkles,
  CheckCircle2,
  Printer,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const RESOLUME_URL = 'https://www.resolume.com';
const RESOLUME_ALLEY_URL = 'https://resolume.com/software/alley';

const displaySpecs = [
  {
    id: 'tv',
    name: 'Television Displays',
    icon: Tv,
    resolution: '1920×1080 or 3840×2160',
    format: 'MOV',
    codec: 'DXV3',
    maxSize: '8GB',
  },
  {
    id: 'led',
    name: 'LED Pixel Map',
    icon: LayoutGrid,
    resolution: '3840×2160',
    format: 'MOV with Alpha',
    codec: 'DXV3',
    frameRate: '60 fps',
    maxSize: '30GB',
  },
  {
    id: 'elevator',
    name: 'Elevator Displays',
    icon: Gauge,
    resolution: '600×800',
    format: 'WMV',
    frameRate: '30 fps',
    duration: '30 sec',
  },
  {
    id: 'ticker',
    name: 'Marquee/Ticker',
    icon: Monitor,
    resolution: '1280×768',
    format: 'MP4',
    codec: 'H264',
    duration: '15 sec',
  },
];

const workflowSteps = [
  { step: 1, title: 'Export Source Video', description: 'Export in ProRes or high-quality H264' },
  { step: 2, title: 'Open Resolume Alley', description: 'Free encoder for DXV3 conversion' },
  { step: 3, title: 'Encode to DXV3', description: 'Select DXV3 codec and export' },
  { step: 4, title: 'Submit Content', description: '21 days before your event' },
];

export const ContentDeliveryView = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrintPdf = async () => {
    setIsDownloading(true);
    try {
      const livePageUrl = `${window.location.origin}/delivery-guide`;
      const { downloadDeliveryGuidePdf } = await import('@/lib/deliveryGuidePdf');
      await downloadDeliveryGuidePdf(livePageUrl);
      toast.success('PDF downloaded — open the file and print');
    } catch (error) {
      console.error('PDF print error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Print PDF Button */}
      <div className="flex justify-end">
        <Button
          onClick={handlePrintPdf}
          disabled={isDownloading}
          className="gap-2"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Printer className="w-4 h-4" />
          )}
          Print Delivery Guide PDF
        </Button>
      </div>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <Badge variant="outline" className="border-primary/30 text-primary">
          <Sparkles className="w-3 h-3 mr-1" />
          Ready-Made Content Delivery
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-gradient-gold">
          Delivering Your Content
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Our venue uses Resolume media servers. Follow this guide to ensure your content displays flawlessly.
        </p>
      </motion.div>

      {/* Resolume Download */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="overflow-hidden border-primary/20 glass">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="p-4 rounded-2xl bg-primary/10 shrink-0">
                <FileVideo className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                  DXV3 Codec Required
                </h3>
                <p className="text-muted-foreground mb-4">
                  Download the free Resolume Alley encoder to convert your videos to DXV3 format for optimal playback.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                  <Button 
                    size="lg"
                    onClick={() => window.open(RESOLUME_ALLEY_URL, '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Get Resolume Alley (Free)
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => window.open(RESOLUME_URL, '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Resolume.com
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Encoding Workflow */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-display font-semibold text-gradient-gold">Encoding Workflow</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((item, index) => (
            <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.1 }}>
              <Card className="h-full glass hover:shadow-lg transition-all">
                <CardContent className="p-5 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <Separator />

      {/* Display Specifications */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-display font-semibold text-gradient-gold">Display Specifications</h3>
          <p className="text-muted-foreground mt-1">Technical requirements for each display type</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {displaySpecs.map((spec, index) => (
            <motion.div key={spec.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.1 }} whileHover={{ y: -4, scale: 1.02 }}>
              <Card className="h-full glass hover:shadow-xl transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <spec.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <h4 className="font-semibold text-foreground">{spec.name}</h4>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Resolution</span>
                          <span className="font-mono text-foreground">{spec.resolution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Format</span>
                          <span className="font-mono text-foreground">{spec.format}</span>
                        </div>
                        {spec.codec && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Codec</span>
                            <Badge variant="outline" className="font-mono text-xs">{spec.codec}</Badge>
                          </div>
                        )}
                        {spec.frameRate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Frame Rate</span>
                            <span className="font-mono text-foreground">{spec.frameRate}</span>
                          </div>
                        )}
                        {spec.duration && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration</span>
                            <span className="font-mono text-foreground">{spec.duration}</span>
                          </div>
                        )}
                        {spec.maxSize && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Max Size</span>
                            <span className="font-mono text-foreground">{spec.maxSize}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <Separator />

      {/* Submission Timeline */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-foreground">
              <Clock className="w-6 h-6 text-primary" />
              Submission Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="text-4xl font-display font-bold text-primary">21</div>
              <div>
                <p className="font-semibold text-foreground">Business Days Minimum</p>
                <p className="text-sm text-muted-foreground">
                  Submit your content at least 21 business days before your event for testing and approval.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Pro Tips */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-4">
        <h3 className="text-xl font-display font-semibold text-foreground">Pro Tips</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { title: 'Export in ProRes first', desc: 'For best quality before encoding to DXV3.' },
            { title: 'Avoid bright backgrounds', desc: 'LED screens are very bright—use darker tones.' },
            { title: 'Use light logos', desc: 'White or light logo versions display best.' },
            { title: 'Include alpha channel', desc: 'Use DXV3 Alpha for transparent overlays.' },
          ].map((tip, idx) => (
            <Card key={idx} className="glass">
              <CardContent className="p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{tip.title}</p>
                  <p className="text-sm text-muted-foreground">{tip.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>
    </div>
  );
};
