import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

const LED_MAPPING_IMAGES = [
  { 
    name: 'Interior Mapping', 
    path: '/creative-guide/led-interior-mapping.png',
    description: 'Indoor LED screens with Sol Rays, IMAG, and Curves'
  },
  { 
    name: 'Outdoor View', 
    path: '/creative-guide/led-outdoor-mapping.png',
    description: 'Outdoor SR & SL screens with interior view'
  },
  { 
    name: 'Outdoor Arch', 
    path: '/creative-guide/led-outdoor-arch-mapping.png',
    description: 'Outdoor Arch and arrival screens'
  },
];

export function LEDPixelMapCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % LED_MAPPING_IMAGES.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + LED_MAPPING_IMAGES.length) % LED_MAPPING_IMAGES.length);
  }, []);

  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
    threshold: 50,
  });

  const currentImage = LED_MAPPING_IMAGES[currentIndex];

  return (
    <div className="relative w-full h-full" {...swipeHandlers}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={currentImage.path}
            alt={currentImage.name}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all z-10"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all z-10"
        aria-label="Next image"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Image Caption */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white text-xs font-medium">{currentImage.name}</p>
        <p className="text-white/60 text-[10px]">{currentImage.description}</p>
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {LED_MAPPING_IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex 
                ? 'bg-primary w-4' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to image ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default LEDPixelMapCarousel;
