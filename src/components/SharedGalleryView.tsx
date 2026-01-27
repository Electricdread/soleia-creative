import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, RefreshCw, Sparkles, ChevronLeft, ChevronRight, Calendar, Users, Play, X, MessageSquare, MapPin, ChevronDown, ChevronUp, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { artlistApi, artlistCategories, type ArtlistClip, type ArtlistCategoryKey } from '@/lib/api/artlist';
import { useToast } from '@/hooks/use-toast';
import ClipThumbnail from '@/components/ClipThumbnail';
import FloatingActionButton from '@/components/FloatingActionButton';
import SharedSelectionsSummary from '@/components/SharedSelectionsSummary';
import VenueScreenMap, { SCREEN_GROUPS } from '@/components/VenueScreenMap';
import OutdoorPlacementDiagram from '@/components/OutdoorPlacementDiagram';
import PlacementBadges from '@/components/PlacementBadges';
import { ThemeToggle } from '@/components/ThemeToggle';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import sunIcon from '@/assets/sun-icon.jpeg';
import { format } from 'date-fns';
// Must match IDs from VenueScreenMap SCREEN_SEGMENTS
const INTERIOR_PLACEMENTS = [
  'Sol Rays',
  'Curves SR',
  'Curves SL',
  'IMAG SR',
  'IMAG SL',
  'Center',
  'DJ Booth'
] as const;

const OUTDOOR_PLACEMENTS = [
  'Outdoor SR',
  'Outdoor Arch',
  'Outdoor SL'
] as const;

const ALL_INTERIOR_SCREENS = [...INTERIOR_PLACEMENTS];
const ALL_OUTDOOR_SCREENS = [...OUTDOOR_PLACEMENTS];

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
  
  // Clip detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailClip, setDetailClip] = useState<ArtlistClip | null>(null);
  const [detailNote, setDetailNote] = useState('');
  const [detailPlacements, setDetailPlacements] = useState<string[]>([]);
  const [isPlacementOpen, setIsPlacementOpen] = useState(false);
  const [isSavingDetail, setIsSavingDetail] = useState(false);

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

  // Open clip detail modal
  const openClipDetail = (clip: ArtlistClip, e: React.MouseEvent) => {
    e.stopPropagation();
    const selection = getSelection(clip.id);
    setDetailClip(clip);
    setDetailNote(selection?.note || '');
    setDetailPlacements(selection?.placements || []);
    setShowDetailModal(true);
  };

  // Toggle placement in detail modal
  const toggleDetailPlacement = (placement: string) => {
    if (placement === 'Full Interior') {
      const allInteriorSelected = ALL_INTERIOR_SCREENS.every(s => detailPlacements.includes(s));
      if (allInteriorSelected) {
        setDetailPlacements(prev => prev.filter(p => !ALL_INTERIOR_SCREENS.includes(p as any)));
      } else {
        setDetailPlacements(prev => [...new Set([...prev, ...ALL_INTERIOR_SCREENS])]);
      }
    } else if (placement === 'Full Outdoor') {
      const allOutdoorSelected = ALL_OUTDOOR_SCREENS.every(s => detailPlacements.includes(s));
      if (allOutdoorSelected) {
        setDetailPlacements(prev => prev.filter(p => !ALL_OUTDOOR_SCREENS.includes(p as any)));
      } else {
        setDetailPlacements(prev => [...new Set([...prev, ...ALL_OUTDOOR_SCREENS])]);
      }
    } else {
      setDetailPlacements(prev => 
        prev.includes(placement) 
          ? prev.filter(p => p !== placement)
          : [...prev, placement]
      );
    }
  };

  // Save clip detail changes
  const saveClipDetail = async () => {
    if (!detailClip) return;
    
    setIsSavingDetail(true);
    try {
      // Make sure the clip is selected first
      if (!isSelected(detailClip.id)) {
        await toggleSelection(detailClip);
      }
      
      // Update note and placements
      await updateNote(detailClip.id, detailNote);
      await updatePlacements(detailClip.id, detailPlacements);
      
      setShowDetailModal(false);
      setDetailClip(null);
      
      toast({
        title: "Selection updated",
        description: "Note and placements have been saved",
      });
    } catch (error) {
      console.error('Error saving detail:', error);
      toast({
        title: "Error saving",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSavingDetail(false);
    }
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
      <header className="glass-strong relative z-30 border-b border-primary/20 overflow-hidden">
        {/* Luxury Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-gradient-radial from-primary/25 via-primary/10 to-transparent rounded-full blur-3xl animate-glow-pulse-slow" />
          <div className="absolute -top-20 right-1/3 w-[400px] h-[400px] bg-gradient-radial from-accent/20 via-accent/5 to-transparent rounded-full blur-3xl animate-glow-pulse-slow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent shimmer-slow" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
          {/* Top Row: Logo Centered with Theme Toggle */}
          <div className="relative flex items-center justify-center mb-8">
            {/* Theme toggle - absolute positioned right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <ThemeToggle />
            </div>
            
            {/* Centered Logo */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-radial from-primary/30 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-elegant" />
              <img 
                src={soleiaLogo} 
                alt="Soleia" 
                className="h-14 md:h-20 object-contain relative z-10 drop-shadow-lg"
              />
            </div>
          </div>

          {/* Elegant Event Info Card */}
          <div className="relative mb-8">
            {/* Decorative Lines */}
            <div className="absolute left-0 right-0 top-0 flex items-center justify-center">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/40 to-primary/60" />
              <div className="px-6">
                <img src={sunIcon} alt="" className="w-6 h-6 object-contain opacity-60" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-primary/40 to-primary/60" />
            </div>
            
            <div className="pt-10 text-center">
              {/* Event Name - Hero Typography */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-4xl md:text-5xl lg:text-6xl font-extralight tracking-[0.15em] uppercase mb-6"
              >
                <span className="text-gradient-gold">{clientLink.event_name}</span>
              </motion.h1>
              
              {/* Elegant Divider */}
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6"
              />
              
              {/* Client Name & Date - Refined Layout */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-8"
              >
                {/* Client Name */}
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border border-primary/40 group-hover:border-primary/60 transition-elegant">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">Hosted By</p>
                    <p className="text-xl md:text-2xl font-light text-foreground tracking-wide">{clientLink.client_name}</p>
                  </div>
                </div>
                
                {/* Vertical Divider */}
                {clientLink.event_date && (
                  <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
                )}
                
                {/* Event Date */}
                {clientLink.event_date && (
                  <div className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border border-primary/40 group-hover:border-primary/60 transition-elegant">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">Event Date</p>
                      <p className="text-xl md:text-2xl font-light text-foreground tracking-wide">
                        {format(new Date(clientLink.event_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
              
              {/* Live Session Badge - Centered */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="inline-flex items-center gap-3 glass px-6 py-3 rounded-full border border-success/30"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                </span>
                <span className="text-sm font-medium text-success tracking-wide">Live Session</span>
                <span className="text-xs text-muted-foreground">• Syncing in real-time</span>
              </motion.div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-14 bg-background/50 border-border/50 focus:border-primary/50 transition-elegant rounded-2xl h-14 backdrop-blur-sm text-base shadow-lg"
            />
            {isSearching && (
              <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
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
                  const hasPlacements = selection?.placements && selection.placements.length > 0;
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
                        onPlayClick={(e) => openClipDetail(clip, e)}
                        categoryGradient={categoryGradients[selectedCategory] || categoryGradients['abstract']}
                      />
                      
                      {/* Selection Success Badge - Shows when clip is selected */}
                      {selected && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute top-3 right-3 z-20"
                        >
                          <div className="flex items-center gap-1.5 bg-success text-success-foreground px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg">
                            <Check className="w-3 h-3" />
                            <span>Added</span>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Card Footer with Info and Actions */}
                      <div className="relative p-3 md:p-4 glass border-t border-primary/10">
                        {/* Title Row */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-foreground truncate tracking-tight text-sm flex-1">
                            {clip.title}
                          </h3>
                          {!selected && (
                            <div className="flex items-center gap-1 text-xs text-primary/70 group-hover:text-primary transition-colors">
                              <Star className="w-3 h-3" />
                              <span className="hidden sm:inline">Click to add</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Placement Badges Row - Only show for selected clips with placements */}
                        {selected && hasPlacements && (
                          <div className="mb-2">
                            <PlacementBadges 
                              placements={selection?.placements || []} 
                              compact 
                            />
                          </div>
                        )}
                        
                        {/* Configure Button for Selected Clips */}
                        {selected && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-8 text-xs gap-1.5 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                            onClick={(e) => openClipDetail(clip, e)}
                          >
                            <MapPin className="w-3 h-3" />
                            {hasPlacements ? 'Edit Placements' : 'Configure Screens'}
                          </Button>
                        )}
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

      {/* Clip Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              {detailClip?.title}
            </DialogTitle>
            <DialogDescription>
              Configure screen placements and add notes for this clip
            </DialogDescription>
          </DialogHeader>
          
          {detailClip && (
            <div className="space-y-6 mt-4">
              {/* Video Preview */}
              {detailClip.previewUrl && (
                <div className="aspect-video rounded-xl overflow-hidden bg-secondary/20">
                  <video
                    src={detailClip.previewUrl}
                    poster={detailClip.thumbnail}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Screen Placements */}
              <Collapsible open={isPlacementOpen} onOpenChange={setIsPlacementOpen}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>Screen Placements</span>
                      {detailPlacements.length > 0 && (
                        <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                          {detailPlacements.length} selected
                        </span>
                      )}
                    </div>
                    {isPlacementOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <Tabs defaultValue="interior" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="interior">Interior</TabsTrigger>
                      <TabsTrigger value="outdoor">Outdoor</TabsTrigger>
                    </TabsList>
                    <TabsContent value="interior" className="mt-4">
                      <VenueScreenMap
                        selectedPlacements={detailPlacements}
                        onToggle={toggleDetailPlacement}
                        interactive
                      />
                    </TabsContent>
                    <TabsContent value="outdoor" className="mt-4">
                      <OutdoorPlacementDiagram
                        selectedPlacements={detailPlacements}
                        onToggle={toggleDetailPlacement}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => toggleDetailPlacement('Full Outdoor')}
                      >
                        {ALL_OUTDOOR_SCREENS.every(s => detailPlacements.includes(s)) 
                          ? 'Clear All Outdoor' 
                          : 'Select All Outdoor'}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CollapsibleContent>
              </Collapsible>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Notes
                </label>
                <Textarea
                  value={detailNote}
                  onChange={(e) => setDetailNote(e.target.value)}
                  placeholder="Add any notes about this clip..."
                  className="min-h-[80px] bg-background/50"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDetailModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2 glow-gold"
                  onClick={saveClipDetail}
                  disabled={isSavingDetail}
                >
                  {isSavingDetail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Save Selection
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SharedGalleryView;
