import React from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Eye, Sun, Layers, Monitor, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GUIDE_IMAGES } from '@/lib/creativeGuide';
import { Badge } from '@/components/ui/badge';

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

export function VenueOverviewView() {
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
        <Card className="glass border-border/50 overflow-hidden">
          <div className="relative">
            <img 
              src={GUIDE_IMAGES.venueLayout} 
              alt="Soleia Venue Layout"
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Floor Plan Layout</h3>
                <p className="text-xs text-muted-foreground">Complete venue layout with all display locations</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-lg font-bold text-primary">15</p>
                <p className="text-[10px] uppercase text-muted-foreground">Cabanas</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-lg font-bold text-primary">9</p>
                <p className="text-[10px] uppercase text-muted-foreground">Bungalows</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-lg font-bold text-primary">2</p>
                <p className="text-[10px] uppercase text-muted-foreground">Mezzanine Levels</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-lg font-bold text-primary">30+</p>
                <p className="text-[10px] uppercase text-muted-foreground">Display Zones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3D Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass border-border/50 overflow-hidden">
          <div className="relative">
            <img 
              src={GUIDE_IMAGES.visualization3d} 
              alt="3D Venue Visualization"
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Eye className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">3D Venue Visualization</h3>
                <p className="text-xs text-muted-foreground">Interactive view of LED screen positions and dimensions</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This 3D visualization shows the spatial relationship between all LED zones, including outdoor arrival screens, 
              indoor feature walls, booth displays, curved architectural elements, and IMAG screens.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Outdoor LED Zones Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
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

      {/* Indoor LED Zones Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
