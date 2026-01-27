import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Check, Send, Sparkles, Plus, Clock, Monitor, MessageSquare, FileText, Search, Loader2, RefreshCw, Volume2, VolumeX, Pause, Maximize, Mail, MapPin, Download, ClipboardList, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Map } from 'lucide-react';
import SelectionsSummary from '@/components/SelectionsSummary';
import ClipThumbnail from '@/components/ClipThumbnail';
import FloatingActionButton from '@/components/FloatingActionButton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { artlistApi, artlistCategories, type ArtlistClip, type ArtlistCategoryKey } from '@/lib/api/artlist';
import { useToast } from '@/hooks/use-toast';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { UserMenu } from '@/components/auth/UserMenu';
import AnimatedRays from '@/components/AnimatedRays';
import soleiaLogo from '@/assets/soleia-logo-new.png';
import sunIcon from '@/assets/sun-icon.jpeg';
import { generateSelectionsPdf } from '@/lib/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import VenueScreenMap, { SCREEN_GROUPS } from '@/components/VenueScreenMap';
import OutdoorPlacementDiagram from '@/components/OutdoorPlacementDiagram';
import { MobileMenu } from '@/components/MobileMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PoweredByShowBlox } from '@/components/PoweredByShowBlox';
import { useIsMobile } from '@/hooks/use-mobile';

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

type PlacementOption = typeof INTERIOR_PLACEMENTS[number] | typeof OUTDOOR_PLACEMENTS[number];

interface SelectedClip extends ArtlistClip {
  note: string;
  eventName: string;
  eventDate: string;
  placements: string[];
}

// Luxury warm sun goddess gradient palette
const categoryGradients: Record<string, string> = {
  'motion-backgrounds': 'from-amber-600/25 via-orange-500/20 to-amber-700/25',
  'abstract': 'from-yellow-600/25 via-amber-500/20 to-orange-600/25',
  'particles': 'from-orange-500/25 via-amber-400/20 to-yellow-600/25',
  'nature': 'from-amber-500/25 via-yellow-500/20 to-orange-500/25',
  'technology': 'from-yellow-500/25 via-orange-400/20 to-amber-600/25',
  'corporate': 'from-amber-700/25 via-yellow-600/20 to-orange-700/25',
  'events': 'from-orange-600/25 via-red-500/20 to-amber-600/25',
};

const MotionGraphicsLookbook = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<ArtlistCategoryKey>('featured-collections');
  const [clips, setClips] = useState<ArtlistClip[]>([]);
  const [selectedClips, setSelectedClips] = useState<SelectedClip[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewClip, setPreviewClip] = useState<ArtlistClip | null>(null);
  const [previewNote, setPreviewNote] = useState('');
  const [previewEventName, setPreviewEventName] = useState('');
  const [previewEventDate, setPreviewEventDate] = useState('');
  const [previewPlacements, setPreviewPlacements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [isFromCache, setIsFromCache] = useState(false);
  const [hoveredClip, setHoveredClip] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isPlacementOpen, setIsPlacementOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get current category index for swipe navigation
  const currentCategoryIndex = artlistCategories.findIndex(c => c.key === selectedCategory);
  
  // Track swipe direction for animations
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('right');

  // Swipe to navigate categories
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

  // Fetch clips - first from cache, then scrape if needed
  const fetchClips = useCallback(async (_forceRefresh: boolean = false) => {
    setIsLoading(true);
    setImageErrors(new Set());
    
    try {
      // Only use cached clips - no external URL retrieval
      const cachedResult = await artlistApi.getCachedClips(selectedCategory);
      if (cachedResult.success && cachedResult.clips && cachedResult.clips.length > 0) {
        setClips(cachedResult.clips);
        setIsFromCache(true);
      } else {
        setClips([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setClips([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchClips(false);
  }, [fetchClips]);

  // Search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // Search disabled - only using cached clips
    toast({
      title: "Search disabled",
      description: "Browse clips by category instead",
    });
    setIsSearching(false);
  };

  const openPreview = (clip: ArtlistClip, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewClip(clip);
    const existingSelection = selectedClips.find(c => c.id === clip.id);
    setPreviewNote(existingSelection?.note || '');
    setPreviewEventName(existingSelection?.eventName || '');
    setPreviewEventDate(existingSelection?.eventDate || '');
    setPreviewPlacements(existingSelection?.placements || []);
    setShowPreviewModal(true);
  };

  const addToSelectionFromPreview = () => {
    if (!previewClip) return;
    
    setSelectedClips(prev => {
      const existing = prev.find(c => c.id === previewClip.id);
      if (existing) {
        return prev.map(c => c.id === previewClip.id ? { ...c, note: previewNote, eventName: previewEventName, eventDate: previewEventDate, placements: previewPlacements } : c);
      }
      return [...prev, { ...previewClip, note: previewNote, eventName: previewEventName, eventDate: previewEventDate, placements: previewPlacements }];
    });
    setShowPreviewModal(false);
    setPreviewClip(null);
    setPreviewNote('');
    setPreviewEventName('');
    setPreviewEventDate('');
    setPreviewPlacements([]);
    
    toast({
      title: "Added to selection",
      description: `"${previewClip.title}" has been added to your selection`,
    });
  };

  const togglePreviewPlacement = (placement: string) => {
    if (placement === 'Full Interior') {
      // Toggle all interior screens on/off
      const allInteriorSelected = ALL_INTERIOR_SCREENS.every(s => previewPlacements.includes(s));
      if (allInteriorSelected) {
        setPreviewPlacements(prev => prev.filter(p => !ALL_INTERIOR_SCREENS.includes(p as any)));
      } else {
        setPreviewPlacements(prev => [...new Set([...prev, ...ALL_INTERIOR_SCREENS])]);
      }
    } else if (placement === 'Full Outdoor') {
      // Toggle all outdoor screens on/off
      const allOutdoorSelected = ALL_OUTDOOR_SCREENS.every(s => previewPlacements.includes(s));
      if (allOutdoorSelected) {
        setPreviewPlacements(prev => prev.filter(p => !ALL_OUTDOOR_SCREENS.includes(p as any)));
      } else {
        setPreviewPlacements(prev => [...new Set([...prev, ...ALL_OUTDOOR_SCREENS])]);
      }
    } else {
      setPreviewPlacements(prev => 
        prev.includes(placement) 
          ? prev.filter(p => p !== placement)
          : [...prev, placement]
      );
    }
  };

  const toggleClipSelection = (clip: ArtlistClip) => {
    setSelectedClips(prev => {
      const isSelected = prev.some(c => c.id === clip.id);
      if (isSelected) {
        return prev.filter(c => c.id !== clip.id);
      } else {
        return [...prev, { ...clip, note: '', eventName: '', eventDate: '', placements: [] }];
      }
    });
  };

  const generatePdfData = async () => {
    return await generateSelectionsPdf(
      selectedClips.map(clip => ({
        id: clip.id,
        external_id: clip.id,
        title: clip.title,
        thumbnail: clip.thumbnail,
        note: clip.note,
        eventName: clip.eventName,
        eventDate: clip.eventDate,
        placements: clip.placements,
        category: selectedCategory,
        resolution: clip.resolution,
        duration: clip.duration
      }))
    );
  };

  const downloadPdf = async () => {
    if (selectedClips.length === 0) return;
    
    setIsDownloading(true);
    
    try {
      const pdfBase64 = await generatePdfData();
      
      // Create download link
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `soleia-selections-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "PDF Downloaded",
        description: `Your ${selectedClips.length} selections have been saved`,
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message || "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleImageError = (clipId: string) => {
    setImageErrors(prev => new Set(prev).add(clipId));
  };

  const sendSelections = async () => {
    if (selectedClips.length === 0) return;
    
    setIsSendingEmail(true);
    
    try {
      // Generate PDF with thumbnails
      const pdfBase64 = await generatePdfData();
      
      // Send to edge function
      const { data, error } = await supabase.functions.invoke('send-selections-pdf', {
        body: {
          selections: selectedClips.map(clip => ({
            external_id: clip.id,
            title: clip.title,
            thumbnail: clip.thumbnail,
            note: clip.note,
            eventName: clip.eventName,
            eventDate: clip.eventDate,
            placements: clip.placements,
            category: selectedCategory
          })),
          pdfBase64,
          recipientEmail: 'ninemilelion@gmail.com'
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Email sent!",
        description: `Your ${selectedClips.length} selections have been sent to ninemilelion@gmail.com`,
      });
      
      // Clear selections after successful send
      setSelectedClips([]);
    } catch (error: any) {
      console.error('Send error:', error);
      toast({
        title: "Failed to send",
        description: error.message || "Could not send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };


  // Handle note updates from summary page
  const handleUpdateClipNote = (clipId: string, note: string) => {
    setSelectedClips(prev => 
      prev.map(clip => clip.id === clipId ? { ...clip, note } : clip)
    );
  };

  // Show summary page if toggled
  if (showSummary && selectedClips.length > 0) {
    return (
      <SelectionsSummary
        selectedClips={selectedClips}
        onBack={() => setShowSummary(false)}
        onClearSelections={() => setSelectedClips([])}
        selectedCategory={selectedCategory}
        onUpdateClipNote={handleUpdateClipNote}
      />
    );
  }

  return (
    <div className="min-h-screen touch-manipulation">
      {/* Dynamic Luxury Header with Animated Background */}
      <header className="glass-strong relative z-30 border-b border-primary/10 overflow-hidden">
        {/* Animated Background Rays */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 left-1/4 w-96 h-96 bg-gradient-radial from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl animate-glow-pulse-slow" />
          <div className="absolute -top-10 right-1/4 w-80 h-80 bg-gradient-radial from-accent/15 via-accent/5 to-transparent rounded-full blur-3xl animate-glow-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent shimmer-slow" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Mobile Header Bar */}
          <div className="flex flex-col items-center lg:hidden">
            <div className="flex items-center justify-center w-full mb-3 relative">
              <div className="absolute left-0">
                <MobileMenu
                  selectedCategory={selectedCategory}
                  onCategoryChange={(cat) => {
                    setSelectedCategory(cat);
                  }}
                />
              </div>
              <img 
                src={soleiaLogo} 
                alt="Soleia" 
                className="h-12 object-contain"
              />
            </div>
            {/* Mobile Actions Row */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/creative-guide')}
                className="gap-1.5 h-9 px-3 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
              >
                <Map className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs">Creative Guide</span>
              </Button>
              <PoweredByShowBlox variant="header" />
            </div>
          </div>
          
          {/* Centered Hero Logo Layout - Desktop */}
          <div className="hidden lg:flex flex-col items-center text-center relative">
            {/* Animated Glow Ring Behind Logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full border border-primary/20 animate-rotate-glow opacity-30 pointer-events-none" />
            
            {/* Large Soleia Logo */}
            <img 
              src={soleiaLogo} 
              alt="Soleia" 
              className="w-full max-w-3xl h-auto md:h-80 object-contain transition-elegant hover:scale-105 mb-2 px-4 md:px-0 opacity-0 animate-fade-in-up relative z-10"
              style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
            />
            
            {/* Looks Collection Title */}
            <h1 
              className="text-3xl font-light tracking-[0.35em] uppercase text-gradient-gold mb-1 opacity-0 animate-fade-in-up relative z-10"
              style={{ 
                textShadow: '0 2px 8px hsl(38 92% 50% / 0.3), 0 4px 16px hsl(38 92% 50% / 0.15)',
                fontFamily: 'serif',
                letterSpacing: '0.35em',
                animationDelay: '300ms',
                animationFillMode: 'forwards'
              }}
            >
              Looks Collection
            </h1>
            
            {/* Motion Backgrounds Subtitle */}
            <p 
              className="text-lg font-light tracking-[0.2em] uppercase text-muted-foreground mb-4 opacity-0 animate-fade-in-up relative z-10"
              style={{ 
                fontFamily: 'serif',
                animationDelay: '400ms',
                animationFillMode: 'forwards'
              }}
            >
              Motion Backgrounds
            </p>
            
            {/* Actions - Desktop */}
            <div 
              className="opacity-0 animate-fade-in-up relative z-10 flex items-center gap-3"
              style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/creative-guide')}
                className="gap-2 h-11 px-4 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
              >
                <Map className="w-4 h-4 text-primary" />
                <span className="text-sm">Creative Guide</span>
              </Button>
              <PoweredByShowBlox variant="header" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Swipeable Category Navigation with arrows */}
        <nav className="relative mb-8 md:mb-10 hidden lg:block">
          {/* Previous arrow */}
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

          {/* Next arrow */}
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

        {/* Elegant Admin & Refresh Controls */}
        <div className="mb-6 md:mb-8 flex flex-wrap items-center gap-3 md:gap-4">
          <AdminPanel onClipsUpdated={() => fetchClips(false)} />
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

        {/* Premium Clips Grid with Swipe Navigation */}
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
              <p className="text-muted-foreground text-sm mt-2">Please wait a moment</p>
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
                initial={{ 
                  opacity: 0, 
                  x: swipeDirection === 'left' ? 100 : -100,
                  scale: 0.95
                }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  scale: 1
                }}
                exit={{ 
                  opacity: 0, 
                  x: swipeDirection === 'left' ? -100 : 100,
                  scale: 0.95
                }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  opacity: { duration: 0.2 }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-36"
              >
                {clips.map((clip, index) => {
                  const isSelected = selectedClips.some(c => c.id === clip.id);
                  const hasNote = !!selectedClips.find(c => c.id === clip.id)?.note;
                  const hasImageError = imageErrors.has(clip.id);

                  return (
                    <motion.div
                      key={clip.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: index * 0.03,
                        duration: 0.3,
                        ease: "easeOut"
                      }}
                      whileTap={{ scale: 0.98 }}
                      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-elegant touch-manipulation ${
                        isSelected 
                          ? 'ring-2 ring-primary ring-offset-4 ring-offset-background scale-[1.02] glow-gold' 
                          : 'hover-lift hover:ring-1 hover:ring-primary/30 active:scale-[0.98]'
                      }`}
                      onClick={() => toggleClipSelection(clip)}
                    >
                      <ClipThumbnail
                        clip={clip}
                        isSelected={isSelected}
                        hasNote={hasNote}
                        hasImageError={hasImageError}
                        onImageError={handleImageError}
                        onPlayClick={(e) => openPreview(clip, e)}
                        categoryGradient={categoryGradients[selectedCategory] || categoryGradients['abstract']}
                      />

                      {/* Elegant Info Panel */}
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
            <motion.span
              animate={{ x: [-2, 2, -2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronLeft className="w-3 h-3" />
            </motion.span>
            Swipe to change category
            <motion.span
              animate={{ x: [2, -2, 2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronRight className="w-3 h-3" />
            </motion.span>
          </motion.p>
        </div>
      </main>

      {/* Floating Action Button for selections */}
      <FloatingActionButton 
        count={selectedClips.length} 
        onClick={() => setShowSummary(true)} 
      />

      {/* Luxury Selection Bar - Touch optimized */}
      {selectedClips.length > 0 && (
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
                  <span className="text-xl md:text-2xl font-bold text-gradient-gold">{selectedClips.length}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="font-semibold text-foreground tracking-tight">Clips Selected</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedClips.filter(c => c.note).length} with notes
                  </p>
                </div>
              </div>

              {/* Premium Selected Thumbnails - Hidden on small screens */}
              <div className="hidden lg:flex items-center gap-3 overflow-x-auto max-w-lg">
                {selectedClips.slice(0, 6).map(clip => (
                  <div key={clip.id} className="relative flex-shrink-0 transition-elegant hover:scale-105">
                    <div className="w-18 h-11 rounded-xl overflow-hidden ring-2 ring-primary/60 shadow-lg">
                      {!imageErrors.has(clip.id) ? (
                        <img src={clip.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/15 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-primary/60" />
                        </div>
                      )}
                    </div>
                    {clip.note && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-success to-primary rounded-full flex items-center justify-center shadow-md">
                        <MessageSquare className="w-2.5 h-2.5 text-success-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {selectedClips.length > 6 && (
                  <span className="text-primary font-medium text-sm">+{selectedClips.length - 6}</span>
                )}
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedClips([])}
                  className="text-muted-foreground hover:text-foreground transition-elegant rounded-xl h-12 px-3 md:px-4 touch-manipulation active:scale-95"
                >
                  <span className="hidden sm:inline">Clear All</span>
                  <span className="sm:hidden">Clear</span>
                </Button>
                <Button 
                  onClick={() => setShowSummary(true)} 
                  className="glow-gold gap-2 rounded-xl px-4 md:px-6 h-12 md:py-5 text-sm md:text-base font-semibold bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 transition-elegant pulse-gold touch-manipulation active:scale-95"
                >
                  <ClipboardList className="w-5 h-5" />
                  <span className="hidden sm:inline">Review & Send</span>
                  <span className="sm:hidden">Review</span>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Luxury Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={(open) => {
        setShowPreviewModal(open);
        if (!open) {
          setIsPlaying(false);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-strong border-primary/20 rounded-3xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-2xl font-bold tracking-tight text-gradient-gold">{previewClip?.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground tracking-wide">
              Premium Motion Graphics
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 md:space-y-4">
            {/* Luxury Video Preview - Smaller on mobile */}
            <div className="aspect-video md:aspect-video max-h-[30vh] md:max-h-none bg-secondary/20 rounded-xl md:rounded-2xl overflow-hidden relative ring-1 ring-primary/20">
              {previewClip?.previewUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={previewClip.previewUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            if (isPlaying) {
                              videoRef.current.pause();
                            } else {
                              videoRef.current.play();
                            }
                          }
                        }}
                        className="w-10 h-10 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-foreground" />
                        ) : (
                          <Play className="w-5 h-5 text-foreground ml-0.5" />
                        )}
                      </button>
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="w-10 h-10 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors"
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5 text-foreground" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-foreground" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        const video = videoRef.current;
                        if (video) {
                          if (video.requestFullscreen) {
                            video.requestFullscreen().catch(console.error);
                          } else if ((video as any).webkitRequestFullscreen) {
                            (video as any).webkitRequestFullscreen();
                          } else if ((video as any).webkitEnterFullscreen) {
                            (video as any).webkitEnterFullscreen();
                          }
                        }
                      }}
                      className="w-10 h-10 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors"
                    >
                      <Maximize className="w-5 h-5 text-foreground" />
                    </button>
                  </div>
                </>
              ) : previewClip?.thumbnail && !imageErrors.has(previewClip.id) ? (
                <div className="relative w-full h-full">
                  <img
                    src={previewClip.thumbnail}
                    alt={previewClip.title}
                    className="w-full h-full object-cover"
                    onError={() => previewClip && handleImageError(previewClip.id)}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="text-center p-4">
                      <Play className="w-16 h-16 text-white/60 mx-auto mb-4" />
                      <p className="text-white/80 text-lg font-medium mb-2">Premium Clip Preview</p>
                      <p className="text-white/60 text-sm">Video playback requires Artlist subscription</p>
                      <p className="text-white/40 text-xs mt-4">Source: Artlist.io</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <div className="text-center p-8">
                    <Sparkles className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Premium Clip Preview</p>
                    <p className="text-muted-foreground/60 text-sm">Video playback requires Artlist subscription</p>
                    <p className="text-muted-foreground/40 text-xs mt-4">Source: Artlist.io</p>
                  </div>
                </div>
              )}
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preview-event-name" className="text-foreground">
                  Event Name
                </Label>
                <Input
                  id="preview-event-name"
                  value={previewEventName}
                  onChange={(e) => setPreviewEventName(e.target.value)}
                  placeholder="e.g., Summer Gala 2025"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview-event-date" className="text-foreground">
                  Event Date
                </Label>
                <Input
                  id="preview-event-date"
                  type="date"
                  value={previewEventDate}
                  onChange={(e) => setPreviewEventDate(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>

            {/* Collapsible Placements Section */}
            <Collapsible open={isPlacementOpen} onOpenChange={setIsPlacementOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">Screen Placements</span>
                    {previewPlacements.length > 0 && (
                      <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {previewPlacements.length} selected
                      </span>
                    )}
                  </div>
                  {isPlacementOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pt-3">
                <div className="rounded-xl border border-border/30 bg-background/30 p-3 space-y-3">
                  <Tabs defaultValue="interior" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-background/50 h-9">
                      <TabsTrigger value="interior" className="text-xs data-[state=active]:bg-primary/20">
                        Interior
                      </TabsTrigger>
                      <TabsTrigger value="outdoor" className="text-xs data-[state=active]:bg-primary/20">
                        Outdoor
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="interior" className="space-y-3 mt-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => togglePreviewPlacement('Full Interior')}
                          className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                            ALL_INTERIOR_SCREENS.every(s => previewPlacements.includes(s))
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'bg-background/50 text-muted-foreground hover:bg-primary/10 border border-border/50'
                          }`}
                        >
                          All Interior
                        </button>
                        {INTERIOR_PLACEMENTS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => togglePreviewPlacement(option)}
                            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                              previewPlacements.includes(option)
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-background/50 text-muted-foreground hover:bg-primary/10 border border-border/50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <VenueScreenMap 
                        selectedPlacements={previewPlacements} 
                        onToggle={togglePreviewPlacement}
                        interactive
                      />
                    </TabsContent>
                    
                    <TabsContent value="outdoor" className="space-y-3 mt-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => togglePreviewPlacement('Full Outdoor')}
                          className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                            ALL_OUTDOOR_SCREENS.every(s => previewPlacements.includes(s))
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'bg-background/50 text-muted-foreground hover:bg-primary/10 border border-border/50'
                          }`}
                        >
                          All Outdoor
                        </button>
                        {OUTDOOR_PLACEMENTS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => togglePreviewPlacement(option)}
                            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                              previewPlacements.includes(option)
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-background/50 text-muted-foreground hover:bg-primary/10 border border-border/50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <OutdoorPlacementDiagram 
                        selectedPlacements={previewPlacements} 
                        onToggle={togglePreviewPlacement}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Note Input */}
            <div className="space-y-2">
              <Label htmlFor="preview-note" className="flex items-center gap-2 text-foreground">
                <MessageSquare className="w-4 h-4" />
                Notes
              </Label>
              <Textarea
                id="preview-note"
                value={previewNote}
                onChange={(e) => setPreviewNote(e.target.value)}
                placeholder="Add notes about timing, transitions, etc..."
                className="min-h-[60px] bg-background/50 resize-none"
              />
            </div>

            {/* Elegant Actions */}
            <div className="flex justify-end gap-4 pt-2">
              <Button variant="ghost" onClick={() => setShowPreviewModal(false)} className="rounded-xl transition-elegant">
                Cancel
              </Button>
              <Button onClick={addToSelectionFromPreview} className="glow-gold gap-2 rounded-xl px-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-elegant">
                <Plus className="w-5 h-5" />
                {selectedClips.some(c => c.id === previewClip?.id) ? 'Update Note' : 'Add to Selection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Powered by ShowBlox Footer */}
      <PoweredByShowBlox className="border-t border-border/30" />
    </div>
  );
};

export default MotionGraphicsLookbook;
