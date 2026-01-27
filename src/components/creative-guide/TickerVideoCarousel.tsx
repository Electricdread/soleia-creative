import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Videos in specified order: Ticker Preview, Ticker_Soleia, RENDER THIS TICKER
const TICKER_VIDEOS = [
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

function getStorageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/clips/${path}`;
}

interface TickerVideoCarouselProps {
  className?: string;
}

export function TickerVideoCarousel({ className }: TickerVideoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % TICKER_VIDEOS.length);
  }, []);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + TICKER_VIDEOS.length) % TICKER_VIDEOS.length);
  }, []);

  // Swipe navigation
  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
    threshold: 50,
  });

  // Ensure current video plays and others pause
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.play().catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentIndex]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.9,
    }),
  };

  return (
    <div 
      className={`relative w-full aspect-video overflow-hidden ${className}`}
      {...swipeHandlers}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
            scale: { duration: 0.2 },
          }}
          className="absolute inset-0"
        >
          <video
            ref={(el) => { videoRefs.current[currentIndex] = el; }}
            src={getStorageUrl(TICKER_VIDEOS[currentIndex].path)}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            autoPlay
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/70 backdrop-blur-sm hover:bg-background/90 border border-primary/30 shadow-lg h-8 w-8"
      >
        <ChevronLeft className="w-4 h-4 text-primary" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/70 backdrop-blur-sm hover:bg-background/90 border border-primary/30 shadow-lg h-8 w-8"
      >
        <ChevronRight className="w-4 h-4 text-primary" />
      </Button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
        {TICKER_VIDEOS.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-primary w-4' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to video ${index + 1}`}
          />
        ))}
      </div>

      {/* Video title overlay */}
      <div className="absolute top-3 left-3 z-10">
        <span className="px-2 py-1 text-xs font-medium bg-background/70 backdrop-blur-sm rounded border border-primary/30 text-foreground">
          {TICKER_VIDEOS[currentIndex].name}
        </span>
      </div>
    </div>
  );
}

export default TickerVideoCarousel;
