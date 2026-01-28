import React from 'react';
import { VideoCarousel, VideoItem } from './VideoCarousel';

const TV_VIDEOS: VideoItem[] = [
  {
    name: 'TV Cabanas Preview',
    path: 'venue-visualization/Soleia%20Pixelmap%203D%20TV%20Cabanas%20Preview.webm',
  },
  {
    name: 'TV Display Preview',
    path: 'venue-visualization/S-blox-Soleia_TV.webm',
  },
];

interface TVVideoCarouselProps {
  className?: string;
}

export function TVVideoCarousel({ className }: TVVideoCarouselProps) {
  return (
    <VideoCarousel 
      videos={TV_VIDEOS} 
      className={className}
    />
  );
}

export default TVVideoCarousel;
