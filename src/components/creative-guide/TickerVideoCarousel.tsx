import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize, X, Play, Pause, Volume2, VolumeX } from 'lucide-react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

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

  // Modal swipe navigation
  const modalSwipeHandlers = useSwipeNavigation({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
    threshold: 50,
  });

  // Ensure current video plays and others pause
  useEffect(() => {
    if (!isModalOpen) {
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
    }
  }, [currentIndex, isModalOpen]);

  // Handle modal video sync
  useEffect(() => {
    if (isModalOpen && modalVideoRef.current) {
      modalVideoRef.current.currentTime = 0;
      if (isPlaying) {
        modalVideoRef.current.play().catch(() => {});
      }
    }
  }, [isModalOpen, currentIndex]);

  const openModal = () => {
    // Pause inline video
    videoRefs.current.forEach((video) => {
      if (video) video.pause();
    });
    setIsModalOpen(true);
    setIsPlaying(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Resume inline video
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    if (modalVideoRef.current) {
      if (isPlaying) {
        modalVideoRef.current.pause();
      } else {
        modalVideoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.muted = !modalVideoRef.current.muted;
      setIsMuted(modalVideoRef.current.muted);
    }
  };

  const handleTimeUpdate = () => {
    if (modalVideoRef.current) {
      const prog = (modalVideoRef.current.currentTime / modalVideoRef.current.duration) * 100;
      setProgress(prog);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && modalVideoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      modalVideoRef.current.currentTime = percentage * modalVideoRef.current.duration;
    }
  };

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
    <>
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
            className="absolute inset-0 cursor-pointer"
            onClick={openModal}
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
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/70 backdrop-blur-sm hover:bg-background/90 border border-primary/30 shadow-lg h-8 w-8"
        >
          <ChevronLeft className="w-4 h-4 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/70 backdrop-blur-sm hover:bg-background/90 border border-primary/30 shadow-lg h-8 w-8"
        >
          <ChevronRight className="w-4 h-4 text-primary" />
        </Button>

        {/* Fullscreen button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); openModal(); }}
          className="absolute bottom-3 right-3 z-10 bg-background/70 backdrop-blur-sm hover:bg-background/90 border border-primary/30 shadow-lg h-7 w-7"
        >
          <Maximize className="w-3.5 h-3.5 text-primary" />
        </Button>

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {TICKER_VIDEOS.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
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

      {/* Fullscreen Video Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-5xl mx-4"
              onClick={(e) => e.stopPropagation()}
              {...modalSwipeHandlers}
            >
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={closeModal}
                className="absolute -top-12 right-0 z-10 text-white hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </Button>

              {/* Video title */}
              <div className="absolute -top-12 left-0 z-10">
                <span className="text-white font-medium">
                  {TICKER_VIDEOS[currentIndex].name}
                </span>
                <span className="text-white/50 ml-2 text-sm">
                  {currentIndex + 1} / {TICKER_VIDEOS.length}
                </span>
              </div>

              {/* Video container */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={modalVideoRef}
                  src={getStorageUrl(TICKER_VIDEOS[currentIndex].path)}
                  className="w-full h-full object-contain"
                  loop
                  muted={isMuted}
                  playsInline
                  autoPlay
                  onTimeUpdate={handleTimeUpdate}
                />

                {/* Navigation arrows in modal */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white h-12 w-12"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white h-12 w-12"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>

              {/* Controls */}
              <div className="mt-4 flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/10"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/10"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>

                {/* Progress bar */}
                <div
                  ref={progressRef}
                  className="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Dot indicators in modal */}
                <div className="flex items-center gap-2">
                  {TICKER_VIDEOS.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setDirection(index > currentIndex ? 1 : -1);
                        setCurrentIndex(index);
                      }}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        index === currentIndex 
                          ? 'bg-primary w-5' 
                          : 'bg-white/30 hover:bg-white/60'
                      }`}
                      aria-label={`Go to video ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default TickerVideoCarousel;
