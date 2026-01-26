import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, RefreshCw, Sparkles, ChevronLeft, ChevronRight, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { artlistApi, artlistCategories, type ArtlistClip, type ArtlistCategoryKey } from '@/lib/api/artlist';
import { useToast } from '@/hooks/use-toast';
import ClipThumbnail from '@/components/ClipThumbnail';
import FloatingActionButton from '@/components/FloatingActionButton';
import SharedSelectionsSummary from '@/components/SharedSelectionsSummary';
import { ThemeToggle } from '@/components/ThemeToggle';
import soleiaLogo from '@/assets/soleia-logo-new.png';
import sunIcon from '@/assets/sun-icon.jpeg';
import { format } from 'date-fns';

interface ClientLink {
  id: string;
  token: string;
  client_name: string;
  event_name: string;
  event_date: string | null;
  is_active: boolean;
}

interface SharedSelection {
  id: string;
  link_id: string;
  clip_id: string;
  clip_title: string;
  clip_thumbnail: string | null;
  clip_category: string | null;
  note: string;
  placements: string[];
}

interface SharedGalleryViewProps {
  clientLink: ClientLink;
  selections: SharedSelection[];
  toggleSelection: (clip: ArtlistClip) => Promise<void>;
  updateNote: (clipId: string, note: string) => Promise<void>;
  updatePlacements: (clipId: string, placements: string[]) => Promise<void>;
  isSelected: (clipId: string) => boolean;
  getSelection: (clipId: string) => SharedSelection | undefined;
}

const categoryGradients: Record<string, string> = {
  'motion-backgrounds': 'from-amber-600/25 via-orange-500/20 to-amber-700/25',
  'abstract': 'from-yellow-600/25 via-amber-500/20 to-orange-600/25',
  'particles': 'from-orange-500/25 via-amber-400/20 to-yellow-600/25',
  'nature': 'from-amber-500/25 via-yellow-500/20 to-orange-500/25',
  'technology': 'from-yellow-500/25 via-orange-400/20 to-amber-600/25',
  'corporate': 'from-amber-700/25 via-yellow-600/20 to-orange-700/25',
  'events': 'from-orange-600/25 via-red-500/20 to-amber-600/25',
};

const SharedGalleryView: React.FC<SharedGalleryViewProps> = ({
  clientLink,
  selections,
  toggleSelection,
  updateNote,
  updatePlacements,
  isSelected,
  getSelection,
}) => {
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<ArtlistCategoryKey>('featured-collections');
  const [clips, setClips] = useState<ArtlistClip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [isFromCache, setIsFromCache] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('right');
  const [showSummary, setShowSummary] = useState(false);

  const currentCategoryIndex = artlistCategories.findIndex(c => c.key === selectedCategory);

  const navigateCategory = useCallback((direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev'
      ? Math.max(0, currentCategoryIndex - 1)
      : Math.min(artlistCategories.length - 1, currentCategoryIndex + 1);
    
    if (newIndex !== currentCategoryIndex) {
      setSwipeDirection(direction === 'prev' ? 'right' : 'left');
      setSelectedCategory(artlistCategories[newIndex].key);
      setSearchQuery('');
    }
  }, [currentCategoryIndex]);

  const fetchClips = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setImageErrors(new Set());
    
    try {
      if (!forceRefresh) {
        const cachedResult = await artlistApi.getCachedClips(selectedCategory);
        if (cachedResult.success && cachedResult.clips && cachedResult.clips.length > 0) {
          setClips(cachedResult.clips);
          setIsFromCache(true);
          setIsLoading(false);
          return;
        }
      }
      
      const result = await artlistApi.scrapeCategory(selectedCategory, forceRefresh);
      if (result.success && result.clips) {
        setClips(result.clips);
        setIsFromCache(result.cached || false);
      } else {
        setClips([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchClips(false);
  }, [fetchClips]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const result = await artlistApi.search(searchQuery);
      if (result.success && result.clips) {
        setClips(result.clips);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageError = (clipId: string) => {
    setImageErrors(prev => new Set(prev).add(clipId));
  };

  const handleClipClick = async (clip: ArtlistClip) => {
    await toggleSelection(clip);
    const wasSelected = isSelected(clip.id);
    toast({
      title: wasSelected ? "Removed from selection" : "Added to selection",
      description: clip.title,
    });
  };

  // Show summary page
  if (showSummary && selections.length > 0) {
    return (
      <SharedSelectionsSummary
        clientLink={clientLink}
        selections={selections}
        onBack={() => setShowSummary(false)}
        onClearSelections={() => {
          // We'd need to delete all selections
          setShowSummary(false);
        }}
        updateNote={updateNote}
        updatePlacements={updatePlacements}
      />
    );
  }

  return (
    <div className="min-h-screen touch-manipulation">
      {/* Elegant Event Header */}
      <header className="glass-strong relative z-30 border-b border-primary/10 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 left-1/4 w-96 h-96 bg-gradient-radial from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl animate-glow-pulse-slow" />
          <div className="absolute -top-10 right-1/4 w-80 h-80 bg-gradient-radial from-accent/15 via-accent/5 to-transparent rounded-full blur-3xl animate-glow-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent shimmer-slow" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Logo and Theme Toggle */}
          <div className="flex items-center justify-between mb-6">
            <img 
              src={soleiaLogo} 
              alt="Soleia" 
              className="h-12 md:h-16 object-contain"
            />
            <ThemeToggle />
          </div>

          {/* Event Info Card */}
          <div className="glass rounded-2xl p-6 border border-primary/20 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-light tracking-wide text-gradient-gold mb-1">
                  {clientLink.event_name}
                </h1>
                <p className="text-lg text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {clientLink.client_name}
                </p>
              </div>
              {clientLink.event_date && (
                <div className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">
                    {format(new Date(clientLink.event_date), 'MMMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
            
            {/* Live indicator */}
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Live session • Selections sync in real-time</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-11 bg-background/40 border-border/50 focus:border-primary/50 transition-elegant rounded-xl h-11 backdrop-blur-sm"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Category Navigation */}
        <nav className="relative mb-8 md:mb-10 hidden lg:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateCategory('prev')}
            disabled={currentCategoryIndex === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-primary/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div 
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-12 touch-pan-x"
          >
            {artlistCategories.map((cat, index) => (
              <motion.button
                key={cat.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedCategory(cat.key);
                  setSearchQuery('');
                }}
                className={`px-5 py-3 md:px-7 md:py-3.5 rounded-2xl font-medium whitespace-nowrap flex items-center gap-2 md:gap-2.5 transition-all touch-manipulation select-none ${
                  selectedCategory === cat.key
                    ? 'bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground shadow-lg'
                    : 'glass hover:bg-primary/10 hover:border-primary/30 text-foreground active:scale-95'
                }`}
              >
                <img 
                  src={sunIcon} 
                  alt="" 
                  className="w-5 h-5 object-contain" 
                />
                <span className="tracking-wide text-sm md:text-base">{cat.label}</span>
              </motion.button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateCategory('next')}
            disabled={currentCategoryIndex === artlistCategories.length - 1}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-primary/10"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </nav>

        {/* Mobile Category Indicator */}
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
            <p className="text-lg font-medium text-foreground">
              {artlistCategories[currentCategoryIndex]?.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentCategoryIndex + 1} of {artlistCategories.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateCategory('next')}
            disabled={currentCategoryIndex === artlistCategories.length - 1}
            className="w-12 h-12 rounded-full touch-manipulation active:scale-90"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Refresh Button and Stats */}
        <div className="mb-6 md:mb-8 flex flex-wrap items-center gap-3 md:gap-4">
          <Button
            onClick={() => fetchClips(true)}
            disabled={isLoading}
            variant="outline"
            className="gap-2 rounded-xl border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-elegant h-12 px-4 touch-manipulation active:scale-95"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {clips.length > 0 && (
            <span className="text-muted-foreground text-sm tracking-wide">
              {clips.length} clips {isFromCache && '• cached'}
            </span>
          )}
        </div>

        {/* Clips Grid */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(event, info) => {
            const threshold = 100;
            if (info.offset.x > threshold && currentCategoryIndex > 0) {
              navigateCategory('prev');
            } else if (info.offset.x < -threshold && currentCategoryIndex < artlistCategories.length - 1) {
              navigateCategory('next');
            }
          }}
          className="touch-pan-y"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative">
                <Loader2 className="w-14 h-14 animate-spin text-primary" />
                <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
              </div>
              <p className="text-foreground font-medium mt-6 tracking-wide">Curating collection...</p>
            </div>
          ) : clips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="p-6 rounded-3xl bg-primary/10 glow-gold mb-6">
                <Sparkles className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">No clips found</h3>
              <p className="text-muted-foreground mb-6">Try a different category or search term</p>
              <Button onClick={() => fetchClips(false)} className="rounded-xl glow-gold transition-elegant">Refresh Collection</Button>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div 
                key={selectedCategory}
                initial={{ opacity: 0, x: swipeDirection === 'left' ? 100 : -100, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: swipeDirection === 'left' ? -100 : 100, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-36"
              >
                {clips.map((clip, index) => {
                  const selected = isSelected(clip.id);
                  const selection = getSelection(clip.id);
                  const hasNote = !!selection?.note;
                  const hasImageError = imageErrors.has(clip.id);

                  return (
                    <motion.div
                      key={clip.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      whileTap={{ scale: 0.98 }}
                      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-elegant touch-manipulation ${
                        selected 
                          ? 'ring-2 ring-primary ring-offset-4 ring-offset-background scale-[1.02] glow-gold' 
                          : 'hover-lift hover:ring-1 hover:ring-primary/30 active:scale-[0.98]'
                      }`}
                      onClick={() => handleClipClick(clip)}
                    >
                      <ClipThumbnail
                        clip={clip}
                        isSelected={selected}
                        hasNote={hasNote}
                        hasImageError={hasImageError}
                        onImageError={handleImageError}
                        onPlayClick={(e) => e.stopPropagation()}
                        categoryGradient={categoryGradients[selectedCategory] || categoryGradients['abstract']}
                      />
                      <div className="relative p-3 md:p-3 glass border-t border-primary/10">
                        <h3 className="font-semibold text-foreground truncate tracking-tight text-sm md:text-sm">{clip.title}</h3>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Swipe hint for mobile */}
        <div className="flex justify-center mt-4 lg:hidden">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground flex items-center gap-2"
          >
            <motion.span animate={{ x: [-2, 2, -2] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronLeft className="w-3 h-3" />
            </motion.span>
            Swipe to change category
            <motion.span animate={{ x: [2, -2, 2] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronRight className="w-3 h-3" />
            </motion.span>
          </motion.p>
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton 
        count={selections.length} 
        onClick={() => setShowSummary(true)} 
      />

      {/* Selection Bar */}
      {selections.length > 0 && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 glass-strong border-t border-primary/20 z-40 safe-area-bottom"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 md:gap-5">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary/25 to-accent/20 flex items-center justify-center glow-gold border border-primary/30">
                  <span className="text-xl md:text-2xl font-bold text-gradient-gold">{selections.length}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="font-semibold text-foreground tracking-tight">Clips Selected</p>
                  <p className="text-sm text-muted-foreground">
                    {selections.filter(s => s.note).length} with notes
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowSummary(true)}
                className="gap-2 glow-gold rounded-xl h-12 px-6 transition-elegant touch-manipulation active:scale-95"
              >
                Review & Submit
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SharedGalleryView;
