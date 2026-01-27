import React from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { GUIDE_IMAGES } from '@/lib/creativeGuide';

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

      {/* Venue Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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

      {/* Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
