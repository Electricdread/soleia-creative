import React from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  ExternalLink, 
  FileVideo, 
  Monitor,
  Tv,
  LayoutGrid,
  Gauge,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import soleiaLogo from '@/assets/soleia-logo-new.png';
import solIcon from '@/assets/sol-icon.png';
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
  {
    step: 1,
    title: 'Export Source Video',
    description: 'Export in ProRes or high-quality H264',
  },
  {
    step: 2,
    title: 'Open Resolume Alley',
    description: 'Free encoder for DXV3 conversion',
  },
  {
    step: 3,
    title: 'Encode to DXV3',
    description: 'Select DXV3 codec and export',
  },
  {
    step: 4,
    title: 'Submit Content',
    description: '21 days before your event',
  },
];

const DeliveryGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Back button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Looks</span>
            </Button>

            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src={soleiaLogo} 
                alt="Soleia" 
                className="h-8 sm:h-10 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-display font-semibold text-gradient-gold">Content Delivery Guide</h1>
                <p className="text-xs text-muted-foreground">DXV3 Format Specifications</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <Button 
                size="sm"
                onClick={() => window.open(RESOLUME_ALLEY_URL, '_blank')}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download Encoder</span>
              </Button>
              <PoweredByShowBlox variant="header" />
            </div>
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
            <div className="flex justify-center mb-4">
              <img src={solIcon} alt="" className="w-16 h-16 object-contain drop-shadow-lg" />
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="w-3 h-3" />
              Ready-Made Content Delivery
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-gradient-gold">
              Delivering Your Content
            </h2>
            <p className="text-muted-foreground text-lg">
              Our venue uses Resolume media servers. Follow this guide to ensure your content displays flawlessly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-16 space-y-10">
        
        {/* Resolume Download Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-strong glow-gold">
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
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h3 className="text-2xl font-display font-semibold text-gradient-gold">
              Encoding Workflow
            </h3>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {workflowSteps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="h-full glass hover:glow-amber transition-all duration-300">
                  <CardContent className="p-5 space-y-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg">
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

        <Separator className="bg-border/50" />

        {/* Display Specifications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h3 className="text-2xl font-display font-semibold text-gradient-gold">
              Display Specifications
            </h3>
            <p className="text-muted-foreground mt-1">Technical requirements for each display type</p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {displaySpecs.map((spec, index) => (
              <motion.div
                key={spec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <Card className="h-full glass hover:glow-gold transition-all duration-300">
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

        <Separator className="bg-border/50" />

        {/* Submission Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-strong glow-amber">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                <Clock className="w-6 h-6 text-primary" />
                Submission Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl glass border border-border/30">
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
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
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
      </main>
      
      {/* Powered by ShowBlox Footer */}
      <PoweredByShowBlox className="border-t border-border/30 mt-8" />
    </div>
  );
};

export default DeliveryGuide;
