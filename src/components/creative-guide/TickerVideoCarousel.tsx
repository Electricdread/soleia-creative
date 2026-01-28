import React from 'react';
import { VideoCarousel, VideoItem } from './VideoCarousel';

const TICKER_VIDEOS: VideoItem[] = [
  {
    name: 'Ticker Preview',
    path: 'marquee-ticker-media/Ticker Preview.mp4',
  },
  {
    name: 'Ticker Soleia',
    path: 'marquee-ticker-media/Ticker_Soleia.mp4',
  },
  {
    name: 'Render This Ticker',
    path: 'marquee-ticker-media/RENDER THIS (TICKER).mp4',
  },
];

interface TickerVideoCarouselProps {
  className?: string;
}

export function TickerVideoCarousel({ className }: TickerVideoCarouselProps) {
  return (
    <VideoCarousel 
      videos={TICKER_VIDEOS} 
      className={className}
    />
  );
}

export default TickerVideoCarousel;
