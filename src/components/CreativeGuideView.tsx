import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Monitor, 
  ArrowLeft,
  Building2,
  FileText,
  Palette,
  BookOpen,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { DisplaySpecsView } from '@/components/creative-guide/DisplaySpecsView';
import { VenueOverviewView } from '@/components/creative-guide/VenueOverviewView';
import { IntroductionView } from '@/components/creative-guide/IntroductionView';

import { creativeGuideCategories, type CreativeGuideCategoryKey } from '@/lib/creativeGuide';
import soleiaLogo from '@/assets/soleia-logo-new.png';
import { PoweredByShowBlox } from '@/components/PoweredByShowBlox';

const CreativeGuideView = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const initialCategory = (() => {
    if (typeof window === 'undefined') return 'introduction' as CreativeGuideCategoryKey;
    const hash = window.location.hash.replace('#', '');
    const match = creativeGuideCategories.find(c => c.key === hash);
    return (match?.key ?? 'introduction') as CreativeGuideCategoryKey;
  })();
  const [selectedCategory, setSelectedCategory] = useState<CreativeGuideCategoryKey>(initialCategory);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const match = creativeGuideCategories.find(c => c.key === hash);
      if (match) setSelectedCategory(match.key as CreativeGuideCategoryKey);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('right');

  const currentCategoryIndex = creativeGuideCategories.findIndex(c => c.key === selectedCategory);

  const navigateCategory = useCallback((direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev'
      ? Math.max(0, currentCategoryIndex - 1)
      : Math.min(creativeGuideCategories.length - 1, currentCategoryIndex + 1);
    
    if (newIndex !== currentCategoryIndex) {
      setSwipeDirection(direction === 'prev' ? 'right' : 'left');
      setSelectedCategory(creativeGuideCategories[newIndex].key);
    }
  }, [currentCategoryIndex]);

  // Swipe gestures for section navigation
  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: () => navigateCategory('next'),
    onSwipeRight: () => navigateCategory('prev'),
    threshold: 50,
  });

  const categoryIcons: Record<string, React.ReactNode> = {
    'introduction': <BookOpen className="w-5 h-5" />,
    'venue-overview': <Building2 className="w-5 h-5" />,
    'display-specs': <FileText className="w-5 h-5" />,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Spacer for layout balance */}
            <div className="w-10" />

            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src={soleiaLogo} 
                alt="Soleia" 
                className="h-8 sm:h-10 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-display font-semibold text-gradient-gold">Creative Guide</h1>
                <p className="text-xs text-muted-foreground">Digital Branding Specifications</p>
              </div>
            </div>

            {/* Right side: Print button and theme toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/creative-guide/print')}
                className="gap-2 hidden sm:flex"
              >
                <Printer className="w-4 h-4" />
                <span>Print Guide</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/creative-guide/print')}
                className="sm:hidden"
              >
                <Printer className="w-4 h-4" />
              </Button>
              <PoweredByShowBlox variant="header" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Category Navigation - Desktop */}
        <nav className="relative mb-8 hidden lg:block">
          <div 
            ref={scrollContainerRef}
            className="flex gap-3 justify-center flex-wrap"
          >
            {creativeGuideCategories.map((cat, index) => (
              <motion.button
                key={cat.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-5 py-3 rounded-2xl font-medium whitespace-nowrap flex items-center gap-2.5 transition-all touch-manipulation select-none ${
                  selectedCategory === cat.key
                    ? 'bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground shadow-lg'
                    : 'glass hover:bg-primary/10 hover:border-primary/30 text-foreground active:scale-95'
                }`}
              >
                {categoryIcons[cat.key]}
                <div className="text-left">
                  <span className="block text-sm font-semibold">{cat.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </nav>

        {/* Category Navigation - Mobile */}
        <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateCategory('prev')}
            disabled={currentCategoryIndex === 0}
            className="w-12 h-12 rounded-full touch-manipulation active:scale-90"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              {categoryIcons[selectedCategory]}
              <p className="text-lg font-medium text-foreground">
                {creativeGuideCategories[currentCategoryIndex]?.label}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {creativeGuideCategories[currentCategoryIndex]?.description}
            </p>
            {/* Mobile dot indicators */}
            <div className="flex justify-center gap-1.5 mt-2">
              {creativeGuideCategories.map((cat, index) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentCategoryIndex
                      ? 'w-6 bg-primary'
                      : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateCategory('next')}
            disabled={currentCategoryIndex === creativeGuideCategories.length - 1}
            className="w-12 h-12 rounded-full touch-manipulation active:scale-90"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Content with swipe gestures */}
        <div {...swipeHandlers} className="touch-pan-y">
          <AnimatePresence mode="wait">
            {selectedCategory === 'introduction' && (
              <motion.div
                key="introduction"
                initial={{ opacity: 0, x: swipeDirection === 'left' ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: swipeDirection === 'left' ? -50 : 50 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <IntroductionView onNavigate={(category) => setSelectedCategory(category as CreativeGuideCategoryKey)} />
              </motion.div>
            )}

            {selectedCategory === 'venue-overview' && (
              <motion.div
                key="venue-overview"
                initial={{ opacity: 0, x: swipeDirection === 'left' ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: swipeDirection === 'left' ? -50 : 50 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <VenueOverviewView />
              </motion.div>
            )}

            {selectedCategory === 'display-specs' && (
              <motion.div
                key="display-specs"
                initial={{ opacity: 0, x: swipeDirection === 'left' ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: swipeDirection === 'left' ? -50 : 50 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <DisplaySpecsView />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
      
      {/* Footer */}
      <PoweredByShowBlox className="border-t border-border/30 mt-8" />
    </div>
  );
};

export default CreativeGuideView;
