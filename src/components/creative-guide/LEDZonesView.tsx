import React, { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VenueScreenMap from '@/components/VenueScreenMap';
import OutdoorPlacementDiagram from '@/components/OutdoorPlacementDiagram';
import { LEDZoneCard } from './LEDZoneCard';
import { ZoneSelectionSummary } from './ZoneSelectionSummary';
import showbloxIcon from '@/assets/showblox-icon.png';
import {
  OUTDOOR_LED_ZONES,
  INDOOR_LED_ZONES,
  ZONE_SUBCATEGORY_LABELS,
  ZONE_TO_SCREEN_MAP,
  SCREEN_TO_ZONE_MAP,
} from '@/lib/creativeGuide';

type ZoneCategory = 'outdoor' | 'indoor';

const ZONE_CATEGORIES: { key: ZoneCategory; label: string; icon: React.ReactNode }[] = [
  { key: 'indoor', label: 'Indoor Zones', icon: <img src={showbloxIcon} alt="" className="w-4 h-4 object-contain showblox-icon-gold" /> },
  { key: 'outdoor', label: 'Outdoor Zones', icon: <img src={showbloxIcon} alt="" className="w-4 h-4 object-contain showblox-icon-gold" /> },
];

export function LEDZonesView() {
  const [activeZoneCategory, setActiveZoneCategory] = useState<ZoneCategory>('indoor');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('right');
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert selected zones to screen IDs for the venue maps
  const selectedScreenIds = useMemo(() => 
    selectedZones.flatMap(zoneId => ZONE_TO_SCREEN_MAP[zoneId] || []),
    [selectedZones]
  );

  const outdoorZoneIds = useMemo(() => OUTDOOR_LED_ZONES.map(z => z.id), []);
  const indoorZoneIds = useMemo(() => INDOOR_LED_ZONES.map(z => z.id), []);

  const toggleZone = useCallback((zoneId: string) => {
    setSelectedZones(prev =>
      prev.includes(zoneId)
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  }, []);

  // Handle screen toggle from the diagram - convert to zone selection
  const handleScreenToggle = useCallback((screenId: string) => {
    const zoneIds = SCREEN_TO_ZONE_MAP[screenId];
    if (zoneIds && zoneIds.length > 0) {
      toggleZone(zoneIds[0]);
    }
  }, [toggleZone]);

  const clearAllSelections = useCallback(() => {
    setSelectedZones([]);
  }, []);

  // Quick select handlers for bulk actions
  const handleBulkSelect = useCallback((zoneIds: string[]) => {
    const allSelected = zoneIds.every(id => selectedZones.includes(id));
    if (allSelected) {
      setSelectedZones(prev => prev.filter(id => !zoneIds.includes(id)));
    } else {
      setSelectedZones(prev => [...new Set([...prev, ...zoneIds])]);
    }
  }, [selectedZones]);

  // Navigation between outdoor/indoor
  const navigateCategory = useCallback((direction: 'prev' | 'next') => {
    const currentIndex = ZONE_CATEGORIES.findIndex(c => c.key === activeZoneCategory);
    const newIndex = direction === 'prev'
      ? Math.max(0, currentIndex - 1)
      : Math.min(ZONE_CATEGORIES.length - 1, currentIndex + 1);

    if (newIndex !== currentIndex) {
      setSwipeDirection(direction === 'prev' ? 'right' : 'left');
      setActiveZoneCategory(ZONE_CATEGORIES[newIndex].key);
    }
  }, [activeZoneCategory]);

  // Handle swipe gestures
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const currentIndex = ZONE_CATEGORIES.findIndex(c => c.key === activeZoneCategory);
    
    if (info.offset.x > threshold && currentIndex > 0) {
      navigateCategory('prev');
    } else if (info.offset.x < -threshold && currentIndex < ZONE_CATEGORIES.length - 1) {
      navigateCategory('next');
    }
  }, [activeZoneCategory, navigateCategory]);

  // Get current zones based on active category
  const currentZones = activeZoneCategory === 'outdoor' ? OUTDOOR_LED_ZONES : INDOOR_LED_ZONES;
  const currentCategoryIndex = ZONE_CATEGORIES.findIndex(c => c.key === activeZoneCategory);

  // Filter selected screens for current diagram
  const outdoorScreenIds = ['Outdoor SR', 'Outdoor Arch', 'Outdoor SL'];
  const currentSelectedScreens = selectedScreenIds.filter(id =>
    activeZoneCategory === 'outdoor'
      ? outdoorScreenIds.includes(id)
      : !outdoorScreenIds.includes(id)
  );

  return (
    <div className="space-y-6" ref={containerRef}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gradient-gold">Brand Your Venue Experience</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Transform every LED surface into a canvas for your brand. Select zones to create an immersive, cohesive visual identity across Soleia's dynamic display ecosystem.
        </p>
        
        {/* Key Points */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-primary font-medium">Pixel-Perfect Resolution</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-primary font-medium">Synchronized Playback</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-primary font-medium">Custom Content Support</span>
          </div>
        </div>
      </div>

      {/* Quick select buttons */}
      <div className="glass rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <img src={showbloxIcon} alt="" className="w-5 h-5 object-contain showblox-icon-gold" />
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
            <img src={showbloxIcon} alt="" className="w-4 h-4 object-contain showblox-icon-gold" />
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
            <img src={showbloxIcon} alt="" className="w-4 h-4 object-contain showblox-icon-gold" />
            All Indoor
          </Button>
        </div>
      </div>

      {/* Two Column Layout: Cards Left, Diagram Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Zone Cards */}
        <div className="order-2 lg:order-1 space-y-4">
          {/* Category Toggle Tabs */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateCategory('prev')}
              disabled={currentCategoryIndex === 0}
              className="w-10 h-10 rounded-full touch-manipulation active:scale-90"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex gap-2">
              {ZONE_CATEGORIES.map((cat) => (
                <Button
                  key={cat.key}
                  variant={activeZoneCategory === cat.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const currentIndex = ZONE_CATEGORIES.findIndex(c => c.key === activeZoneCategory);
                    const newIndex = ZONE_CATEGORIES.findIndex(c => c.key === cat.key);
                    setSwipeDirection(newIndex > currentIndex ? 'left' : 'right');
                    setActiveZoneCategory(cat.key);
                  }}
                  className={`gap-2 transition-all ${
                    activeZoneCategory === cat.key
                      ? 'bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground shadow-lg'
                      : ''
                  }`}
                >
                  {cat.icon}
                  <span className="hidden sm:inline">{cat.label}</span>
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateCategory('next')}
              disabled={currentCategoryIndex === ZONE_CATEGORIES.length - 1}
              className="w-10 h-10 rounded-full touch-manipulation active:scale-90"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Section Header */}
          <div className="flex items-center gap-2">
            <img src={showbloxIcon} alt="" className="w-5 h-5 object-contain showblox-icon-gold" />
            <h2 className="text-lg font-semibold text-foreground">
              {activeZoneCategory === 'outdoor' ? 'Outdoor LED Zones' : 'Indoor LED Zones'}
            </h2>
            <Badge 
              variant="secondary" 
              className={`text-xs ${
                activeZoneCategory === 'outdoor'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-primary/20 text-primary'
              }`}
            >
              {selectedZones.filter(id => 
                (activeZoneCategory === 'outdoor' ? outdoorZoneIds : indoorZoneIds).includes(id)
              ).length}/{activeZoneCategory === 'outdoor' ? outdoorZoneIds.length : indoorZoneIds.length} selected
            </Badge>
          </div>

          {/* Zone Cards - Scrollable Container */}
          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeZoneCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-4"
              >
                {activeZoneCategory === 'outdoor' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {OUTDOOR_LED_ZONES.map((zone, index) => (
                      <motion.div
                        key={zone.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <LEDZoneCard
                          zone={zone}
                          isSelected={selectedZones.includes(zone.id)}
                          onToggle={toggleZone}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  // Indoor zones grouped by subcategory
                  <div className="space-y-4">
                    {['booth', 'curves', 'vertical-transitional', 'main-feature'].map((subcategory, catIndex) => {
                      const zones = INDOOR_LED_ZONES.filter(z => z.subcategory === subcategory);
                      if (zones.length === 0) return null;

                      return (
                        <motion.div 
                          key={subcategory} 
                          className="space-y-2 pt-3 border-t border-border/30 first:pt-0 first:border-0"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: catIndex * 0.1 }}
                        >
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {ZONE_SUBCATEGORY_LABELS[subcategory] || subcategory}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {zones.map((zone, index) => (
                              <motion.div
                                key={zone.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: (catIndex * 0.1) + (index * 0.05) }}
                              >
                                <LEDZoneCard
                                  zone={zone}
                                  isSelected={selectedZones.includes(zone.id)}
                                  onToggle={toggleZone}
                                />
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Diagram - Sticky on Desktop */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <div className="glass rounded-xl p-4 border border-border/50">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              className="touch-pan-x"
            >
              <AnimatePresence mode="wait">
                {activeZoneCategory === 'outdoor' ? (
                  <motion.div
                    key="outdoor-diagram"
                    initial={{ opacity: 0, x: swipeDirection === 'left' ? 100 : -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: swipeDirection === 'left' ? -100 : 100 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <OutdoorPlacementDiagram
                      selectedPlacements={currentSelectedScreens}
                      onToggle={handleScreenToggle}
                      interactive={true}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="indoor-diagram"
                    initial={{ opacity: 0, x: swipeDirection === 'left' ? 100 : -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: swipeDirection === 'left' ? -100 : 100 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <VenueScreenMap
                      selectedPlacements={currentSelectedScreens}
                      onToggle={handleScreenToggle}
                      interactive={true}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 mt-3">
              {ZONE_CATEGORIES.map((cat, index) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setSwipeDirection(index > currentCategoryIndex ? 'left' : 'right');
                    setActiveZoneCategory(cat.key);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentCategoryIndex
                      ? 'w-6 bg-primary'
                      : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Summary FAB */}
      <AnimatePresence>
        {selectedZones.length > 0 && (
          <ZoneSelectionSummary
            selectedZones={selectedZones}
            onClearAll={clearAllSelections}
            onToggleZone={toggleZone}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default LEDZonesView;
