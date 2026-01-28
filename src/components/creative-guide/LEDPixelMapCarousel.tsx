import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { usePinchZoom } from '@/hooks/usePinchZoom';
import { Button } from '@/components/ui/button';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [showZoomHint, setShowZoomHint] = useState(true);

  const { transform, isZoomed, handlers: zoomHandlers, resetZoom } = usePinchZoom({
    minScale: 1,
    maxScale: 5,
  });

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % LED_MAPPING_IMAGES.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + LED_MAPPING_IMAGES.length) % LED_MAPPING_IMAGES.length);
  }, []);

  const modalGoToNext = useCallback(() => {
    if (!isZoomed) {
      setModalIndex((prev) => (prev + 1) % LED_MAPPING_IMAGES.length);
      resetZoom();
    }
  }, [isZoomed, resetZoom]);

  const modalGoToPrev = useCallback(() => {
    if (!isZoomed) {
      setModalIndex((prev) => (prev - 1 + LED_MAPPING_IMAGES.length) % LED_MAPPING_IMAGES.length);
      resetZoom();
    }
  }, [isZoomed, resetZoom]);

  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
    threshold: 50,
  });

  // Only use swipe for navigation when not zoomed
  const modalSwipeHandlers = useSwipeNavigation({
    onSwipeLeft: isZoomed ? undefined : modalGoToNext,
    onSwipeRight: isZoomed ? undefined : modalGoToPrev,
    threshold: 50,
  });

  const openModal = () => {
    setModalIndex(currentIndex);
    setIsModalOpen(true);
    resetZoom();
    setShowZoomHint(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetZoom();
  };

  // Hide zoom hint after 3 seconds
  useEffect(() => {
    if (isModalOpen && showZoomHint) {
      const timer = setTimeout(() => setShowZoomHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen, showZoomHint]);

  // Reset zoom when changing images
  useEffect(() => {
    resetZoom();
  }, [modalIndex, resetZoom]);

  const currentImage = LED_MAPPING_IMAGES[currentIndex];
  const modalImage = LED_MAPPING_IMAGES[modalIndex];

  return (
    <>
      <div className="relative w-full h-full" {...swipeHandlers}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 cursor-pointer"
            onClick={openModal}
          >
            <img
              src={currentImage.path}
              alt={currentImage.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Maximize Button */}
        <button
          onClick={openModal}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all z-10"
          aria-label="View fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Navigation Arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all z-10"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all z-10"
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Image Caption */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
          <p className="text-white text-xs font-medium">{currentImage.name}</p>
          <p className="text-white/60 text-[10px]">{currentImage.description}</p>
        </div>

        {/* Dot Indicators */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {LED_MAPPING_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
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

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onClick={isZoomed ? undefined : closeModal}
          >
            {/* Top Controls */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1">
                <span className="text-white/60 text-xs font-mono min-w-[3rem] text-center">
                  {Math.round(transform.scale * 100)}%
                </span>
                {isZoomed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); resetZoom(); }}
                    className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeModal}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Zoom Hint */}
            <AnimatePresence>
              {showZoomHint && !isZoomed && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>Pinch to zoom • Scroll to zoom</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image Container with Pinch-to-Zoom */}
            <div 
              className="flex-1 flex items-center justify-center p-4 overflow-hidden touch-none"
              onClick={(e) => e.stopPropagation()}
              {...zoomHandlers}
              {...(isZoomed ? {} : modalSwipeHandlers)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={modalIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                  style={{
                    transform: `scale(${transform.scale}) translate(${transform.x / transform.scale}px, ${transform.y / transform.scale}px)`,
                    transition: isZoomed ? 'none' : 'transform 0.2s ease-out',
                  }}
                >
                  <img
                    src={modalImage.path}
                    alt={modalImage.name}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg select-none"
                    draggable={false}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Modal Navigation Arrows - Hidden when zoomed */}
            {!isZoomed && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); modalGoToPrev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); modalGoToNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Modal Caption & Dots - Hidden when zoomed */}
            {!isZoomed && (
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="text-center mb-4">
                  <p className="text-white text-lg font-medium">{modalImage.name}</p>
                  <p className="text-white/60 text-sm">{modalImage.description}</p>
                </div>
                
                {/* Modal Dot Indicators */}
                <div className="flex justify-center gap-2">
                  {LED_MAPPING_IMAGES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setModalIndex(idx); }}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        idx === modalIndex 
                          ? 'bg-primary w-6' 
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default LEDPixelMapCarousel;
