import React from 'react';
import { cn } from '@/lib/utils';

interface VenuePlacementDiagramProps {
  selectedPlacements: string[];
  onToggle?: (placement: string) => void;
  interactive?: boolean;
}

const PLACEMENTS = [
  { id: 'Full Room', label: 'Full Room', x: 50, y: 50, width: 60, height: 40, type: 'main' },
  { id: 'Main Wall', label: 'Main Wall', x: 35, y: 30, width: 35, height: 8, type: 'wall' },
  { id: 'Curve Wall', label: 'Curve Wall', x: 85, y: 45, width: 8, height: 30, type: 'curve' },
  { id: 'Sky Blades', label: 'Sky Blades', x: 50, y: 15, width: 40, height: 6, type: 'ceiling' },
  { id: 'Outdoor Beach Club', label: 'Beach Club', x: 20, y: 80, width: 25, height: 15, type: 'outdoor' },
  { id: 'Outdoor Arch', label: 'Arch', x: 80, y: 80, width: 15, height: 15, type: 'outdoor' },
] as const;

const VenuePlacementDiagram: React.FC<VenuePlacementDiagramProps> = ({
  selectedPlacements,
  onToggle,
  interactive = true
}) => {
  return (
    <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-background via-secondary/20 to-background rounded-xl border border-border/50 overflow-hidden">
      {/* Background grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Venue outline */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Main venue building outline */}
        <rect
          x="20"
          y="20"
          width="60"
          height="50"
          rx="2"
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="0.5"
          strokeDasharray="2,2"
          opacity="0.4"
        />

        {/* Outdoor areas */}
        <rect
          x="10"
          y="70"
          width="30"
          height="20"
          rx="2"
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="0.5"
          strokeDasharray="2,2"
          opacity="0.4"
        />
        <rect
          x="70"
          y="70"
          width="20"
          height="20"
          rx="2"
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="0.5"
          strokeDasharray="2,2"
          opacity="0.4"
        />

        {/* Placement zones */}
        {PLACEMENTS.map((placement) => {
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
                rx={placement.type === 'curve' ? 4 : 1}
                className={cn(
                  'transition-all duration-300',
                  isInteractive && 'cursor-pointer',
                  isSelected
                    ? 'fill-primary/30 stroke-primary'
                    : 'fill-muted/20 stroke-muted-foreground/30 hover:fill-primary/10 hover:stroke-primary/50'
                )}
                strokeWidth={isSelected ? 1.5 : 0.5}
                onClick={() => isInteractive && onToggle(placement.id)}
              />

              {/* Glow effect for selected */}
              {isSelected && (
                <rect
                  x={placement.x - placement.width / 2 - 2}
                  y={placement.y - placement.height / 2 - 2}
                  width={placement.width + 4}
                  height={placement.height + 4}
                  rx={placement.type === 'curve' ? 5 : 2}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="0.3"
                  opacity="0.5"
                  className="animate-pulse"
                />
              )}

              {/* Checkmark for selected */}
              {isSelected && (
                <text
                  x={placement.x + placement.width / 2 - 3}
                  y={placement.y - placement.height / 2 + 4}
                  className="text-[4px] fill-primary font-bold"
                >
                  ✓
                </text>
              )}

              {/* Label */}
              <text
                x={placement.x}
                y={placement.y + (placement.type === 'ceiling' ? 0.5 : 1)}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cn(
                  'text-[3px] font-medium pointer-events-none transition-colors duration-300',
                  isSelected ? 'fill-primary' : 'fill-muted-foreground'
                )}
              >
                {placement.label}
              </text>
            </g>
          );
        })}

        {/* Compass indicator */}
        <g transform="translate(92, 10)">
          <circle r="4" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="0.3" />
          <text y="1" textAnchor="middle" dominantBaseline="middle" className="text-[3px] fill-muted-foreground font-medium">
            N
          </text>
        </g>

        {/* Legend markers */}
        <g transform="translate(8, 8)">
          <rect width="3" height="3" rx="0.5" className="fill-primary/30 stroke-primary" strokeWidth="0.3" />
          <text x="5" y="2.5" className="text-[2.5px] fill-muted-foreground">Selected</text>
        </g>
      </svg>

      {/* Title overlay */}
      <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground/60 font-light tracking-wider uppercase">
        Venue Layout • Click to select
      </div>

      {/* Selected indicators */}
      {selectedPlacements.length > 0 && (
        <div className="absolute top-2 right-2 flex flex-wrap gap-1 max-w-[60%] justify-end">
          {selectedPlacements.slice(0, 3).map((placement) => (
            <span 
              key={placement} 
              className="px-1.5 py-0.5 bg-primary/20 rounded-full text-[9px] text-primary font-medium"
            >
              {placement}
            </span>
          ))}
          {selectedPlacements.length > 3 && (
            <span className="px-1.5 py-0.5 bg-primary/20 rounded-full text-[9px] text-primary font-medium">
              +{selectedPlacements.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default VenuePlacementDiagram;
