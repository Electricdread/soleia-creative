import React from 'react';
import { cn } from '@/lib/utils';

interface VenueScreenMapProps {
  selectedPlacements: string[];
  onToggle?: (placement: string) => void;
  interactive?: boolean;
}

// Screen segments based on the venue image
// Coordinates are percentages of viewBox (0-100)
const SCREEN_SEGMENTS = [
  // Radial ceiling screens (blue LED strips radiating from center)
  { id: 'Radial 01', points: '960,80 980,80 1050,400 940,400', label: 'R1', color: 'hsl(220, 100%, 55%)' },
  { id: 'Radial 02', points: '1000,90 1030,100 1150,380 1070,360', label: 'R2', color: 'hsl(220, 100%, 55%)' },
  { id: 'Radial 03', points: '1060,110 1100,130 1280,340 1180,310', label: 'R3', color: 'hsl(220, 100%, 55%)' },
  { id: 'Radial 04', points: '1140,150 1200,180 1420,310 1320,270', label: 'R4', color: 'hsl(220, 100%, 55%)' },
  { id: 'Radial 05', points: '1240,200 1320,240 1560,300 1460,260', label: 'R5', color: 'hsl(220, 100%, 55%)' },
  { id: 'Radial 06', points: '1360,260 1460,310 1700,350 1600,300', label: 'R6', color: 'hsl(220, 100%, 55%)' },
  { id: 'Radial 07', points: '940,80 920,80 870,400 980,400', label: 'R7', color: 'hsl(220, 100%, 55%)' },
  { id: 'Radial 08', points: '900,90 870,100 750,380 830,360', label: 'R8', color: 'hsl(220, 100%, 55%)' },
  { id: 'Radial 09', points: '840,110 800,130 620,340 720,310', label: 'R9', color: 'hsl(220, 100%, 55%)' },
  { id: 'Radial 10', points: '760,150 700,180 480,310 580,270', label: 'R10', color: 'hsl(220, 100%, 55%)' },
  { id: 'Radial 11', points: '660,200 580,240 340,300 440,260', label: 'R11', color: 'hsl(220, 100%, 55%)' },
  { id: 'Radial 12', points: '540,260 440,310 200,350 300,300', label: 'R12', color: 'hsl(220, 100%, 55%)' },
  
  // Side curved screens (teal/cyan on sides)
  { id: 'Curves SR', points: '0,340 180,340 200,580 0,580', label: 'CURVES SR', color: 'hsl(170, 80%, 50%)' },
  { id: 'Curves SL', points: '1720,340 1920,340 1920,580 1700,580', label: 'CURVES SL', color: 'hsl(170, 80%, 50%)' },
  
  // IMAG screens (yellow and red large screens)
  { id: 'IMAG SR', points: '680,530 880,530 920,720 640,720', label: 'IMAG SR', color: 'hsl(55, 100%, 55%)' },
  { id: 'IMAG SL', points: '1040,530 1240,530 1280,720 1000,720', label: 'IMAG SL', color: 'hsl(0, 80%, 55%)' },
  
  // Center screen (green behind DJ)
  { id: 'Center', points: '890,530 1030,530 1030,690 890,690', label: 'CENTER', color: 'hsl(140, 80%, 50%)' },
  
  // DJ Booth (magenta/pink strip)
  { id: 'DJ Booth', points: '770,740 1150,740 1150,790 770,790', label: 'DJ BOOTH', color: 'hsl(300, 80%, 60%)' },
] as const;

const VenueScreenMap: React.FC<VenueScreenMapProps> = ({
  selectedPlacements,
  onToggle,
  interactive = true
}) => {
  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-border/50">
      {/* Background venue image */}
      <img 
        src="/venue-screens.png" 
        alt="Venue layout"
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />
      
      {/* SVG overlay for interactive screen segments */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 1920 1080" 
        preserveAspectRatio="xMidYMid slice"
        style={{ pointerEvents: 'none' }}
      >
        {SCREEN_SEGMENTS.map((segment) => {
          const isSelected = selectedPlacements.includes(segment.id);
          const isInteractive = interactive && onToggle;

          return (
            <g key={segment.id}>
              {/* Screen polygon */}
              <polygon
                points={segment.points}
                fill={isSelected ? segment.color : `${segment.color}20`}
                stroke={isSelected ? 'hsl(45, 100%, 60%)' : segment.color}
                strokeWidth={isSelected ? 4 : 2}
                opacity={isSelected ? 0.85 : 0.5}
                className={cn(
                  'transition-all duration-200',
                  isInteractive && 'cursor-pointer hover:opacity-80'
                )}
                style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
                onClick={() => isInteractive && onToggle(segment.id)}
                onMouseEnter={(e) => {
                  if (isInteractive && !isSelected) {
                    e.currentTarget.style.fill = `${segment.color}50`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (isInteractive && !isSelected) {
                    e.currentTarget.style.fill = `${segment.color}20`;
                  }
                }}
              />
              
              {/* Glow effect for selected */}
              {isSelected && (
                <polygon
                  points={segment.points}
                  fill="none"
                  stroke="hsl(45, 100%, 60%)"
                  strokeWidth="6"
                  opacity="0.4"
                  className="animate-pulse"
                  style={{ pointerEvents: 'none' }}
                />
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Legend / Title */}
      <div className="absolute bottom-2 left-2 text-[10px] text-white/70 font-light tracking-wider uppercase bg-black/50 px-2 py-1 rounded">
        {interactive ? 'Click screens to select' : 'Screen Layout'}
      </div>
      
      {/* Selected count badge */}
      {selectedPlacements.length > 0 && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-primary/90 rounded-full text-xs font-semibold text-primary-foreground">
          {selectedPlacements.length} selected
        </div>
      )}
    </div>
  );
};

// Export the list of all screen IDs for use elsewhere
export const ALL_SCREEN_IDS = SCREEN_SEGMENTS.map(s => s.id);

// Group screens by category for bulk selection
export const SCREEN_GROUPS = {
  radials: SCREEN_SEGMENTS.filter(s => s.id.startsWith('Radial')).map(s => s.id),
  curves: SCREEN_SEGMENTS.filter(s => s.id.includes('Curves')).map(s => s.id),
  imag: SCREEN_SEGMENTS.filter(s => s.id.includes('IMAG')).map(s => s.id),
  center: ['Center'],
  djBooth: ['DJ Booth'],
};

export default VenueScreenMap;
