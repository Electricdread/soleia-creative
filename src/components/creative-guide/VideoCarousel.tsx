import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface VideoItem {
  name: string;
  path: string;
}

interface VideoCarouselProps {
  videos: VideoItem[];
  className?: string;
  /** Whether videos are stored in Supabase storage (default: true) */
  useSupabaseStorage?: boolean;
  /** Custom base URL for videos (overrides Supabase storage) */
  baseUrl?: string;
}

function getStorageUrl(path: string, useSupabase: boolean, baseUrl?: string): string {
  if (baseUrl) {
    return `${baseUrl}${path}`;
  }
  if (useSupabase) {
    return `${SUPABASE_URL}/storage/v1/object/public/clips/${path}`;
  }
  return path;
}

export function VideoCarousel({ 
  videos, 
  className, 
  useSupabaseStorage = true,
  baseUrl 
}: VideoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  }, []);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  }, [videos.length]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  }, [videos.length]);

  // Swipe navigation
  const swipeHandlers = useSwipeNavigation({
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

  // Handle modal video - auto-play when opened
  useEffect(() => {
    if (isModalOpen && modalVideoRef.current) {
      modalVideoRef.current.muted = isMuted;
      modalVideoRef.current.currentTime = 0;
      modalVideoRef.current.play().catch(() => {});
      resetControlsTimeout();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isModalOpen, currentIndex, isMuted, resetControlsTimeout]);

  // Tap on inline video opens fullscreen
  const openModal = () => {
    videoRefs.current.forEach((video) => {
      if (video) video.pause();
    });
    setIsModalOpen(true);
  };

  // Tap anywhere in fullscreen closes it
  const closeModal = () => {
    setIsModalOpen(false);
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.play().catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (modalVideoRef.current) {
      modalVideoRef.current.muted = !modalVideoRef.current.muted;
      setIsMuted(modalVideoRef.current.muted);
    }
    resetControlsTimeout();
  };

  const handleModalNavPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToPrev();
  };

  const handleModalNavNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToNext();
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

  const currentVideo = videos[currentIndex];
  const videoSrc = getStorageUrl(currentVideo.path, useSupabaseStorage, baseUrl);

  // Don't render navigation if only one video
  const showNavigation = videos.length > 1;

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
            className="absolute inset-0 cursor-pointer group"
            onClick={openModal}
          >
            <video
              ref={(el) => { videoRefs.current[currentIndex] = el; }}
              src={videoSrc}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loop
              muted
              playsInline
              autoPlay
            />
            {/* Tap indicator */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="text-white/0 group-hover:text-white/80 text-sm font-medium transition-colors">
                Tap for fullscreen
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {showNavigation && (
          <>
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
          </>
        )}

        {/* Dot indicators */}
        {showNavigation && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {videos.map((_, index) => (
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
        )}

        {/* Video title overlay */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2 py-1 text-xs font-medium bg-background/70 backdrop-blur-sm rounded border border-primary/30 text-foreground">
            {currentVideo.name}
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
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center cursor-pointer"
            onClick={closeModal}
            onMouseMove={resetControlsTimeout}
            onTouchStart={resetControlsTimeout}
          >
            {/* Title overlay */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
              className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"
            >
              <div className="flex items-center justify-between max-w-5xl mx-auto">
                <div>
                  <span className="text-white font-medium">
                    {currentVideo.name}
                  </span>
                  {showNavigation && (
                    <span className="text-white/50 ml-2 text-sm">
                      {currentIndex + 1} / {videos.length}
                    </span>
                  )}
                </div>
                <span className="text-white/50 text-xs">Tap anywhere to close</span>
              </div>
            </motion.div>

            {/* Video */}
            <video
              ref={modalVideoRef}
              src={videoSrc}
              className="w-full h-full object-contain"
              loop
              muted={isMuted}
              playsInline
              autoPlay
            />

            {/* Navigation arrows in modal */}
            {showNavigation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showControls ? 1 : 0 }}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none z-20"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleModalNavPrev}
                  className="bg-black/50 hover:bg-black/70 text-white h-12 w-12 pointer-events-auto"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleModalNavNext}
                  className="bg-black/50 hover:bg-black/70 text-white h-12 w-12 pointer-events-auto"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </motion.div>
            )}

            {/* Mute button & dot indicators - bottom */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
              className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-4 pointer-events-none"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 rounded-full w-12 h-12 pointer-events-auto"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </Button>
              
              {/* Dot indicators in modal */}
              {showNavigation && (
                <div className="flex items-center gap-2 pointer-events-auto">
                  {videos.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
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
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default VideoCarousel;
