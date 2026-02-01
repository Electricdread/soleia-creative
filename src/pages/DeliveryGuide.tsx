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
    <div className="min-h-screen bg-[#FAF6F1]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FAF6F1]/95 backdrop-blur-md border-b border-amber-200/30">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-amber-800 hover:bg-amber-100/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            {/* Logo */}
            <img 
              src={soleiaLogo} 
              alt="Soleia" 
              className="h-8 sm:h-10 object-contain"
            />

            {/* Right side */}
            <div className="flex items-center gap-2">
              <PoweredByShowBlox variant="header" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 sm:py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto space-y-5"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold italic bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
            Content Delivery Guide
          </h2>
          <p className="text-amber-800/80 text-base sm:text-lg leading-relaxed">
            Our venue uses Resolume media servers. Follow this guide to ensure your content displays flawlessly across Soleia's dynamic display ecosystem.
          </p>
          
          {/* Feature Badges */}
          <div className="flex flex-col items-center gap-3 pt-2">
            {['DXV3 Codec Required', 'Resolume Compatible', '21-Day Submission'].map((label) => (
              <Badge 
                key={label}
                className="bg-amber-100/80 text-amber-800 border border-amber-300/50 px-4 py-2 text-sm font-medium rounded-full"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                {label}
              </Badge>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-16 space-y-6">
        
        {/* Resolume Download Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden border-amber-200/50 bg-[#F5EFE6] rounded-2xl">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-100/80 shrink-0">
                  <FileVideo className="w-6 h-6 text-amber-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-950 mb-1">
                    Download Encoder
                  </h3>
                  <p className="text-amber-800/70 text-sm mb-4">
                    Get the free Resolume Alley encoder to convert your videos to DXV3 format.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm"
                      onClick={() => window.open(RESOLUME_ALLEY_URL, '_blank')}
                      className="gap-2 bg-amber-700 hover:bg-amber-800 text-white rounded-full px-4"
                    >
                      <Download className="w-4 h-4" />
                      Resolume Alley
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(RESOLUME_URL, '_blank')}
                      className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 rounded-full px-4"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Website
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
        >
          <Card className="border-amber-200/50 bg-[#F5EFE6] rounded-2xl">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <img src={solIcon} alt="" className="w-6 h-6" />
                <h3 className="text-lg font-semibold text-amber-950">Encoding Workflow</h3>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {workflowSteps.map((item) => (
                  <div
                    key={item.step}
                    className="bg-amber-50/80 border border-amber-200/50 rounded-xl p-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm font-bold mb-2">
                      {item.step}
                    </div>
                    <h4 className="font-medium text-amber-950 text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-amber-700/70">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Display Specifications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-amber-200/50 bg-[#F5EFE6] rounded-2xl">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <img src={solIcon} alt="" className="w-6 h-6" />
                <h3 className="text-lg font-semibold text-amber-950">Display Specifications</h3>
              </div>
              
              <div className="space-y-3">
                {displaySpecs.map((spec) => (
                  <div
                    key={spec.id}
                    className="bg-amber-50/80 border border-amber-200/50 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-amber-100/80">
                        <spec.icon className="w-5 h-5 text-amber-700" />
                      </div>
                      <h4 className="font-semibold text-amber-950">{spec.name}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-amber-700/70">Resolution</span>
                        <span className="font-mono text-amber-900 text-xs">{spec.resolution}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-700/70">Format</span>
                        <span className="font-mono text-amber-900 text-xs">{spec.format}</span>
                      </div>
                      {spec.codec && (
                        <div className="flex justify-between">
                          <span className="text-amber-700/70">Codec</span>
                          <Badge className="bg-amber-200/80 text-amber-800 border-0 font-mono text-xs px-2 py-0">
                            {spec.codec}
                          </Badge>
                        </div>
                      )}
                      {spec.frameRate && (
                        <div className="flex justify-between">
                          <span className="text-amber-700/70">Frame Rate</span>
                          <span className="font-mono text-amber-900 text-xs">{spec.frameRate}</span>
                        </div>
                      )}
                      {spec.duration && (
                        <div className="flex justify-between">
                          <span className="text-amber-700/70">Duration</span>
                          <span className="font-mono text-amber-900 text-xs">{spec.duration}</span>
                        </div>
                      )}
                      {spec.maxSize && (
                        <div className="flex justify-between">
                          <span className="text-amber-700/70">Max Size</span>
                          <span className="font-mono text-amber-900 text-xs">{spec.maxSize}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Submission Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-amber-200/50 bg-[#F5EFE6] rounded-2xl">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-amber-700" />
                <h3 className="text-lg font-semibold text-amber-950">Submission Timeline</h3>
              </div>
              <div className="flex items-center gap-4 bg-amber-50/80 border border-amber-200/50 rounded-xl p-4">
                <div className="text-3xl font-display font-bold text-amber-600">21</div>
                <div>
                  <p className="font-medium text-amber-950 text-sm">Business Days Minimum</p>
                  <p className="text-xs text-amber-700/70">
                    Submit content before your event for testing and approval.
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
        >
          <Card className="border-amber-200/50 bg-[#F5EFE6] rounded-2xl">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <img src={solIcon} alt="" className="w-6 h-6" />
                <h3 className="text-lg font-semibold text-amber-950">Pro Tips</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { title: 'Export in ProRes first', desc: 'For best quality before encoding.' },
                  { title: 'Avoid bright backgrounds', desc: 'LED screens are very bright.' },
                  { title: 'Use light logos', desc: 'White versions display best.' },
                  { title: 'Include alpha channel', desc: 'DXV3 Alpha for transparent overlays.' },
                ].map((tip, idx) => (
                  <div key={idx} className="bg-amber-50/80 border border-amber-200/50 rounded-xl p-3 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-amber-950 text-sm">{tip.title}</p>
                      <p className="text-xs text-amber-700/70">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-amber-200/30 bg-[#F5EFE6]/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={soleiaLogo} alt="Soleia" className="h-5 object-contain opacity-60" />
          <a 
            href={RESOLUME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            resolume.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default DeliveryGuide;
