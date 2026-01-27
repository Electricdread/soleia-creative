import React from 'react';
import { motion } from 'framer-motion';
import { Check, Monitor, Sun, Layers, Disc } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LEDZone } from '@/lib/creativeGuide';
import { ZONE_SUBCATEGORY_LABELS } from '@/lib/creativeGuide';

interface LEDZoneCardProps {
  zone: LEDZone;
  isSelected: boolean;
  onToggle: (zoneId: string) => void;
}

const subcategoryIcons: Record<string, React.ReactNode> = {
  'arrival': <Sun className="w-4 h-4" />,
  'main-feature': <Monitor className="w-4 h-4" />,
  'architectural': <Layers className="w-4 h-4" />,
  'vertical-transitional': <Monitor className="w-4 h-4" />,
  'booth': <Disc className="w-4 h-4" />,
  'curves': <Layers className="w-4 h-4" />,
};

export function LEDZoneCard({ zone, isSelected, onToggle }: LEDZoneCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={`relative cursor-pointer transition-all duration-300 touch-manipulation overflow-hidden h-full ${
          isSelected
            ? 'ring-2 ring-primary bg-primary/10 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
            : 'glass hover:bg-primary/5 hover:border-primary/30'
        }`}
        onClick={() => onToggle(zone.id)}
      >
        {/* Selection indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg z-10"
          >
            <Check className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        )}

        <CardContent className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-muted/50'}`}>
              {subcategoryIcons[zone.subcategory] || <Monitor className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{zone.name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge 
                  variant="secondary" 
                  className={`text-[10px] ${
                    zone.category === 'outdoor' 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                      : 'bg-primary/20 text-primary border-primary/30'
                  }`}
                >
                  {zone.category === 'outdoor' ? 'Outdoor' : 'Indoor'}
                </Badge>
                {zone.resolution && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {zone.resolution}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Subcategory */}
          <p className="text-xs text-muted-foreground font-medium mb-2">
            {ZONE_SUBCATEGORY_LABELS[zone.subcategory] || zone.subcategory}
          </p>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {zone.description}
          </p>

          {/* Use cases */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Ideal for:
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {zone.useCases.slice(0, 2).map((useCase, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="line-clamp-1">{useCase}</span>
                </li>
              ))}
              {zone.useCases.length > 2 && (
                <li className="text-primary/70 text-[10px]">
                  +{zone.useCases.length - 2} more
                </li>
              )}
            </ul>
          </div>

          {/* Specs if available */}
          {zone.specs?.resolution && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase">Resolution</span>
                <span className="text-xs font-mono text-foreground">{zone.specs.resolution}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default LEDZoneCard;
