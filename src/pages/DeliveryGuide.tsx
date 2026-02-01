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
  CheckCircle2,
  ArrowLeft,
  Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  { step: 1, title: 'Export Source Video', description: 'Export in ProRes or high-quality H264' },
  { step: 2, title: 'Open Resolume Alley', description: 'Free encoder for DXV3 conversion' },
  { step: 3, title: 'Encode to DXV3', description: 'Select DXV3 codec and export' },
  { step: 4, title: 'Submit Content', description: '21 days before your event' },
];

const keyFeatures = [
  'DXV3 GPU Acceleration',
  'Alpha Channel Support',
  'Resolume Optimized',
];

const DeliveryGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #faf6f1, #fef9f3, #ffffff)' }}>
      {/* Header - matching Creative Guide */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: 'rgba(245, 235, 220, 0.95)', backdropFilter: 'blur(12px)', borderColor: 'rgba(194, 165, 130, 0.3)' }}>
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2 hover:bg-amber-100/50"
              style={{ color: '#78716c' }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Looks</span>
            </Button>

            <div className="flex items-center gap-3">
              <img 
                src={soleiaLogo} 
                alt="Soleia" 
                className="h-8 sm:h-10 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-display font-semibold" style={{ background: 'linear-gradient(135deg, #b8860b, #cd853f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Content Delivery Guide
                </h1>
                <p className="text-xs" style={{ color: '#a1887f' }}>DXV3 Format Specifications</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex hover:bg-amber-100/50"
                style={{ color: '#78716c' }}
              >
                <Printer className="w-4 h-4" />
              </Button>
              <PoweredByShowBlox variant="header" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 sm:py-12 space-y-10">
        
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto space-y-6"
        >
          <h2 
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold"
            style={{ background: 'linear-gradient(135deg, #b8860b, #cd853f, #daa520)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Deliver Your Content
          </h2>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: '#6b5b4f' }}>
            Transform your creative vision into venue-ready content. Our Resolume-powered display system requires DXV3 encoding for optimal playback across all LED surfaces.
          </p>
          
          {/* Key Features Badges */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {keyFeatures.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full"
                style={{ backgroundColor: 'rgba(245, 235, 220, 0.8)', border: '1px solid rgba(194, 165, 130, 0.4)' }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#daa520' }} />
                <span className="text-sm font-medium" style={{ color: '#8b7355' }}>{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Quick Actions Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden" style={{ backgroundColor: 'rgba(250, 245, 238, 0.9)', border: '1px solid rgba(194, 165, 130, 0.3)' }}>
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <img src={solIcon} alt="" className="w-7 h-7" />
                <h3 className="text-lg font-semibold" style={{ color: '#5d4e42' }}>Quick Actions</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => window.open(RESOLUME_ALLEY_URL, '_blank')}
                  className="gap-2 rounded-full px-6"
                  style={{ backgroundColor: 'rgba(245, 235, 220, 0.9)', border: '1px solid rgba(194, 165, 130, 0.5)', color: '#8b7355' }}
                  variant="outline"
                >
                  <img src={solIcon} alt="" className="w-4 h-4" />
                  <span className="font-mono text-sm">Download Alley</span>
                </Button>
                <Button 
                  onClick={() => window.open(RESOLUME_URL, '_blank')}
                  className="gap-2 rounded-full px-6"
                  style={{ backgroundColor: 'rgba(245, 235, 220, 0.9)', border: '1px solid rgba(194, 165, 130, 0.5)', color: '#8b7355' }}
                  variant="outline"
                >
                  <img src={solIcon} alt="" className="w-4 h-4" />
                  <span className="font-mono text-sm">Resolume.com</span>
                </Button>
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
          <Card style={{ backgroundColor: 'rgba(250, 245, 238, 0.9)', border: '1px solid rgba(194, 165, 130, 0.3)' }}>
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <FileVideo className="w-5 h-5" style={{ color: '#b8860b' }} />
                <h3 className="text-lg font-semibold" style={{ color: '#5d4e42' }}>Encoding Workflow</h3>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {workflowSteps.map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-4 rounded-2xl"
                    style={{ backgroundColor: 'rgba(255, 253, 250, 0.8)', border: '1px solid rgba(194, 165, 130, 0.25)' }}
                  >
                    <div 
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3"
                      style={{ background: 'linear-gradient(135deg, #daa520, #cd853f)' }}
                    >
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-sm mb-1" style={{ color: '#5d4e42' }}>{item.title}</h4>
                    <p className="text-xs" style={{ color: '#8b7355' }}>{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Display Specifications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <Card style={{ backgroundColor: 'rgba(250, 245, 238, 0.9)', border: '1px solid rgba(194, 165, 130, 0.3)' }}>
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Monitor className="w-5 h-5" style={{ color: '#b8860b' }} />
                <h3 className="text-lg font-semibold" style={{ color: '#5d4e42' }}>Display Specifications</h3>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {displaySpecs.map((spec, index) => (
                  <motion.div
                    key={spec.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="p-5 rounded-2xl"
                    style={{ backgroundColor: 'rgba(255, 253, 250, 0.8)', border: '1px solid rgba(194, 165, 130, 0.25)' }}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="p-2.5 rounded-xl shrink-0"
                        style={{ backgroundColor: 'rgba(218, 165, 32, 0.1)' }}
                      >
                        <spec.icon className="w-5 h-5" style={{ color: '#b8860b' }} />
                      </div>
                      <div className="flex-1 space-y-2.5">
                        <h4 className="font-semibold" style={{ color: '#5d4e42' }}>{spec.name}</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span style={{ color: '#a1887f' }}>Resolution</span>
                            <span className="font-mono" style={{ color: '#5d4e42' }}>{spec.resolution}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: '#a1887f' }}>Format</span>
                            <span className="font-mono" style={{ color: '#5d4e42' }}>{spec.format}</span>
                          </div>
                          {spec.codec && (
                            <div className="flex justify-between items-center">
                              <span style={{ color: '#a1887f' }}>Codec</span>
                              <span 
                                className="font-mono text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: 'rgba(218, 165, 32, 0.15)', color: '#8b7355' }}
                              >
                                {spec.codec}
                              </span>
                            </div>
                          )}
                          {spec.frameRate && (
                            <div className="flex justify-between">
                              <span style={{ color: '#a1887f' }}>Frame Rate</span>
                              <span className="font-mono" style={{ color: '#5d4e42' }}>{spec.frameRate}</span>
                            </div>
                          )}
                          {spec.duration && (
                            <div className="flex justify-between">
                              <span style={{ color: '#a1887f' }}>Duration</span>
                              <span className="font-mono" style={{ color: '#5d4e42' }}>{spec.duration}</span>
                            </div>
                          )}
                          {spec.maxSize && (
                            <div className="flex justify-between">
                              <span style={{ color: '#a1887f' }}>Max Size</span>
                              <span className="font-mono" style={{ color: '#5d4e42' }}>{spec.maxSize}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Submission Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card style={{ backgroundColor: 'rgba(250, 245, 238, 0.9)', border: '1px solid rgba(194, 165, 130, 0.3)' }}>
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5" style={{ color: '#b8860b' }} />
                <h3 className="text-lg font-semibold" style={{ color: '#5d4e42' }}>Submission Timeline</h3>
              </div>
              
              <div 
                className="flex items-center gap-5 p-5 rounded-2xl"
                style={{ backgroundColor: 'rgba(255, 253, 250, 0.8)', border: '1px solid rgba(194, 165, 130, 0.25)' }}
              >
                <div 
                  className="text-4xl font-display font-bold"
                  style={{ background: 'linear-gradient(135deg, #daa520, #cd853f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  21
                </div>
                <div>
                  <p className="font-semibold" style={{ color: '#5d4e42' }}>Business Days Minimum</p>
                  <p className="text-sm mt-0.5" style={{ color: '#8b7355' }}>
                    Submit content at least 21 business days before your event for testing and approval.
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
          transition={{ delay: 0.6 }}
        >
          <Card style={{ backgroundColor: 'rgba(250, 245, 238, 0.9)', border: '1px solid rgba(194, 165, 130, 0.3)' }}>
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <img src={solIcon} alt="" className="w-6 h-6" />
                <h3 className="text-lg font-semibold" style={{ color: '#5d4e42' }}>Pro Tips</h3>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { title: 'Export in ProRes first', desc: 'For best quality before encoding to DXV3.' },
                  { title: 'Avoid bright backgrounds', desc: 'LED screens are very bright—use darker tones.' },
                  { title: 'Use light logos', desc: 'White or light logo versions display best.' },
                  { title: 'Include alpha channel', desc: 'Use DXV3 Alpha for transparent overlays.' },
                ].map((tip, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-xl flex items-start gap-3"
                    style={{ backgroundColor: 'rgba(255, 253, 250, 0.8)', border: '1px solid rgba(194, 165, 130, 0.25)' }}
                  >
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#daa520' }} />
                    <div>
                      <p className="font-medium" style={{ color: '#5d4e42' }}>{tip.title}</p>
                      <p className="text-sm mt-0.5" style={{ color: '#8b7355' }}>{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </main>
      
      {/* Footer */}
      <footer className="border-t py-6" style={{ borderColor: 'rgba(194, 165, 130, 0.3)', backgroundColor: 'rgba(250, 245, 238, 0.5)' }}>
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={soleiaLogo} alt="Soleia" className="h-6 object-contain opacity-70" />
            <span className="text-sm" style={{ color: '#a1887f' }}>Content Delivery Specifications</span>
          </div>
          <a 
            href={RESOLUME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            style={{ color: '#8b7355' }}
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
