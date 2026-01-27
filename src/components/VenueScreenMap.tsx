import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VenueScreenMapProps {
  selectedPlacements: string[];
  onToggle?: (placement: string) => void;
  interactive?: boolean;
}

// Screen segment IDs that map to the SVG group IDs
// The SVG uses these IDs for the groups containing each screen
const SCREEN_SEGMENTS = [
  // DJ Booth
  { id: 'DJ Booth', svgId: 'BOOTH', group: 'djBooth' },
  // Side curves
  { id: 'Curves SL', svgId: 'SL_CURVE', group: 'curves' },
  { id: 'Curves SR', svgId: 'SR_CURVE', group: 'curves' },
  // IMAG screens
  { id: 'IMAG SL', svgId: 'SL_IMAG.', group: 'imag' },
  { id: 'IMAG SR', svgId: 'R_IMAG', group: 'imag' },
  // Center screen
  { id: 'Center', svgId: 'CENTER', group: 'center' },
  // Radial ceiling screens (if present in SVG)
  { id: 'Radial 01', svgId: 'Radial_01', group: 'radials' },
  { id: 'Radial 02', svgId: 'Radial_02', group: 'radials' },
  { id: 'Radial 03', svgId: 'Radial_03', group: 'radials' },
  { id: 'Radial 04', svgId: 'Radial_04', group: 'radials' },
  { id: 'Radial 05', svgId: 'Radial_05', group: 'radials' },
  { id: 'Radial 06', svgId: 'Radial_06', group: 'radials' },
  { id: 'Radial 07', svgId: 'Radial_07', group: 'radials' },
  { id: 'Radial 08', svgId: 'Radial_08', group: 'radials' },
  { id: 'Radial 09', svgId: 'Radial_09', group: 'radials' },
  { id: 'Radial 10', svgId: 'Radial_10', group: 'radials' },
  { id: 'Radial 11', svgId: 'Radial_11', group: 'radials' },
  { id: 'Radial 12', svgId: 'Radial_12', group: 'radials' },
];

// Create a mapping from SVG ID to our ID
const svgIdToId = new Map(SCREEN_SEGMENTS.map(s => [s.svgId, s.id]));
const idToSvgId = new Map(SCREEN_SEGMENTS.map(s => [s.id, s.svgId]));

const VenueScreenMap: React.FC<VenueScreenMapProps> = ({
  selectedPlacements,
  onToggle,
  interactive = true
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);

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
            // Keep defs but modify the style
            const style = defs.querySelector('style');
            if (style) {
              style.textContent = `
                .screen-group {
                  cursor: pointer;
                  opacity: 0.7;
                  transition: opacity 0.2s ease, filter 0.2s ease;
                }
                .screen-group:hover {
                  opacity: 1;
                  filter: brightness(1.3);
                }
                .screen-group.selected {
                  opacity: 1;
                  filter: brightness(1.5) drop-shadow(0 0 8px rgba(234, 179, 8, 0.8));
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
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-border/50">
      {/* SVG overlay with embedded images - this IS the venue photo with overlays */}
      {svgContent && (
        <div 
          className="absolute inset-0 w-full h-full venue-screen-overlay"
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
      
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
