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
  // Sol Rays (ceiling section) - updated ID for new SVG
  { id: 'Sol Rays', svgId: 'Sol_Rays', group: 'solRays', label: 'Sol Rays', description: 'Main ceiling LED display' },
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

// CSS for gold/amber screens with flicker animation
const getScreenStyles = () => `
  @keyframes flicker-on {
    0% { opacity: 0.3; fill: #78350f; }
    10% { opacity: 0.9; fill: #fbbf24; }
    20% { opacity: 0.4; fill: #b45309; }
    30% { opacity: 1; fill: #f59e0b; }
    40% { opacity: 0.6; fill: #d97706; }
    50% { opacity: 0.95; fill: #fbbf24; }
    60% { opacity: 0.7; fill: #f59e0b; }
    80% { opacity: 1; fill: #fbbf24; }
    100% { opacity: 1; fill: #f59e0b; }
  }
  
  @keyframes pulse-glow {
    0%, 100% { 
      filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.8)) drop-shadow(0 0 16px rgba(217, 119, 6, 0.5));
    }
    50% { 
      filter: drop-shadow(0 0 12px rgba(251, 191, 36, 1)) drop-shadow(0 0 24px rgba(245, 158, 11, 0.7));
    }
  }
  
  .screen-group {
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .screen-group * {
    fill: #78350f;
    opacity: 0.5;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .screen-group:hover * {
    fill: #d97706;
    opacity: 0.8;
    filter: drop-shadow(0 0 8px rgba(217, 119, 6, 0.6));
  }
  
  .screen-group.selected * {
    fill: #f59e0b;
    opacity: 1;
    animation: flicker-on 0.4s ease-out forwards;
  }
  
  .screen-group.selected {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .screen-group.selected:hover * {
    fill: #fbbf24;
    filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.9));
  }
`;

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
          // Modify the defs section - add our custom styles
          const defs = svgEl.querySelector('defs');
          if (defs) {
            // Replace existing style with our gold/amber HUD theme
            const style = defs.querySelector('style');
            if (style) {
              style.textContent = getScreenStyles();
            } else {
              // No existing style, create one
              const newStyle = document.createElementNS('http://www.w3.org/2000/svg', 'style');
              newStyle.textContent = getScreenStyles();
              defs.appendChild(newStyle);
            }
          } else {
            // No defs, create one with our styles
            const newDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const newStyle = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            newStyle.textContent = getScreenStyles();
            newDefs.appendChild(newStyle);
            svgEl.insertBefore(newDefs, svgEl.firstChild);
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
        
        {/* HUD Labels positioned OUTSIDE screens - callout style */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top center - Sol Rays */}
          <div className="absolute top-[2%] left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="text-[10px] font-mono text-amber-400 tracking-[0.2em] uppercase bg-background/80 px-3 py-1 rounded-full border border-amber-500/50 font-semibold shadow-lg shadow-amber-500/20">
              SOL RAYS
            </span>
            <div className="w-px h-4 bg-gradient-to-b from-amber-500/60 to-transparent mt-1" />
          </div>
          
          {/* Left side callouts */}
          <div className="absolute top-[15%] left-[2%] flex items-center gap-2">
            <span className="text-[8px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/70 px-2 py-0.5 rounded border border-amber-500/30">
              RADIALS
            </span>
            <div className="w-6 h-px bg-amber-500/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
          </div>
          
          <div className="absolute top-[48%] left-[2%] flex items-center gap-2">
            <span className="text-[8px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/70 px-2 py-0.5 rounded border border-amber-500/30">
              CURVE SL
            </span>
            <div className="w-4 h-px bg-amber-500/40" />
          </div>
          
          <div className="absolute top-[62%] left-[2%] flex items-center gap-2">
            <span className="text-[8px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/70 px-2 py-0.5 rounded border border-amber-500/30">
              IMAG SL
            </span>
            <div className="w-4 h-px bg-amber-500/40" />
          </div>
          
          {/* Right side callouts */}
          <div className="absolute top-[15%] right-[2%] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
            <div className="w-6 h-px bg-amber-500/40" />
            <span className="text-[8px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/70 px-2 py-0.5 rounded border border-amber-500/30">
              RADIALS
            </span>
          </div>
          
          <div className="absolute top-[48%] right-[2%] flex items-center gap-2">
            <div className="w-4 h-px bg-amber-500/40" />
            <span className="text-[8px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/70 px-2 py-0.5 rounded border border-amber-500/30">
              CURVE SR
            </span>
          </div>
          
          <div className="absolute top-[62%] right-[2%] flex items-center gap-2">
            <div className="w-4 h-px bg-amber-500/40" />
            <span className="text-[8px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/70 px-2 py-0.5 rounded border border-amber-500/30">
              IMAG SR
            </span>
          </div>
          
          {/* Bottom callouts */}
          <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-px h-3 bg-gradient-to-t from-amber-500/60 to-transparent mb-1" />
            <span className="text-[8px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/70 px-2 py-0.5 rounded border border-amber-500/30">
              CENTER
            </span>
          </div>
          
          <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-px h-3 bg-gradient-to-t from-amber-500/60 to-transparent mb-1" />
            <span className="text-[8px] font-mono text-amber-400/90 tracking-widest uppercase bg-background/70 px-2 py-0.5 rounded border border-amber-500/30">
              DJ BOOTH
            </span>
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
