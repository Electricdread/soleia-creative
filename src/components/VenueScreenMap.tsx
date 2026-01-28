import React, { useState, useEffect, useRef } from 'react';

interface VenueScreenMapProps {
  selectedPlacements: string[];
  onToggle?: (placement: string) => void;
  interactive?: boolean;
}

// Screen segment IDs that map to the SVG group IDs
// The SVG uses these IDs for the groups containing each screen
const SCREEN_SEGMENTS = [
  // Sol Rays (ceiling section)
  { id: 'Sol Rays', svgId: 'Sol_Rays', group: 'solRays', label: 'Sol Rays', description: 'Main ceiling LED display' },
  // DJ Booth - uses long illustrator-exported ID
  { id: 'DJ Booth', svgId: 'SOLEIA_SCREEN_white_x5F_0006_x5F_booth.psd', group: 'djBooth', label: 'DJ Booth', description: 'Behind DJ booth screen' },
  // Side curves
  { id: 'Curves SL', svgId: 'sl_curves', group: 'curves', label: 'Curve SL', description: 'Stage left curved screen' },
  { id: 'Curves SR', svgId: 'sr_curves', group: 'curves', label: 'Curve SR', description: 'Stage right curved screen' },
  // IMAG screens
  { id: 'IMAG SL', svgId: 'sl_imag', group: 'imag', label: 'IMAG SL', description: 'Stage left IMAG screen' },
  { id: 'IMAG SR', svgId: 'sr_imag', group: 'imag', label: 'IMAG SR', description: 'Stage right IMAG screen' },
  // Center screen
  { id: 'Center', svgId: 'center', group: 'center', label: 'Center', description: 'Main center stage screen' },
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
  
  /* Reset all clip paths that cause overlap */
  .st0, .st1, .st3, .st4, .st5, .st6, .st7 {
    clip-path: none !important;
  }
  
  /* Ensure proper stacking for screen groups */
  g[id] {
    isolation: isolate;
  }
  
  .screen-group {
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: all;
  }
  
  .screen-group * {
    fill: #78350f;
    opacity: 0.5;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
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

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-gradient-to-b from-muted/50 to-background rounded-xl overflow-hidden border border-border/50 shadow-lg touch-manipulation"
    >
      {/* SVG overlay - interactive screens */}
      {svgContent && (
        <div 
          className="absolute inset-0 w-full h-full venue-screen-overlay"
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
      
      {/* Mobile-friendly header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-background/80 to-transparent px-3 py-2 sm:py-3 pointer-events-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-semibold text-foreground/80 tracking-wider uppercase">
              Interior Layout
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">
            SOLEIA
          </span>
        </div>
      </div>
      
      {/* Mobile-friendly legend */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent px-3 py-2 sm:py-3 pointer-events-none">
        <div className="flex items-center justify-between">
          <span className="text-[9px] sm:text-[10px] text-muted-foreground">
            {interactive ? 'Tap to select' : 'Screen Layout'}
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-sm bg-muted-foreground/40 border border-muted-foreground/60" />
              <span className="text-[8px] sm:text-[10px] text-muted-foreground">Off</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-sm bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
              <span className="text-[8px] sm:text-[10px] text-muted-foreground">On</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Selected count badge - mobile optimized */}
      {selectedPlacements.length > 0 && (
        <div className="absolute top-8 sm:top-10 right-2 sm:right-3 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-primary/90 rounded-full text-[10px] sm:text-xs font-semibold text-primary-foreground shadow-lg">
          {selectedPlacements.length} screen{selectedPlacements.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

// Export the list of all screen IDs for use elsewhere
export const ALL_SCREEN_IDS = SCREEN_SEGMENTS.map(s => s.id);

// Group screens by category for bulk selection
export const SCREEN_GROUPS = {
  solRays: ['Sol Rays'],
  radials: [] as string[], // No radials in current SVG
  curves: SCREEN_SEGMENTS.filter(s => s.id.includes('Curves')).map(s => s.id),
  imag: SCREEN_SEGMENTS.filter(s => s.id.includes('IMAG')).map(s => s.id),
  center: ['Center'],
  djBooth: ['DJ Booth'],
};

export default VenueScreenMap;
