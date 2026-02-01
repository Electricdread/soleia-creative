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
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import soleiaLogo from '@/assets/soleia-logo-new.png';
import solIcon from '@/assets/sol-icon.png';

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
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-amber-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={soleiaLogo} 
                alt="Soleia" 
                className="h-10 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-display font-semibold bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                  Content Delivery Guide
                </h1>
                <p className="text-xs text-amber-700/60">DXV3 Format Specifications</p>
              </div>
            </div>
            <Button 
              onClick={() => window.open(RESOLUME_ALLEY_URL, '_blank')}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download Encoder</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/40 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto space-y-4"
          >
            <div className="flex justify-center mb-4">
              <img src={solIcon} alt="" className="w-16 h-16 object-contain drop-shadow-lg" />
            </div>
            <Badge className="bg-amber-100 text-amber-700 border-amber-300">
              <Sparkles className="w-3 h-3 mr-1" />
              Ready-Made Content Delivery
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
              Delivering Your Content
            </h2>
            <p className="text-amber-800/70 text-lg">
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
          <Card className="overflow-hidden border-amber-200/50 bg-white/70 backdrop-blur-sm shadow-xl shadow-amber-500/10">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 shrink-0">
                  <FileVideo className="w-10 h-10 text-amber-600" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-display font-semibold text-amber-900 mb-2">
                    DXV3 Codec Required
                  </h3>
                  <p className="text-amber-700/70 mb-4">
                    Download the free Resolume Alley encoder to convert your videos to DXV3 format for optimal playback.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                    <Button 
                      size="lg"
                      onClick={() => window.open(RESOLUME_ALLEY_URL, '_blank')}
                      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Get Resolume Alley (Free)
                    </Button>
                    <Button 
                      variant="outline"
                      size="lg"
                      onClick={() => window.open(RESOLUME_URL, '_blank')}
                      className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
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
            <h3 className="text-2xl font-display font-semibold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
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
                <Card className="h-full border-amber-200/50 bg-white/70 backdrop-blur-sm hover:shadow-lg hover:shadow-amber-500/10 transition-all">
                  <CardContent className="p-5 space-y-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/30">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-amber-900">{item.title}</h4>
                    <p className="text-sm text-amber-700/70">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <Separator className="bg-amber-200/50" />

        {/* Display Specifications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h3 className="text-2xl font-display font-semibold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              Display Specifications
            </h3>
            <p className="text-amber-700/60 mt-1">Technical requirements for each display type</p>
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
                <Card className="h-full border-amber-200/50 bg-white/70 backdrop-blur-sm hover:shadow-xl hover:shadow-amber-500/15 transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                        <spec.icon className="w-6 h-6 text-amber-600" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h4 className="font-semibold text-amber-900">{spec.name}</h4>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-amber-600/70">Resolution</span>
                            <span className="font-mono text-amber-900">{spec.resolution}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-600/70">Format</span>
                            <span className="font-mono text-amber-900">{spec.format}</span>
                          </div>
                          {spec.codec && (
                            <div className="flex justify-between">
                              <span className="text-amber-600/70">Codec</span>
                              <Badge className="bg-amber-100 text-amber-700 border-amber-300 font-mono text-xs">
                                {spec.codec}
                              </Badge>
                            </div>
                          )}
                          {spec.frameRate && (
                            <div className="flex justify-between">
                              <span className="text-amber-600/70">Frame Rate</span>
                              <span className="font-mono text-amber-900">{spec.frameRate}</span>
                            </div>
                          )}
                          {spec.duration && (
                            <div className="flex justify-between">
                              <span className="text-amber-600/70">Duration</span>
                              <span className="font-mono text-amber-900">{spec.duration}</span>
                            </div>
                          )}
                          {spec.maxSize && (
                            <div className="flex justify-between">
                              <span className="text-amber-600/70">Max Size</span>
                              <span className="font-mono text-amber-900">{spec.maxSize}</span>
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

        <Separator className="bg-amber-200/50" />

        {/* Submission Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-orange-200/50 bg-gradient-to-br from-orange-50 to-amber-50 shadow-xl shadow-orange-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-amber-900">
                <Clock className="w-6 h-6 text-orange-500" />
                Submission Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/60 border border-orange-200/50">
                <div className="text-4xl font-display font-bold text-orange-500">21</div>
                <div>
                  <p className="font-semibold text-amber-900">Business Days Minimum</p>
                  <p className="text-sm text-amber-700/70">
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
          <h3 className="text-xl font-display font-semibold text-amber-900">Pro Tips</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { title: 'Export in ProRes first', desc: 'For best quality before encoding to DXV3.' },
              { title: 'Avoid bright backgrounds', desc: 'LED screens are very bright—use darker tones.' },
              { title: 'Use light logos', desc: 'White or light logo versions display best.' },
              { title: 'Include alpha channel', desc: 'Use DXV3 Alpha for transparent overlays.' },
            ].map((tip, idx) => (
              <Card key={idx} className="border-amber-200/50 bg-white/70">
                <CardContent className="p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900">{tip.title}</p>
                    <p className="text-sm text-amber-700/70">{tip.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-amber-200/50 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={soleiaLogo} alt="Soleia" className="h-6 object-contain opacity-70" />
            <span className="text-sm text-amber-700/60">Content Delivery Specifications</span>
          </div>
          <a 
            href={RESOLUME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            resolume.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default DeliveryGuide;
