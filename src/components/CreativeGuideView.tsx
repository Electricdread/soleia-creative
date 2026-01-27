import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Map, 
  Monitor, 
  Sun, 
  ArrowLeft,
  Zap,
  Building2,
  FileText,
  Palette,
  BookOpen,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import VenueScreenMap from '@/components/VenueScreenMap';
import OutdoorPlacementDiagram from '@/components/OutdoorPlacementDiagram';
import { LEDZoneCard } from '@/components/creative-guide/LEDZoneCard';
import { ZoneSelectionSummary } from '@/components/creative-guide/ZoneSelectionSummary';
import { DisplaySpecsView } from '@/components/creative-guide/DisplaySpecsView';
import { VenueOverviewView } from '@/components/creative-guide/VenueOverviewView';
import { CustomContentView } from '@/components/creative-guide/CustomContentView';
import { IntroductionView } from '@/components/creative-guide/IntroductionView';
import {
  creativeGuideCategories,
  type CreativeGuideCategoryKey,
  OUTDOOR_LED_ZONES,
  INDOOR_LED_ZONES,
  ZONE_SUBCATEGORY_LABELS,
} from '@/lib/creativeGuide';
import soleiaLogo from '@/assets/soleia-logo-new.png';
import { PoweredByShowBlox } from '@/components/PoweredByShowBlox';

const CreativeGuideView = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<CreativeGuideCategoryKey>('introduction');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('right');

  // Map screen IDs to zone IDs for venue map
  const screenIdToZoneId: Record<string, string> = {
    'Sol Rays': 'sol-rays',
    'Center': 'center',
    'DJ Booth': 'dj-booth',
    'Curves SL': 'curves-sl',
    'Curves SR': 'curves-sr',
    'IMAG SL': 'imag-sl',
    'IMAG SR': 'imag-sr',
    'Outdoor SR': 'outdoor-sr',
    'Outdoor Arch': 'outdoor-arch',
    'Outdoor SL': 'outdoor-sl',
  };

  const zoneIdToScreenId: Record<string, string> = Object.fromEntries(
    Object.entries(screenIdToZoneId).map(([k, v]) => [v, k])
  );

  const currentCategoryIndex = creativeGuideCategories.findIndex(c => c.key === selectedCategory);

  const navigateCategory = useCallback((direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev'
      ? Math.max(0, currentCategoryIndex - 1)
      : Math.min(creativeGuideCategories.length - 1, currentCategoryIndex + 1);
    
    if (newIndex !== currentCategoryIndex) {
      setSwipeDirection(direction === 'prev' ? 'right' : 'left');
      setSelectedCategory(creativeGuideCategories[newIndex].key);
    }
  }, [currentCategoryIndex]);

  const toggleZone = useCallback((zoneId: string) => {
    setSelectedZones(prev => 
      prev.includes(zoneId) 
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  }, []);

  const handleScreenToggle = useCallback((screenId: string) => {
    const zoneId = screenIdToZoneId[screenId];
    if (zoneId) {
      toggleZone(zoneId);
    }
  }, [toggleZone]);

  const clearAllSelections = useCallback(() => {
    setSelectedZones([]);
  }, []);

  // Convert selected zones to screen IDs for the venue map
  const selectedScreenIds = selectedZones
    .map(zoneId => zoneIdToScreenId[zoneId])
    .filter(Boolean);

  // Quick select handlers for bulk actions
  const handleBulkSelect = useCallback((zoneIds: string[]) => {
    const allSelected = zoneIds.every(id => selectedZones.includes(id));
    if (allSelected) {
      setSelectedZones(prev => prev.filter(id => !zoneIds.includes(id)));
    } else {
      setSelectedZones(prev => [...new Set([...prev, ...zoneIds])]);
    }
  }, [selectedZones]);

  const outdoorZoneIds = OUTDOOR_LED_ZONES.map(z => z.id);
  const indoorZoneIds = INDOOR_LED_ZONES.map(z => z.id);

  const categoryIcons: Record<string, React.ReactNode> = {
    'introduction': <BookOpen className="w-5 h-5" />,
    'venue-overview': <Building2 className="w-5 h-5" />,
    'venue-screen-map': <Map className="w-5 h-5" />,
    'display-specs': <FileText className="w-5 h-5" />,
    'led-zones': <Monitor className="w-5 h-5" />,
    'custom-content': <Palette className="w-5 h-5" />,
  };

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
                <h1 className="text-lg font-semibold text-gradient-gold">Creative Guide</h1>
                <p className="text-xs text-muted-foreground">Digital Branding Specifications</p>
              </div>
            </div>

            {/* Right side: Print button and ShowBlox (theme toggle) */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/creative-guide/print')}
                className="gap-2 hidden sm:flex"
              >
                <Printer className="w-4 h-4" />
                <span>Print Guide</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/creative-guide/print')}
                className="sm:hidden"
              >
                <Printer className="w-4 h-4" />
              </Button>
              <PoweredByShowBlox variant="header" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Category Navigation - Desktop */}
        <nav className="relative mb-8 hidden lg:block">
          <div 
            ref={scrollContainerRef}
            className="flex gap-3 justify-center flex-wrap"
          >
            {creativeGuideCategories.map((cat, index) => (
              <motion.button
                key={cat.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-5 py-3 rounded-2xl font-medium whitespace-nowrap flex items-center gap-2.5 transition-all touch-manipulation select-none ${
                  selectedCategory === cat.key
                    ? 'bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground shadow-lg'
                    : 'glass hover:bg-primary/10 hover:border-primary/30 text-foreground active:scale-95'
                }`}
              >
                {categoryIcons[cat.key]}
                <div className="text-left">
                  <span className="block text-sm font-semibold">{cat.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </nav>

        {/* Category Navigation - Mobile */}
        <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateCategory('prev')}
            disabled={currentCategoryIndex === 0}
            className="w-12 h-12 rounded-full touch-manipulation active:scale-90"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              {categoryIcons[selectedCategory]}
              <p className="text-lg font-medium text-foreground">
                {creativeGuideCategories[currentCategoryIndex]?.label}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {creativeGuideCategories[currentCategoryIndex]?.description}
            </p>
            {/* Mobile dot indicators */}
            <div className="flex justify-center gap-1.5 mt-2">
              {creativeGuideCategories.map((cat, index) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentCategoryIndex
                      ? 'w-6 bg-primary'
                      : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateCategory('next')}
            disabled={currentCategoryIndex === creativeGuideCategories.length - 1}
            className="w-12 h-12 rounded-full touch-manipulation active:scale-90"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {selectedCategory === 'introduction' && (
            <motion.div
              key="introduction"
              initial={{ opacity: 0, x: swipeDirection === 'left' ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: swipeDirection === 'left' ? -50 : 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <IntroductionView />
            </motion.div>
          )}

          {selectedCategory === 'venue-overview' && (
            <motion.div
              key="venue-overview"
              initial={{ opacity: 0, x: swipeDirection === 'left' ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: swipeDirection === 'left' ? -50 : 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <VenueOverviewView />
            </motion.div>
          )}

          {selectedCategory === 'venue-screen-map' && (
            <motion.div
              key="venue-screen-map"
              initial={{ opacity: 0, x: swipeDirection === 'left' ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: swipeDirection === 'left' ? -50 : 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-gradient-gold">Interactive Screen Map</h2>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  Tap on any screen to select it. Use quick select buttons to choose entire zones at once.
                </p>
              </div>

              {/* Quick select buttons */}
              <div className="glass rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-foreground">Quick Select</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs gap-1.5 transition-all font-mono tracking-wide ${
                      outdoorZoneIds.every(id => selectedZones.includes(id))
                        ? 'bg-amber-500/30 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                        : 'border-amber-500/30 text-amber-500/70 hover:border-amber-500/60 hover:text-amber-400 hover:bg-amber-500/10'
                    }`}
                    onClick={() => handleBulkSelect(outdoorZoneIds)}
                  >
                    <Sun className="w-3 h-3" />
                    All Outdoor
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs gap-1.5 transition-all font-mono tracking-wide ${
                      indoorZoneIds.every(id => selectedZones.includes(id))
                        ? 'bg-primary/30 border-primary text-primary shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                        : 'border-primary/30 text-primary/70 hover:border-primary/60 hover:text-primary hover:bg-primary/10'
                    }`}
                    onClick={() => handleBulkSelect(indoorZoneIds)}
                  >
                    <Monitor className="w-3 h-3" />
                    All Indoor
                  </Button>
                </div>
              </div>

              {/* Outdoor Diagram */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-foreground">Outdoor LED Zones</h2>
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 text-xs">
                    {selectedZones.filter(id => outdoorZoneIds.includes(id)).length}/{outdoorZoneIds.length}
                  </Badge>
                </div>
                <OutdoorPlacementDiagram
                  selectedPlacements={selectedScreenIds.filter(id => 
                    ['Outdoor SR', 'Outdoor Arch', 'Outdoor SL'].includes(id)
                  )}
                  onToggle={handleScreenToggle}
                  interactive={true}
                />
              </div>

              {/* Indoor Diagram */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Indoor LED Zones</h2>
                  <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                    {selectedZones.filter(id => indoorZoneIds.includes(id)).length}/{indoorZoneIds.length}
                  </Badge>
                </div>
                <VenueScreenMap
                  selectedPlacements={selectedScreenIds.filter(id => 
                    !['Outdoor SR', 'Outdoor Arch', 'Outdoor SL'].includes(id)
                  )}
                  onToggle={handleScreenToggle}
                  interactive={true}
                />
              </div>
            </motion.div>
          )}

          {selectedCategory === 'display-specs' && (
            <motion.div
              key="display-specs"
              initial={{ opacity: 0, x: swipeDirection === 'left' ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: swipeDirection === 'left' ? -50 : 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <DisplaySpecsView />
            </motion.div>
          )}

          {selectedCategory === 'led-zones' && (
            <motion.div
              key="led-zones"
              initial={{ opacity: 0, x: swipeDirection === 'left' ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: swipeDirection === 'left' ? -50 : 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-gradient-gold">LED Zone Details</h2>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  Explore each LED zone with specifications, use cases, and recommended content types.
                </p>
              </div>

              {/* Outdoor Zones */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-foreground">Outdoor LED Zones</h2>
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 text-xs">
                    Arrival / Street-Facing
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  High-visibility exterior LED screens designed for long viewing distances, high brightness, and immediate legibility.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {OUTDOOR_LED_ZONES.map(zone => (
                    <LEDZoneCard
                      key={zone.id}
                      zone={zone}
                      isSelected={selectedZones.includes(zone.id)}
                      onToggle={toggleZone}
                    />
                  ))}
                </div>
              </div>

              {/* Indoor Zones by Subcategory */}
              {['booth', 'curves', 'vertical-transitional', 'main-feature'].map(subcategory => {
                const zones = INDOOR_LED_ZONES.filter(z => z.subcategory === subcategory);
                if (zones.length === 0) return null;
                
                return (
                  <div key={subcategory} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold text-foreground">
                        {ZONE_SUBCATEGORY_LABELS[subcategory] || subcategory}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {zones.map(zone => (
                        <LEDZoneCard
                          key={zone.id}
                          zone={zone}
                          isSelected={selectedZones.includes(zone.id)}
                          onToggle={toggleZone}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {selectedCategory === 'custom-content' && (
            <motion.div
              key="custom-content"
              initial={{ opacity: 0, x: swipeDirection === 'left' ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: swipeDirection === 'left' ? -50 : 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <CustomContentView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Selection Summary - only show on interactive pages */}
      <AnimatePresence>
        {selectedZones.length > 0 && (selectedCategory === 'venue-screen-map' || selectedCategory === 'led-zones') && (
          <ZoneSelectionSummary
            selectedZones={selectedZones}
            onToggleZone={toggleZone}
            onClearAll={clearAllSelections}
          />
        )}
      </AnimatePresence>
      
      {/* Powered by ShowBlox Footer */}
      <PoweredByShowBlox className="border-t border-border/30 mt-8" />
    </div>
  );
};

export default CreativeGuideView;
