import React from 'react';
import { cn } from '@/lib/utils';

interface OutdoorPlacementDiagramProps {
  selectedPlacements: string[];
  onToggle?: (placement: string) => void;
  interactive?: boolean;
}

const OUTDOOR_PLACEMENTS = [
  { id: 'Outdoor SR', label: 'OUTDOOR', sublabel: 'SR', x: 12, y: 50, width: 18, height: 70, color: 'hsl(220, 80%, 55%)' },
  { id: 'Outdoor Arch', label: 'OUTDOOR', sublabel: 'ARCH', x: 50, y: 60, width: 35, height: 40, color: 'hsl(220, 80%, 55%)' },
  { id: 'Outdoor SL', label: 'OUTDOOR', sublabel: 'SL', x: 88, y: 50, width: 18, height: 70, color: 'hsl(220, 80%, 55%)' },
] as const;

const OutdoorPlacementDiagram: React.FC<OutdoorPlacementDiagramProps> = ({
  selectedPlacements,
  onToggle,
  interactive = true
}) => {
  return (
    <div className="relative w-full max-w-md aspect-[3/1] bg-gradient-to-br from-background via-secondary/20 to-background rounded-lg border border-border/50 overflow-hidden">
      {/* Background grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="outdoor-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#outdoor-grid)" />
      </svg>

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Placement zones */}
        {OUTDOOR_PLACEMENTS.map((placement) => {
          const isSelected = selectedPlacements.includes(placement.id);
          const isInteractive = interactive && onToggle;

          return (
            <g key={placement.id}>
              {/* Zone rectangle */}
              <rect
                x={placement.x - placement.width / 2}
                y={placement.y - placement.height / 2}
                width={placement.width}
                height={placement.height}
                rx={1}
                fill={isSelected ? placement.color : `${placement.color}40`}
                stroke={isSelected ? 'hsl(var(--primary))' : placement.color}
                strokeWidth={isSelected ? 2 : 0.5}
                opacity={isSelected ? 1 : 0.7}
                className={cn(
                  'transition-all duration-300',
                  isInteractive && 'cursor-pointer hover:opacity-100'
                )}
                onClick={() => isInteractive && onToggle(placement.id)}
              />

              {/* Glow effect for selected */}
              {isSelected && (
                <rect
                  x={placement.x - placement.width / 2 - 1}
                  y={placement.y - placement.height / 2 - 1}
                  width={placement.width + 2}
                  height={placement.height + 2}
                  rx={2}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="0.5"
                  opacity="0.6"
                  className="animate-pulse"
                />
              )}

              {/* Checkmark for selected */}
              {isSelected && (
                <text
                  x={placement.x + placement.width / 2 - 3}
                  y={placement.y - placement.height / 2 + 4}
                  className="text-[4px] fill-background font-bold"
                >
                  ✓
                </text>
              )}

              {/* Label - top text */}
              <text
                x={placement.x}
                y={placement.y - 4}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cn(
                  'text-[3px] font-bold pointer-events-none transition-colors duration-300 uppercase tracking-wider',
                  isSelected ? 'fill-background' : 'fill-foreground'
                )}
              >
                {placement.label}
              </text>

              {/* Sublabel - large text */}
              <text
                x={placement.x}
                y={placement.y + 6}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cn(
                  'text-[8px] font-black pointer-events-none transition-colors duration-300 uppercase',
                  isSelected ? 'fill-background' : 'fill-foreground'
                )}
              >
                {placement.sublabel}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Title overlay */}
      <div className="absolute bottom-1 left-1 text-[8px] text-muted-foreground/60 font-light tracking-wider uppercase">
        Outdoor Screens • Click to select
      </div>

      {/* Selected indicators */}
      {selectedPlacements.filter(p => OUTDOOR_PLACEMENTS.some(op => op.id === p)).length > 0 && (
        <div className="absolute top-2 right-2 flex flex-wrap gap-1 max-w-[60%] justify-end">
          {selectedPlacements
            .filter(p => OUTDOOR_PLACEMENTS.some(op => op.id === p))
            .slice(0, 3)
            .map((placement) => (
              <span 
                key={placement} 
                className="px-1.5 py-0.5 bg-primary/20 rounded-full text-[9px] text-primary font-medium"
              >
                {placement}
              </span>
            ))}
        </div>
      )}
    </div>
  );
};

export default OutdoorPlacementDiagram;
