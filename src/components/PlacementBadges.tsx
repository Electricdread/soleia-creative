import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Monitor, Sun } from 'lucide-react';

interface PlacementBadgesProps {
  placements: string[];
  className?: string;
  compact?: boolean;
}

const INTERIOR_PLACEMENTS = ['Curves SR', 'IMAG SR', 'Center', 'IMAG SL', 'SL Curves', 'DJ Booth'];
const OUTDOOR_PLACEMENTS = ['Outdoor SR', 'Outdoor Arch', 'Outdoor SL'];

const PlacementBadges: React.FC<PlacementBadgesProps> = ({ 
  placements, 
  className = '',
  compact = false 
}) => {
  if (!placements || placements.length === 0) return null;

  const interiorCount = placements.filter(p => INTERIOR_PLACEMENTS.includes(p)).length;
  const outdoorCount = placements.filter(p => OUTDOOR_PLACEMENTS.includes(p)).length;

  if (compact) {
    // Compact mode: just show icons with counts
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {interiorCount > 0 && (
          <div className="flex items-center gap-1 bg-primary/20 text-primary px-1.5 py-0.5 rounded-md text-[10px] font-medium">
            <Monitor className="w-2.5 h-2.5" />
            <span>{interiorCount}</span>
          </div>
        )}
        {outdoorCount > 0 && (
          <div className="flex items-center gap-1 bg-accent/20 text-accent px-1.5 py-0.5 rounded-md text-[10px] font-medium">
            <Sun className="w-2.5 h-2.5" />
            <span>{outdoorCount}</span>
          </div>
        )}
      </div>
    );
  }

  // Full mode: show all placements as badges
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {placements.map((placement) => {
        const isInterior = INTERIOR_PLACEMENTS.includes(placement);
        return (
          <Badge 
            key={placement}
            variant="outline"
            className={`text-[10px] px-1.5 py-0 h-5 ${
              isInterior 
                ? 'border-primary/30 bg-primary/10 text-primary' 
                : 'border-accent/30 bg-accent/10 text-accent'
            }`}
          >
            {isInterior ? (
              <Monitor className="w-2.5 h-2.5 mr-0.5" />
            ) : (
              <Sun className="w-2.5 h-2.5 mr-0.5" />
            )}
            {placement}
          </Badge>
        );
      })}
    </div>
  );
};

export default PlacementBadges;
