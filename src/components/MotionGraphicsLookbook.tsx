import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Check, Send, Sparkles, Plus, Clock, Monitor, MessageSquare, FileText, Search, Loader2, RefreshCw, Volume2, VolumeX, Pause, Maximize, Mail, MapPin, Download, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import SelectionsSummary from '@/components/SelectionsSummary';
import ClipThumbnail from '@/components/ClipThumbnail';
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
import VenuePlacementDiagram from '@/components/VenuePlacementDiagram';
import OutdoorPlacementDiagram from '@/components/OutdoorPlacementDiagram';


const INTERIOR_PLACEMENTS = [
  'Curves SR',
  'IMAG SR',
  'Center',
  'IMAG SL',
  'SL Curves',
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
  const { toast } = useToast();
  
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

  // Fetch clips - first from cache, then scrape if needed
  const fetchClips = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setImageErrors(new Set());
    
    try {
      // Try cache first for instant load
      if (!forceRefresh) {
        const cachedResult = await artlistApi.getCachedClips(selectedCategory);
        if (cachedResult.success && cachedResult.clips && cachedResult.clips.length > 0) {
          setClips(cachedResult.clips);
          setIsFromCache(true);
          setIsLoading(false);
          return;
        }
      }
      
      // If no cache or force refresh, scrape
      const result = await artlistApi.scrapeCategory(selectedCategory, forceRefresh);
      if (result.success && result.clips) {
        setClips(result.clips);
        setIsFromCache(result.cached || false);
        if (!result.cached) {
          toast({
            title: "Fresh clips loaded",
            description: `Found ${result.clips.length} clips from Artlist`,
          });
        }
      } else {
        toast({
          title: "Error loading clips",
          description: result.error || "Failed to load clips from Artlist",
          variant: "destructive",
        });
        setClips([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to the scraping service",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, toast]);

  useEffect(() => {
    fetchClips(false);
  }, [fetchClips]);

  // Search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const result = await artlistApi.search(searchQuery);
      if (result.success && result.clips) {
        setClips(result.clips);
        toast({
          title: "Search complete",
          description: `Found ${result.clips.length} clips for "${searchQuery}"`,
        });
      } else {
        toast({
          title: "Search failed",
          description: result.error || "No results found",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: "Search failed",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
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
    <div className="min-h-screen">
      {/* Dynamic Luxury Header with Animated Background */}
      <header className="glass-strong relative z-30 border-b border-primary/10 overflow-hidden">
        {/* Animated Background Rays */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 left-1/4 w-96 h-96 bg-gradient-radial from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl animate-glow-pulse-slow" />
          <div className="absolute -top-10 right-1/4 w-80 h-80 bg-gradient-radial from-accent/15 via-accent/5 to-transparent rounded-full blur-3xl animate-glow-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent shimmer-slow" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* User Menu - Top Right */}
          <div className="absolute top-6 right-6 z-20">
            <UserMenu />
          </div>
          
          {/* Centered Hero Logo Layout */}
          <div className="flex flex-col items-center text-center relative">
            {/* Animated Glow Ring Behind Logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full border border-primary/20 animate-rotate-glow opacity-30 pointer-events-none" />
            
            {/* Large Soleia Logo - Full width on mobile with entrance animation */}
            <img 
              src={soleiaLogo} 
              alt="Soleia" 
              className="w-full max-w-3xl h-auto md:h-80 object-contain transition-elegant hover:scale-105 mb-2 px-4 md:px-0 opacity-0 animate-fade-in-up relative z-10"
              style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
            />
            
            {/* Looks Collection Title - matching logo font style with entrance animation */}
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
            
            {/* Motion Backgrounds Subtitle with shimmer effect */}
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
            
            {/* Search Bar - Centered below title with entrance animation */}
            <div 
              className="opacity-0 animate-fade-in-up relative z-10"
              style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-11 w-80 bg-background/40 border-border/50 focus:border-primary/50 transition-elegant rounded-xl h-11 backdrop-blur-sm"
                />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Luxury Category Navigation with staggered entrance */}
        <nav className="flex gap-3 mb-10 overflow-x-auto pb-3 scrollbar-hide">
          {artlistCategories.map((cat, index) => (
            <button
              key={cat.key}
              onClick={() => {
                setSelectedCategory(cat.key);
                setSearchQuery('');
              }}
              style={{ 
                animationDelay: `${700 + index * 80}ms`,
                animationFillMode: 'forwards'
              }}
              className={`px-7 py-3.5 rounded-2xl font-medium whitespace-nowrap flex items-center gap-2.5 transition-elegant opacity-0 animate-fade-in-up ${
                selectedCategory === cat.key
                  ? 'bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground shadow-lg'
                  : 'glass hover:bg-primary/10 hover:border-primary/30 text-foreground hover-lift'
              }`}
            >
              <img 
                src={sunIcon} 
                alt="" 
                className="w-5 h-5 object-contain" 
              />
              <span className="tracking-wide">{cat.label}</span>
            </button>
          ))}
        </nav>

        {/* Elegant Admin & Refresh Controls */}
        <div className="mb-8 flex items-center gap-4">
          <AdminPanel onClipsUpdated={() => fetchClips(false)} />
          <Button
            onClick={() => fetchClips(true)}
            disabled={isLoading}
            variant="outline"
            className="gap-2 rounded-xl border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-elegant"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {clips.length > 0 && (
            <span className="text-muted-foreground text-sm tracking-wide">
              {clips.length} clips {isFromCache && '• cached'}
            </span>
          )}
        </div>

        {/* Premium Clips Grid */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-36">
            {clips.map((clip, index) => {
              const isSelected = selectedClips.some(c => c.id === clip.id);
              const hasNote = !!selectedClips.find(c => c.id === clip.id)?.note;
              const hasImageError = imageErrors.has(clip.id);

              return (
                <div
                  key={clip.id}
                  style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-elegant animate-fade-in-up ${
                    isSelected 
                      ? 'ring-2 ring-primary ring-offset-4 ring-offset-background scale-[1.02] glow-gold' 
                      : 'hover-lift hover:ring-1 hover:ring-primary/30'
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
                  <div className="relative p-3 glass border-t border-primary/10">
                    <h3 className="font-semibold text-foreground truncate tracking-tight text-sm">{clip.title}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Luxury Selection Bar */}
      {selectedClips.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 glass-strong border-t border-primary/20 z-40 animate-slide-up">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/25 to-accent/20 flex items-center justify-center glow-gold border border-primary/30">
                  <span className="text-2xl font-bold text-gradient-gold">{selectedClips.length}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground tracking-tight">Clips Selected</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedClips.filter(c => c.note).length} with notes
                  </p>
                </div>
              </div>

              {/* Premium Selected Thumbnails */}
              <div className="hidden md:flex items-center gap-3 overflow-x-auto max-w-lg">
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

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedClips([])}
                  className="text-muted-foreground hover:text-foreground transition-elegant rounded-xl"
                >
                  Clear All
                </Button>
                <Button 
                  onClick={() => setShowSummary(true)} 
                  className="glow-gold gap-2 rounded-xl px-6 py-5 text-base font-semibold bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 transition-elegant pulse-gold"
                >
                  <ClipboardList className="w-5 h-5" />
                  Review & Send
                </Button>
              </div>
            </div>
          </div>
        </div>
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
                      <VenuePlacementDiagram 
                        selectedPlacements={previewPlacements} 
                        onToggle={togglePreviewPlacement}
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
    </div>
  );
};

export default MotionGraphicsLookbook;
