import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, Eye, Sun, Layers, Monitor, ArrowRight, CheckCircle2, Printer, Map, ChevronDown, Tv, LayoutGrid } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GUIDE_IMAGES, VENUE_BLUEPRINT_DETAILS } from '@/lib/creativeGuide';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import solIcon from '@/assets/sol-icon.png';
import { VideoModal } from './VideoModal';

const VIDEO_URL = "https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/clips/Soleia%20Pixelmap%203D%20Preview.mp4";

const OUTDOOR_ZONES = [
  {
    title: 'Arrival / Street-Facing Screens',
    description: 'High-visibility exterior LED screens serve as the first brand touchpoint for guests.',
    useCases: [
      'Brand reveals and announcement moments',
      'Event title cards and sponsor recognition',
      'Looping branded motion graphics',
      'Countdown or pre-event visuals',
    ],
    note: 'Outdoor content is designed for long viewing distances, high brightness, and immediate legibility.',
  },
];

const INDOOR_ZONES = [
  {
    title: 'Main Feature LED Walls',
    description: 'Large-scale interior LED walls act as the visual anchor of the venue.',
    useCases: [
      'Full-screen branded environments',
      'Animated logo reveals',
      'Themed motion backgrounds',
      'Sponsor integrations and transitions',
    ],
    note: 'Content is designed for immersive scale, cinematic motion, and seamless looping.',
  },
  {
    title: 'Architectural LED Accents',
    description: 'Secondary LED surfaces integrated into architectural elements enhance spatial immersion.',
    useCases: [
      'Ambient brand color washes',
      'Subtle motion textures',
      'Pattern-based visuals that complement main content',
    ],
    note: 'These visuals are designed to enhance atmosphere without overpowering primary focal points.',
  },
  {
    title: 'Vertical & Transitional Screens',
    description: 'Vertical LED displays and transitional screens connect guest movement throughout the venue.',
    useCases: [
      'Directional branding',
      'Logo animations adapted for portrait orientation',
      'Modular sponsor placements',
    ],
    note: 'Content is optimized for aspect ratio accuracy and smooth visual flow between spaces.',
  },
];

const CONTENT_STRATEGY = [
  'Proper pixel-mapping and resolution matching per screen',
  'Visual consistency across all zones',
  'Strategic content pacing between focal and ambient displays',
  'Seamless transitions between branded moments and atmospheric visuals',
];

const handlePrintBlueprint = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const details = VENUE_BLUEPRINT_DETAILS;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Soleia Venue Blueprint</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background: #f8f9fa;
          color: #1a1a1a;
          line-height: 1.6;
        }
        .page {
          max-width: 11in;
          margin: 0 auto;
          background: white;
          padding: 0.5in;
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #d4a853;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 300;
          color: #1a1a1a;
          letter-spacing: 2px;
          margin-bottom: 5px;
        }
        .header p {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .blueprint-image {
          width: 100%;
          max-height: 500px;
          object-fit: contain;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        .detail-card {
          background: #fafafa;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          padding: 15px;
        }
        .detail-card h3 {
          font-size: 14px;
          font-weight: 600;
          color: #d4a853;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .detail-item {
          font-size: 12px;
          color: #444;
          padding: 4px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .detail-item:last-child { border-bottom: none; }
        .detail-item strong {
          color: #1a1a1a;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e8e8e8;
          font-size: 10px;
          color: #888;
        }
        .powered-by {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 8px;
        }
        .powered-by img {
          height: 20px;
          width: auto;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <h1>SOLEIA VENUE BLUEPRINT</h1>
          <p>Complete Venue Layout with Display Locations</p>
        </div>
        
        <img src="/creative-guide/venue-blueprint.png" alt="Venue Blueprint" class="blueprint-image" />
        
        <div class="details-grid">
          <div class="detail-card">
            <h3>Cabanas</h3>
            ${details.cabanas.map(c => `
              <div class="detail-item">
                <strong>${c.label}</strong> - ${c.location}
                ${c.tvDisplays ? '<br><span style="color: #d4a853; font-size: 11px;">• TV Displays</span>' : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="detail-card">
            <h3>Bungalows</h3>
            ${details.bungalows.map(b => `
              <div class="detail-item">
                <strong>${b.label}</strong> - ${b.location}
                ${b.tvDisplays ? '<br><span style="color: #d4a853; font-size: 11px;">• TV Displays</span>' : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="detail-card">
            <h3>LED Screens</h3>
            ${details.ledScreens.map(l => `
              <div class="detail-item">
                <strong>${l.label}</strong> - ${l.location}
              </div>
            `).join('')}
          </div>
          
          <div class="detail-card">
            <h3>TV Displays</h3>
            ${details.tvDisplays.map(t => `
              <div class="detail-item">
                <strong>${t.label}</strong> - ${t.location}
              </div>
            `).join('')}
          </div>
          
          <div class="detail-card">
            <h3>Pool Areas</h3>
            ${details.pools.map(p => `
              <div class="detail-item">
                <strong>${p.label}</strong> - ${p.location}
              </div>
            `).join('')}
          </div>
          
          <div class="detail-card">
            <h3>Mezzanine</h3>
            ${details.mezzanine.map(m => `
              <div class="detail-item">
                <strong>${m.label}</strong> - ${m.location}
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="footer">
          <p>Generated from Soleia Creative Guide - ${new Date().toLocaleDateString()}</p>
          <div class="powered-by">
            <span>Powered by</span>
            <img src="/soleia-icon.png" alt="ShowBlox" onerror="this.style.display='none'" />
          </div>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 500);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

export function VenueOverviewView() {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Video autoplay disabled - user must click to play
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gradient-gold">Venue Overview</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Explore the Soleia venue layout and 3D visualization to understand the complete LED ecosystem.
        </p>
      </div>

      {/* LED Ecosystem Intro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass border-primary/30 bg-primary/5">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Sun className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Multi-Zone LED Ecosystem</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Soleia features a layered, multi-zone LED ecosystem designed to deliver continuous brand presence 
                  and immersive storytelling throughout the guest journey. ShowBlox develops content strategically 
                  for each LED zone to ensure visual continuity, optimal resolution, and maximum impact.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Venue Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="glass border-primary/20 overflow-hidden group hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]">
          <div className="relative">
            {/* Clean frame matching 3D visualization style */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10" />
            
            <img 
              src={GUIDE_IMAGES.venueLayout} 
              alt="Soleia Venue Layout"
              className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.02] palm-sway"
            />

            {/* Subtle sun flare effect */}
            <div 
              className="absolute top-1/4 left-1/2 w-32 h-32 rounded-full bg-gradient-radial from-primary/30 via-primary/10 to-transparent venue-flare pointer-events-none z-10"
              style={{ filter: 'blur(20px)' }}
            />

            {/* Sand drift effect at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden pointer-events-none z-10">
              <div className="sand-drift w-full h-full bg-gradient-to-r from-transparent via-amber-200/20 to-transparent dark:via-amber-500/10" />
            </div>

            {/* Shimmer overlay */}
            <div className="absolute inset-0 shimmer-gold pointer-events-none z-10 opacity-50" />
            
            {/* Corner accents */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary/40 rounded-tl-sm z-10" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary/40 rounded-tr-sm z-10" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary/40 rounded-bl-sm z-10" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary/40 rounded-br-sm z-10" />
          </div>
          <CardContent className="p-4 sm:p-6 bg-gradient-to-b from-transparent to-primary/5 dark:to-primary/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg shadow-primary/10">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gradient-gold">Floor Plan Layout</h3>
                <p className="text-xs text-muted-foreground">Complete venue layout with all display locations</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 dark:from-primary/10 dark:to-primary/20 shadow-sm">
                <p className="text-xl font-bold text-gradient-gold">15</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Cabanas</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 dark:from-primary/10 dark:to-primary/20 shadow-sm">
                <p className="text-xl font-bold text-gradient-gold">9</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Bungalows</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 dark:from-primary/10 dark:to-primary/20 shadow-sm">
                <p className="text-xl font-bold text-gradient-gold">2</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Mezzanine Levels</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 dark:from-primary/10 dark:to-primary/20 shadow-sm">
                <p className="text-xl font-bold text-gradient-gold">30+</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Display Zones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Venue Blueprint - Download Link Only */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.075 }}
      >
        <Card className="glass border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg shadow-primary/10">
                  <Map className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gradient-gold">Venue Blueprint</h3>
                  <p className="text-xs text-muted-foreground">Detailed layout with cabanas, TVs, LED screens & more</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintBlueprint}
                className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Download Blueprint</span>
                <span className="sm:hidden">Download</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3D Visualization Video - Tap to fullscreen */}
      <motion.div
        ref={videoContainerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass border-primary/20 overflow-hidden group hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)] cursor-pointer" onClick={() => setVideoModalOpen(true)}>
          <div className="relative">
            {/* Elegant frame with gold accent borders */}
            <div className="absolute inset-0 z-10 pointer-events-none border-4 border-primary/10 dark:border-primary/20" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10" />
            
            <video 
              ref={videoRef}
              src={VIDEO_URL}
              className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
              autoPlay
              loop
              muted
              playsInline
            />

            {/* Tap indicator overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center z-10">
              <span className="text-white/0 group-hover:text-white/80 text-sm font-medium transition-colors">
                Tap for fullscreen
              </span>
            </div>
            
            {/* Corner accents */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary/40 rounded-tl-sm z-10" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary/40 rounded-tr-sm z-10" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary/40 rounded-bl-sm z-10" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary/40 rounded-br-sm z-10" />
          </div>
          <CardContent className="p-4 sm:p-6 bg-gradient-to-b from-transparent to-primary/5 dark:to-primary/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 shadow-lg shadow-primary/10">
                <Eye className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gradient-gold">3D Venue Visualization</h3>
                <p className="text-xs text-muted-foreground">Interactive pixelmap preview of LED screen positions</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This 3D visualization shows the spatial relationship between all LED zones, including outdoor arrival screens, 
              indoor feature walls, booth displays, curved architectural elements, and IMAG screens.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Video Modal */}
      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoSrc={VIDEO_URL}
        posterSrc={GUIDE_IMAGES.visualization3d}
        title="Soleia 3D Venue Visualization"
      />

      {/* Indoor LED Zones Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
            <Layers className="w-3 h-3 mr-1" />
            Indoor
          </Badge>
          <h3 className="text-lg font-semibold text-foreground">Indoor LED Zones</h3>
        </div>
        
        {INDOOR_ZONES.map((zone, index) => (
          <Card key={index} className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-primary" />
                {zone.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{zone.description}</p>
              <div className="space-y-1.5">
                {zone.useCases.map((useCase, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/80">{useCase}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                {zone.note}
              </p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Outdoor LED Zones Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
            <Sun className="w-3 h-3 mr-1" />
            Outdoor
          </Badge>
          <h3 className="text-lg font-semibold text-foreground">Outdoor LED Zones</h3>
        </div>
        
        {OUTDOOR_ZONES.map((zone, index) => (
          <Card key={index} className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-primary" />
                {zone.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{zone.description}</p>
              <div className="space-y-1.5">
                {zone.useCases.map((useCase, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/80">{useCase}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                {zone.note}
              </p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Content Strategy & Delivery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="glass border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Monitor className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-base">Content Strategy & Delivery</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Each LED zone is treated as part of a unified visual system</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">ShowBlox ensures:</p>
            <div className="grid gap-2">
              {CONTENT_STRATEGY.map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
              This approach transforms Soleia into a <span className="text-foreground font-medium">fully immersive branded environment</span> rather 
              than a collection of independent screens.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass border-border/50 overflow-hidden">
          <div className="relative">
            <img 
              src={GUIDE_IMAGES.examples} 
              alt="Content Examples"
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Building2 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Brand Activation Examples</h3>
                <p className="text-xs text-muted-foreground">See how other brands have utilized the LED ecosystem</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              From full-venue takeovers to subtle ambient branding, the Soleia LED ecosystem supports 
              a wide range of creative executions tailored to your brand's vision.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default VenueOverviewView;
