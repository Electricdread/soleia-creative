import React, { useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { artlistCategories, type ArtlistCategoryKey } from '@/lib/api/artlist';

interface SwipeableCategoryNavProps {
  selectedCategory: ArtlistCategoryKey;
  onCategoryChange: (category: ArtlistCategoryKey) => void;
}

export function SwipeableCategoryNav({
  selectedCategory,
  onCategoryChange,
}: SwipeableCategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentIndex = artlistCategories.findIndex((c) => c.key === selectedCategory);

  const navigateCategory = (direction: 'prev' | 'next') => {
    const newIndex =
      direction === 'prev'
        ? Math.max(0, currentIndex - 1)
        : Math.min(artlistCategories.length - 1, currentIndex + 1);
    onCategoryChange(artlistCategories[newIndex].key);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && currentIndex > 0) {
      navigateCategory('prev');
    } else if (info.offset.x < -threshold && currentIndex < artlistCategories.length - 1) {
      navigateCategory('next');
    }
  };

  return (
    <div className="relative">
      {/* Navigation arrows for tablet/desktop */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigateCategory('prev')}
        disabled={currentIndex === 0}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <motion.div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-2 md:px-12 touch-pan-x"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="popLayout">
          {artlistCategories.map((cat, index) => (
            <motion.button
              key={cat.key}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange(cat.key)}
              className={`px-5 py-3 md:px-7 md:py-3.5 rounded-2xl font-medium whitespace-nowrap flex items-center gap-2 md:gap-2.5 transition-all touch-manipulation select-none ${
                selectedCategory === cat.key
                  ? 'bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground shadow-lg scale-105'
                  : 'glass hover:bg-primary/10 hover:border-primary/30 text-foreground active:scale-95'
              }`}
            >
              <span className="tracking-wide text-sm md:text-base">{cat.label}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigateCategory('next')}
        disabled={currentIndex === artlistCategories.length - 1}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>

      {/* Swipe indicator for mobile */}
      <div className="flex justify-center gap-1.5 mt-3 md:hidden">
        {artlistCategories.map((cat, index) => (
          <div
            key={cat.key}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex
                ? 'w-6 bg-primary'
                : 'w-1.5 bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
