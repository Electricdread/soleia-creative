import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VenueScreenMapProps {
  selectedPlacements: string[];
  onToggle?: (placement: string) => void;
  interactive?: boolean;
}

// Screen segment IDs that map to the SVG group IDs
// The SVG uses these IDs for the groups containing each screen
const SCREEN_SEGMENTS = [
  // Sol Rays (blue ceiling section)
  { id: 'Sol Rays', svgId: 'SOLEIA_SCREEN_SELECT_0000_SOL_RAYS.psd', group: 'solRays', label: 'Sol Rays', description: 'Main ceiling LED display' },
  // DJ Booth
  { id: 'DJ Booth', svgId: 'BOOTH', group: 'djBooth', label: 'DJ Booth', description: 'Behind DJ booth screen' },
  // Side curves
  { id: 'Curves SL', svgId: 'SL_CURVE', group: 'curves', label: 'Curve SL', description: 'Stage left curved screen' },
  { id: 'Curves SR', svgId: 'SR_CURVE', group: 'curves', label: 'Curve SR', description: 'Stage right curved screen' },
  // IMAG screens
  { id: 'IMAG SL', svgId: 'SL_IMAG.', group: 'imag', label: 'IMAG SL', description: 'Stage left IMAG screen' },
  { id: 'IMAG SR', svgId: 'R_IMAG', group: 'imag', label: 'IMAG SR', description: 'Stage right IMAG screen' },
  // Center screen
  { id: 'Center', svgId: 'CENTER', group: 'center', label: 'Center', description: 'Main center stage screen' },
  // Radial ceiling screens (if present in SVG)
  { id: 'Radial 01', svgId: 'Radial_01', group: 'radials', label: 'R01', description: 'Radial ceiling panel 1' },
  { id: 'Radial 02', svgId: 'Radial_02', group: 'radials', label: 'R02', description: 'Radial ceiling panel 2' },
  { id: 'Radial 03', svgId: 'Radial_03', group: 'radials', label: 'R03', description: 'Radial ceiling panel 3' },
  { id: 'Radial 04', svgId: 'Radial_04', group: 'radials', label: 'R04', description: 'Radial ceiling panel 4' },
  { id: 'Radial 05', svgId: 'Radial_05', group: 'radials', label: 'R05', description: 'Radial ceiling panel 5' },
  { id: 'Radial 06', svgId: 'Radial_06', group: 'radials', label: 'R06', description: 'Radial ceiling panel 6' },
  { id: 'Radial 07', svgId: 'Radial_07', group: 'radials', label: 'R07', description: 'Radial ceiling panel 7' },
  { id: 'Radial 08', svgId: 'Radial_08', group: 'radials', label: 'R08', description: 'Radial ceiling panel 8' },
  { id: 'Radial 09', svgId: 'Radial_09', group: 'radials', label: 'R09', description: 'Radial ceiling panel 9' },
  { id: 'Radial 10', svgId: 'Radial_10', group: 'radials', label: 'R10', description: 'Radial ceiling panel 10' },
  { id: 'Radial 11', svgId: 'Radial_11', group: 'radials', label: 'R11', description: 'Radial ceiling panel 11' },
  { id: 'Radial 12', svgId: 'Radial_12', group: 'radials', label: 'R12', description: 'Radial ceiling panel 12' },
];

// Create a mapping from SVG ID to our ID
const svgIdToId = new Map(SCREEN_SEGMENTS.map(s => [s.svgId, s.id]));
const idToSegment = new Map(SCREEN_SEGMENTS.map(s => [s.id, s]));

const VenueScreenMap: React.FC<VenueScreenMapProps> = ({
  selectedPlacements,
  onToggle,
  interactive = true
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [hoveredScreen, setHoveredScreen] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the SVG overlay
    fetch('/screens-overlay.svg')
      .then(res => res.text())
      .then(svg => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        const svgEl = doc.querySelector('svg');
        
        if (svgEl) {
          // Remove the defs section with clipPaths (we don't need them for display)
          const defs = svgEl.querySelector('defs');
          if (defs) {
            // Keep defs but modify the style - uniform amber HUD theme with CSS filters
            const style = defs.querySelector('style');
            if (style) {
              style.textContent = `
                .screen-group {
                  cursor: pointer;
                  opacity: 0.6;
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  filter: sepia(1) saturate(3) hue-rotate(15deg) brightness(0.9);
                }
                .screen-group:hover {
                  opacity: 0.9;
                  filter: sepia(1) saturate(4) hue-rotate(15deg) brightness(1.1) drop-shadow(0 0 12px rgba(245, 158, 11, 0.8));
                }
                .screen-group.selected {
                  opacity: 1;
                  filter: sepia(1) saturate(5) hue-rotate(15deg) brightness(1.2) drop-shadow(0 0 16px rgba(245, 158, 11, 1)) drop-shadow(0 0 32px rgba(217, 119, 6, 0.6));
                }
                .screen-group.selected:hover {
                  filter: sepia(1) saturate(6) hue-rotate(15deg) brightness(1.3) drop-shadow(0 0 20px rgba(251, 191, 36, 1)) drop-shadow(0 0 40px rgba(245, 158, 11, 0.8));
                }
              `;
            }
          }
          
          // Find all group elements and add interactive class
          const groups = svgEl.querySelectorAll('g[id]');
          groups.forEach(group => {
            const groupId = group.id;
            // Check if this is a screen group we care about
            if (svgIdToId.has(groupId)) {
              group.classList.add('screen-group');
              group.setAttribute('data-screen-id', svgIdToId.get(groupId) || '');
              // Check if selected
              const ourId = svgIdToId.get(groupId);
              if (ourId && selectedPlacements.includes(ourId)) {
                group.classList.add('selected');
              }
            }
          });
          
          setSvgContent(svgEl.outerHTML);
        }
      })
      .catch(err => console.error('Failed to load SVG overlay:', err));
  }, [selectedPlacements]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onToggle) return;
    
    const target = e.target as SVGElement;
    // Find the closest group with an ID
    const group = target.closest('g[id]');
    if (group) {
      const svgId = group.id;
      const ourId = svgIdToId.get(svgId);
      if (ourId) {
        onToggle(ourId);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    
    const target = e.target as SVGElement;
    const group = target.closest('g[id]');
    if (group) {
      const screenId = group.getAttribute('data-screen-id');
      setHoveredScreen(screenId);
    } else {
      setHoveredScreen(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredScreen(null);
  };

  const hoveredSegment = hoveredScreen ? idToSegment.get(hoveredScreen) : null;

  return (
    <TooltipProvider>
      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-gradient-to-b from-background to-muted/30 rounded-xl overflow-hidden border-2 border-border/50 shadow-lg"
      >
        {/* Diagram grid overlay for technical feel */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* SVG overlay with embedded images - this IS the venue photo with overlays */}
        {svgContent && (
          <div 
            className="absolute inset-0 w-full h-full venue-screen-overlay"
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
        
        {/* HUD Labels positioned OUTSIDE screens with connecting lines */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left side labels */}
          <div className="absolute top-[8%] left-[3%] flex items-center gap-1">
            <span className="text-[9px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/60 px-1.5 py-0.5 rounded border border-amber-400/30">RADIALS</span>
            <div className="w-8 h-px bg-amber-400/40"></div>
          </div>
          <div className="absolute top-[52%] left-[1%] flex items-center gap-1">
            <span className="text-[9px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/60 px-1.5 py-0.5 rounded border border-amber-400/30">CURVE SL</span>
          </div>
          <div className="absolute top-[65%] left-[18%] flex items-center gap-1">
            <span className="text-[9px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/60 px-1.5 py-0.5 rounded border border-amber-400/30">IMAG SL</span>
          </div>
          
          {/* Right side labels */}
          <div className="absolute top-[8%] right-[3%] flex items-center gap-1">
            <div className="w-8 h-px bg-amber-400/40"></div>
            <span className="text-[9px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/60 px-1.5 py-0.5 rounded border border-amber-400/30">RADIALS</span>
          </div>
          <div className="absolute top-[52%] right-[1%] flex items-center gap-1">
            <span className="text-[9px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/60 px-1.5 py-0.5 rounded border border-amber-400/30">CURVE SR</span>
          </div>
          <div className="absolute top-[65%] right-[18%] flex items-center gap-1">
            <span className="text-[9px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/60 px-1.5 py-0.5 rounded border border-amber-400/30">IMAG SR</span>
          </div>
          
          {/* Top center - Sol Rays */}
          <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
            <span className="text-[10px] font-mono text-amber-400 tracking-widest uppercase bg-background/60 px-2 py-0.5 rounded border border-amber-400/40 font-semibold">SOL RAYS</span>
          </div>
          
          {/* Bottom labels */}
          <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2">
            <span className="text-[9px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/60 px-1.5 py-0.5 rounded border border-amber-400/30">CENTER</span>
          </div>
          <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2">
            <span className="text-[9px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/60 px-1.5 py-0.5 rounded border border-amber-400/30">DJ BOOTH</span>
          </div>
        </div>
        
        {/* Floating tooltip */}
        {hoveredSegment && (
          <div 
            className="absolute z-50 pointer-events-none transition-opacity duration-150"
            style={{ 
              left: Math.min(mousePos.x + 12, (containerRef.current?.clientWidth || 300) - 160),
              top: Math.max(mousePos.y - 50, 8)
            }}
          >
            <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-xl">
              <p className="font-semibold text-sm text-foreground">{hoveredSegment.label}</p>
              <p className="text-xs text-muted-foreground">{hoveredSegment.description}</p>
              {selectedPlacements.includes(hoveredSegment.id) && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs text-primary font-medium">
                  ✓ Selected
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Diagram header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-background/90 to-transparent px-3 py-2 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-semibold text-foreground/80 tracking-wider uppercase">
                Interior Venue Layout
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              SOLEIA • LAS VEGAS
            </span>
          </div>
        </div>
        
        {/* Legend / Instructions */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-2 pointer-events-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {interactive ? 'Hover for details • Click to select' : 'Screen Layout Overview'}
            </span>
            {/* Screen count indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-muted-foreground/40 border border-muted-foreground/60" />
                <span className="text-[10px] text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span className="text-[10px] text-muted-foreground">Selected</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Selected count badge */}
        {selectedPlacements.length > 0 && (
          <div className="absolute top-10 right-3 px-2.5 py-1 bg-primary/90 rounded-full text-xs font-semibold text-primary-foreground shadow-lg">
            {selectedPlacements.length} screen{selectedPlacements.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

// Export the list of all screen IDs for use elsewhere
export const ALL_SCREEN_IDS = SCREEN_SEGMENTS.map(s => s.id);

// Group screens by category for bulk selection
export const SCREEN_GROUPS = {
  solRays: ['Sol Rays'],
  radials: SCREEN_SEGMENTS.filter(s => s.id.startsWith('Radial')).map(s => s.id),
  curves: SCREEN_SEGMENTS.filter(s => s.id.includes('Curves')).map(s => s.id),
  imag: SCREEN_SEGMENTS.filter(s => s.id.includes('IMAG')).map(s => s.id),
  center: ['Center'],
  djBooth: ['DJ Booth'],
};

export default VenueScreenMap;
