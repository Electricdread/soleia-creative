import React from 'react';
import { cn } from '@/lib/utils';

interface VenuePlacementDiagramProps {
  selectedPlacements: string[];
  onToggle?: (placement: string) => void;
  interactive?: boolean;
}

const PLACEMENTS = [
  { id: 'Curves SR', label: 'CURVES SR', x: 12, y: 50, width: 18, height: 60, type: 'curves', color: 'hsl(65, 100%, 50%)' },
  { id: 'IMAG SR', label: 'IMAG SR', x: 35, y: 50, width: 24, height: 50, type: 'imag', color: 'hsl(280, 60%, 55%)' },
  { id: 'Center', label: 'CENTER', x: 50, y: 25, width: 12, height: 20, type: 'center', color: 'hsl(20, 100%, 55%)' },
  { id: 'IMAG SL', label: 'IMAG SL', x: 65, y: 50, width: 24, height: 50, type: 'imag', color: 'hsl(280, 60%, 55%)' },
  { id: 'SL Curves', label: 'SL CURVES', x: 88, y: 50, width: 18, height: 60, type: 'curves', color: 'hsl(65, 100%, 50%)' },
  { id: 'DJ Booth', label: 'DJ BOOTH', x: 50, y: 80, width: 20, height: 12, type: 'booth', color: 'hsl(120, 80%, 55%)' },
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

      {/* Venue outline - stage area */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">

        {/* Placement zones */}
        {PLACEMENTS.map((placement) => {
          const isSelected = selectedPlacements.includes(placement.id);
          const isInteractive = interactive && onToggle;

          return (
            <g key={placement.id}>
              {/* Zone rectangle with color from placement */}
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

              {/* Label */}
              <text
                x={placement.x}
                y={placement.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cn(
                  'text-[4px] font-bold pointer-events-none transition-colors duration-300 uppercase',
                  isSelected ? 'fill-background' : 'fill-foreground'
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
