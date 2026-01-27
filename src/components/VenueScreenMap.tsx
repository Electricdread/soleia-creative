import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VenueScreenMapProps {
  selectedPlacements: string[];
  onToggle?: (placement: string) => void;
  interactive?: boolean;
}

// Screen segment IDs that can be selected - matches the SVG element IDs
const SCREEN_SEGMENTS = [
  // Radial ceiling screens
  { id: 'Radial 01', group: 'radials' },
  { id: 'Radial 02', group: 'radials' },
  { id: 'Radial 03', group: 'radials' },
  { id: 'Radial 04', group: 'radials' },
  { id: 'Radial 05', group: 'radials' },
  { id: 'Radial 06', group: 'radials' },
  { id: 'Radial 07', group: 'radials' },
  { id: 'Radial 08', group: 'radials' },
  { id: 'Radial 09', group: 'radials' },
  { id: 'Radial 10', group: 'radials' },
  { id: 'Radial 11', group: 'radials' },
  { id: 'Radial 12', group: 'radials' },
  // Side curves
  { id: 'Curves SR', group: 'curves' },
  { id: 'Curves SL', group: 'curves' },
  // IMAG screens
  { id: 'IMAG SR', group: 'imag' },
  { id: 'IMAG SL', group: 'imag' },
  // Center and DJ
  { id: 'Center', group: 'center' },
  { id: 'DJ Booth', group: 'djBooth' },
];

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
        // Parse and modify the SVG to make it interactive
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        const svgEl = doc.querySelector('svg');
        
        if (svgEl) {
          // Remove display:none from styles
          const style = svgEl.querySelector('style');
          if (style) {
            style.textContent = style.textContent?.replace('display: none;', '') || '';
          }
          
          // Add class to all path/polygon/rect elements for styling
          const shapes = svgEl.querySelectorAll('path, polygon, rect, ellipse, circle');
          shapes.forEach(shape => {
            shape.classList.add('screen-segment');
          });
          
          setSvgContent(svgEl.outerHTML);
        }
      })
      .catch(err => console.error('Failed to load SVG overlay:', err));
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onToggle) return;
    
    const target = e.target as SVGElement;
    const id = target.id || target.closest('[id]')?.id;
    
    if (id && SCREEN_SEGMENTS.some(s => s.id === id)) {
      onToggle(id);
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-border/50">
      {/* Background venue image */}
      <img 
        src="/venue-screens.png" 
        alt="Venue layout"
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      />
      
      {/* SVG overlay - loaded from file */}
      <div 
        className="absolute inset-0 w-full h-full venue-screen-overlay"
        onClick={handleClick}
        dangerouslySetInnerHTML={svgContent ? { __html: svgContent } : undefined}
        style={{
          '--selected-screens': selectedPlacements.map(p => `#${p.replace(/\s/g, '_')}`).join(',')
        } as React.CSSProperties}
      />
      
      {/* Custom overlay for selection state - since we can't easily modify inline SVG */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none" 
        viewBox="0 0 1920 1080" 
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Selection indicators will be rendered here based on selectedPlacements */}
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
