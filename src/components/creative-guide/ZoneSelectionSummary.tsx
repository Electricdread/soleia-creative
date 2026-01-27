import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, Sun, Check, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ALL_LED_ZONES, ZONE_SUBCATEGORY_LABELS } from '@/lib/creativeGuide';

interface ZoneSelectionSummaryProps {
  selectedZones: string[];
  onToggleZone: (zoneId: string) => void;
  onClearAll: () => void;
}

export function ZoneSelectionSummary({
  selectedZones,
  onToggleZone,
  onClearAll,
}: ZoneSelectionSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedZoneDetails = selectedZones
    .map(id => ALL_LED_ZONES.find(z => z.id === id))
    .filter(Boolean);

  const outdoorCount = selectedZoneDetails.filter(z => z?.category === 'outdoor').length;
  const indoorCount = selectedZoneDetails.filter(z => z?.category === 'indoor').length;

  if (selectedZones.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50"
    >
      <div className="glass rounded-2xl border border-primary/30 shadow-2xl overflow-hidden">
        {/* Header - clickable to expand/collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 bg-gradient-to-r from-primary/20 to-accent/20 border-b border-border/50 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  {selectedZones.length} Zone{selectedZones.length !== 1 ? 's' : ''} Selected
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {outdoorCount > 0 && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1">
                      <Sun className="w-3 h-3" /> {outdoorCount} Outdoor
                    </span>
                  )}
                  {indoorCount > 0 && (
                    <span className="text-[10px] text-primary flex items-center gap-1">
                      <Monitor className="w-3 h-3" /> {indoorCount} Indoor
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearAll();
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="w-6 h-6 flex items-center justify-center text-muted-foreground">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </div>
            </div>
          </div>
        </button>

        {/* Expandable Zone list */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <ScrollArea className="max-h-64">
                <div className="p-3 space-y-2">
                  <AnimatePresence mode="popLayout">
                    {selectedZoneDetails.map((zone) => (
                      zone && (
                        <motion.div
                          key={zone.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border border-border/50 gap-3"
                        >
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <Badge
                              variant="secondary"
                              className={`text-[9px] shrink-0 mt-0.5 ${
                                zone.category === 'outdoor'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-primary/20 text-primary'
                              }`}
                            >
                              {zone.category === 'outdoor' ? <Sun className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-foreground font-medium block">{zone.name}</span>
                              <span className="text-xs text-muted-foreground block mt-0.5">
                                {ZONE_SUBCATEGORY_LABELS[zone.subcategory] || zone.subcategory}
                              </span>
                              {zone.resolution && (
                                <span className="text-[10px] text-muted-foreground/70 font-mono block mt-1">
                                  {zone.resolution}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => onToggleZone(zone.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      )
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed preview - show first 2 zones and count */}
        {!isExpanded && selectedZoneDetails.length > 0 && (
          <div className="p-3 space-y-1">
            {selectedZoneDetails.slice(0, 2).map((zone) => (
              zone && (
                <div key={zone.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  {zone.category === 'outdoor' ? (
                    <Sun className="w-3 h-3 text-amber-400 shrink-0" />
                  ) : (
                    <Monitor className="w-3 h-3 text-primary shrink-0" />
                  )}
                  <span className="truncate">{zone.name}</span>
                </div>
              )
            ))}
            {selectedZoneDetails.length > 2 && (
              <div className="text-xs text-primary font-medium pt-1">
                +{selectedZoneDetails.length - 2} more zones — tap to expand
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ZoneSelectionSummary;
