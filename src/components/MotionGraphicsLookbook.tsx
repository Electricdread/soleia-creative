import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Check, Send, Sparkles, Plus, Clock, Monitor, MessageSquare, FileText, Search, Loader2, RefreshCw, Volume2, VolumeX, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { artlistApi, artlistCategories, type ArtlistClip, type ArtlistCategoryKey } from '@/lib/api/artlist';
import { useToast } from '@/hooks/use-toast';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { UserMenu } from '@/components/auth/UserMenu';
import AnimatedRays from '@/components/AnimatedRays';
import soleiaLogo from '@/assets/soleia-logo-new.png';

interface SelectedClip extends ArtlistClip {
  note: string;
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
  const [selectedCategory, setSelectedCategory] = useState<ArtlistCategoryKey>('motion-backgrounds');
  const [clips, setClips] = useState<ArtlistClip[]>([]);
  const [selectedClips, setSelectedClips] = useState<SelectedClip[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewClip, setPreviewClip] = useState<ArtlistClip | null>(null);
  const [previewNote, setPreviewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [isFromCache, setIsFromCache] = useState(false);
  const [hoveredClip, setHoveredClip] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
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
          toast({
            title: "Loaded from cache",
            description: `${cachedResult.clips.length} clips loaded instantly`,
          });
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
    setShowPreviewModal(true);
  };

  const addToSelectionFromPreview = () => {
    if (!previewClip) return;
    
    setSelectedClips(prev => {
      const existing = prev.find(c => c.id === previewClip.id);
      if (existing) {
        return prev.map(c => c.id === previewClip.id ? { ...c, note: previewNote } : c);
      }
      return [...prev, { ...previewClip, note: previewNote }];
    });
    setShowPreviewModal(false);
    setPreviewClip(null);
    setPreviewNote('');
    
    toast({
      title: "Added to selection",
      description: `"${previewClip.title}" has been added to your selection`,
    });
  };

  const toggleClipSelection = (clip: ArtlistClip) => {
    setSelectedClips(prev => {
      const isSelected = prev.some(c => c.id === clip.id);
      if (isSelected) {
        return prev.filter(c => c.id !== clip.id);
      } else {
        return [...prev, { ...clip, note: '' }];
      }
    });
  };

  const handleImageError = (clipId: string) => {
    setImageErrors(prev => new Set(prev).add(clipId));
  };

  const sendSelections = () => {
    console.log('Selected clips:', selectedClips);
    toast({
      title: "Selections sent!",
      description: `${selectedClips.length} clips have been submitted`,
    });
  };


  return (
    <div className="min-h-screen">
      {/* Luxury Header */}
      <header className="glass-strong sticky top-0 z-30 border-b border-primary/10">
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* User Menu - Top Right */}
          <div className="absolute top-6 right-6">
            <UserMenu />
          </div>
          
          {/* Centered Hero Logo Layout */}
          <div className="flex flex-col items-center text-center">
            {/* Large Soleia Logo - Full width on mobile */}
            <img 
              src={soleiaLogo} 
              alt="Soleia" 
              className="w-full max-w-3xl h-auto md:h-80 object-contain transition-elegant hover:scale-105 mb-2 px-4 md:px-0"
            />
            
            {/* Look Book Title - bolder styling with text shadow */}
            <h1 
              className="text-3xl font-semibold tracking-[0.25em] uppercase text-gradient-gold mb-3"
              style={{ textShadow: '0 2px 8px hsl(38 92% 50% / 0.3), 0 4px 16px hsl(38 92% 50% / 0.15)' }}
            >
              Look Book
            </h1>
            
            {/* Search Bar - Centered below title */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-11 w-80 bg-background/40 border-border/50 focus:border-primary/50 transition-elegant rounded-xl h-11"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                variant="secondary"
                className="h-11 px-5 rounded-xl transition-elegant hover:bg-primary/10 hover:text-primary"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Luxury Category Navigation */}
        <nav className="flex gap-3 mb-10 overflow-x-auto pb-3 scrollbar-hide">
          {artlistCategories.map((cat, index) => (
            <button
              key={cat.key}
              onClick={() => {
                setSelectedCategory(cat.key);
                setSearchQuery('');
              }}
              style={{ animationDelay: `${index * 50}ms` }}
              className={`px-7 py-3.5 rounded-2xl font-medium whitespace-nowrap flex items-center gap-2.5 transition-elegant animate-fade-in-up ${
                selectedCategory === cat.key
                  ? 'bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground glow-gold shadow-lg'
                  : 'glass hover:bg-primary/10 hover:border-primary/30 text-foreground hover-lift'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 pb-36">
            {clips.map((clip, index) => {
              const isSelected = selectedClips.some(c => c.id === clip.id);
              const hasNote = selectedClips.find(c => c.id === clip.id)?.note;
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
                  {/* Luxury Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[selectedCategory] || categoryGradients['abstract']} opacity-70`} />
                  
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-secondary/20">
                    {!hasImageError ? (
                      <img
                        src={clip.thumbnail}
                        alt={clip.title}
                        className="w-full h-full object-cover transition-elegant group-hover:scale-105"
                        onError={() => handleImageError(clip.id)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-accent/10">
                        <Sparkles className="w-12 h-12 text-primary/60" />
                      </div>
                    )}

                    {/* Premium Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center glow-gold shadow-lg transition-elegant">
                        <Check className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}

                    {/* Elegant Note Indicator */}
                    {hasNote && (
                      <div className="absolute top-3 left-3 w-9 h-9 bg-gradient-to-br from-success to-primary rounded-full flex items-center justify-center glow-amber shadow-lg">
                        <FileText className="w-4 h-4 text-success-foreground" />
                      </div>
                    )}

                    {/* Luxury Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-elegant">
                      <button
                        onClick={(e) => openPreview(clip, e)}
                        className="w-16 h-16 bg-background/95 rounded-full flex items-center justify-center hover:bg-background transition-elegant shadow-2xl glow-gold hover:scale-110"
                      >
                        <Play className="w-8 h-8 text-primary ml-1" />
                      </button>
                    </div>

                    {/* Premium Badge */}
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-lg text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-elegant border border-primary/20">
                      Premium
                    </div>
                  </div>

                  {/* Elegant Info Panel */}
                  <div className="relative p-4 glass border-t border-primary/10">
                    <h3 className="font-semibold text-foreground truncate mb-2 tracking-tight">{clip.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Monitor className="w-4 h-4 text-primary/60" />
                        {clip.resolution}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary/60" />
                        {clip.duration}
                      </span>
                    </div>
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

              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedClips([])}
                  className="text-muted-foreground hover:text-foreground transition-elegant rounded-xl"
                >
                  Clear All
                </Button>
                <Button onClick={sendSelections} className="glow-gold gap-2 rounded-xl px-6 py-5 text-base font-semibold bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 transition-elegant pulse-gold">
                  <Send className="w-5 h-5" />
                  Send Selections
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
        <DialogContent className="max-w-4xl glass-strong border-primary/20 rounded-3xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-2xl font-bold tracking-tight text-gradient-gold">{previewClip?.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground tracking-wide">
              {previewClip?.resolution} • {previewClip?.duration} • Premium Quality
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Luxury Video Preview */}
            <div className="aspect-video bg-secondary/20 rounded-2xl overflow-hidden relative ring-1 ring-primary/20">
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
                  <div className="absolute bottom-4 left-4 flex gap-2">
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

            {/* Note Input */}
            <div className="space-y-3">
              <Label htmlFor="preview-note" className="flex items-center gap-2 text-foreground">
                <MessageSquare className="w-4 h-4" />
                Add a note for this clip
              </Label>
              <Textarea
                id="preview-note"
                value={previewNote}
                onChange={(e) => setPreviewNote(e.target.value)}
                placeholder="Add notes about how you want to use this clip, timing preferences, etc..."
                className="min-h-[100px] bg-background/50"
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
