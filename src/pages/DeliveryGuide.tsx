import React from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  ExternalLink, 
  FileVideo, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Monitor,
  Tv,
  LayoutGrid,
  Gauge
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import soleiaLogo from '@/assets/soleia-logo-new.png';
import { PoweredByShowBlox } from '@/components/PoweredByShowBlox';

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
    name: 'LED Display Pixel Map',
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
    name: 'Marquee/Ticker Display',
    icon: Monitor,
    resolution: '1280×768',
    format: 'MP4',
    codec: 'H264',
    duration: '15 sec',
  },
];

const workflowSteps = [
  {
    step: 1,
    title: 'Export Source Video',
    description: 'Export your video in ProRes or high-quality H264 format from your editing software.',
    icon: FileVideo,
  },
  {
    step: 2,
    title: 'Download Resolume Alley',
    description: 'Get the free Resolume Alley encoder to convert your videos to DXV3 format.',
    icon: Download,
  },
  {
    step: 3,
    title: 'Encode to DXV3',
    description: 'Open your video in Alley and encode to DXV3. This ensures optimal playback on our media servers.',
    icon: ArrowRight,
  },
  {
    step: 4,
    title: 'Submit for Review',
    description: 'Share your encoded content at least 21 business days before your event for testing.',
    icon: CheckCircle2,
  },
];

const DeliveryGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={soleiaLogo} 
                alt="Soleia" 
                className="h-10 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-display font-semibold text-gradient-gold">Content Delivery Guide</h1>
                <p className="text-xs text-muted-foreground">DXV3 Format & Submission Instructions</p>
              </div>
            </div>
            <PoweredByShowBlox variant="header" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto space-y-4"
          >
            <Badge className="bg-primary/20 text-primary border-primary/30">
              Ready-Made Content Delivery
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-gradient-gold">
              Delivering Your Content in DXV3 Format
            </h2>
            <p className="text-muted-foreground text-lg">
              Our venue uses Resolume media servers for optimal playback. 
              Follow this guide to ensure your content displays flawlessly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-16 space-y-12">
        
        {/* Why DXV3 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-primary/30 overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <AlertCircle className="w-6 h-6 text-primary" />
                Why DXV3 Format?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                DXV3 is a high-performance video codec designed specifically for real-time video playback. 
                Unlike standard codecs like H.264, DXV3 uses GPU acceleration for instant frame access, 
                making it perfect for live events where timing and reliability are critical.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold text-foreground mb-1">GPU Accelerated</h4>
                  <p className="text-sm text-muted-foreground">Instant playback without buffering or stuttering</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold text-foreground mb-1">Alpha Channel Support</h4>
                  <p className="text-sm text-muted-foreground">Perfect for overlays and transparent backgrounds</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold text-foreground mb-1">Real-Time Control</h4>
                  <p className="text-sm text-muted-foreground">Instant seeking and speed changes during playback</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Download Resolume */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-accent/30 overflow-hidden bg-gradient-to-br from-accent/5 to-transparent">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="p-4 rounded-2xl bg-accent/20 shrink-0">
                  <Download className="w-10 h-10 text-accent" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Download Resolume Alley (Free)
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Resolume Alley is a free video encoder that converts your videos to DXV3 format. 
                    Available for Windows and macOS.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      size="lg"
                      onClick={() => window.open(RESOLUME_ALLEY_URL, '_blank')}
                      className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Download Resolume Alley
                    </Button>
                    <Button 
                      variant="outline"
                      size="lg"
                      onClick={() => window.open(RESOLUME_URL, '_blank')}
                      className="gap-2 border-primary/30 hover:bg-primary/10"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit Resolume.com
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Encoding Workflow */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gradient-gold mb-2">Encoding Workflow</h3>
            <p className="text-muted-foreground">Follow these steps to prepare your content</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {workflowSteps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="glass h-full border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {item.step}
                      </div>
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <Separator className="bg-border/50" />

        {/* Display Specifications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gradient-gold mb-2">Display Specifications</h3>
            <p className="text-muted-foreground">Technical requirements for each display type</p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {displaySpecs.map((spec, index) => (
              <motion.div
                key={spec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="glass h-full border-border/50 hover:border-primary/30 transition-all hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
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
                              <Badge variant="secondary" className="font-mono text-xs">
                                {spec.codec}
                              </Badge>
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

        {/* Submission Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass border-amber-500/30 overflow-hidden bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                Submission Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-3xl font-bold text-amber-500">21</div>
                <div>
                  <p className="font-semibold text-foreground">Business Days Minimum</p>
                  <p className="text-sm text-muted-foreground">
                    Submit your content at least 21 business days before your event for testing and approval.
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This timeline allows our video artists to meticulously review, test, and preload your content 
                across all display systems, ensuring flawless presentation on the day of your event.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Pro Tips */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-foreground">Pro Tips</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="glass border-border/50">
              <CardContent className="p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Export in ProRes first</p>
                  <p className="text-sm text-muted-foreground">
                    For best quality, export from your editing software in Apple ProRes before encoding to DXV3.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-border/50">
              <CardContent className="p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Avoid overly bright colors</p>
                  <p className="text-sm text-muted-foreground">
                    LED screens are very bright—avoid highly saturated colors for background visuals.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-border/50">
              <CardContent className="p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Use light logos on dark backgrounds</p>
                  <p className="text-sm text-muted-foreground">
                    White or light logo versions display best against darker background visuals.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-border/50">
              <CardContent className="p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Include alpha channel when needed</p>
                  <p className="text-sm text-muted-foreground">
                    For overlay content, export with transparency and encode with DXV3 Alpha.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>
      </main>
      
      {/* Footer */}
      <PoweredByShowBlox className="border-t border-border/30" />
    </div>
  );
};

export default DeliveryGuide;
