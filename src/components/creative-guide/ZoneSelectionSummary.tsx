import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, Sun, Check, Trash2 } from 'lucide-react';
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
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50"
    >
      <div className="glass rounded-2xl border border-primary/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-primary/20 to-accent/20 border-b border-border/50">
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onClearAll}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Zone list */}
        <ScrollArea className="max-h-48">
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
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] shrink-0 ${
                          zone.category === 'outdoor'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-primary/20 text-primary'
                        }`}
                      >
                        {zone.category === 'outdoor' ? <Sun className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                      </Badge>
                      <span className="text-sm text-foreground truncate">{zone.name}</span>
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
      </div>
    </motion.div>
  );
}

export default ZoneSelectionSummary;
