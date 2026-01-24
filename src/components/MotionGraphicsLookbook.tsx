import React, { useState, useEffect, useCallback } from 'react';
import { Play, Check, Send, X, Sparkles, Plus, Clock, Monitor, MessageSquare, FileText, Search, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { artlistApi, artlistCategories, type ArtlistClip, type ArtlistCategoryKey } from '@/lib/api/artlist';
import { useToast } from '@/hooks/use-toast';

interface SelectedClip extends ArtlistClip {
  note: string;
}

const categoryGradients: Record<string, string> = {
  'motion-backgrounds': 'from-blue-600/30 to-cyan-600/30',
  'abstract': 'from-purple-600/30 to-pink-600/30',
  'particles': 'from-amber-600/30 to-orange-600/30',
  'nature': 'from-green-600/30 to-emerald-600/30',
  'technology': 'from-indigo-600/30 to-violet-600/30',
  'corporate': 'from-slate-600/30 to-gray-600/30',
  'events': 'from-rose-600/30 to-red-600/30',
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

  // Fetch clips when category changes
  const fetchClips = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await artlistApi.scrapeCategory(selectedCategory);
      if (result.success && result.clips) {
        setClips(result.clips);
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
    fetchClips();
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

  const openArtlistLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20 glow-purple">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Artlist Motion Graphics</h1>
                <p className="text-muted-foreground">Premium 4K Background Loops & Visual Effects</p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search motion graphics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 w-64 bg-background/50"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                variant="secondary"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Category Navigation */}
        <nav className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {artlistCategories.map(cat => (
            <button
              key={cat.key}
              onClick={() => {
                setSelectedCategory(cat.key);
                setSearchQuery('');
              }}
              className={`px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === cat.key
                  ? 'bg-primary text-primary-foreground glow-purple'
                  : 'glass hover:bg-secondary/80 text-foreground'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </nav>

        {/* Refresh Button */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            onClick={fetchClips}
            disabled={isLoading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Clips
          </Button>
          {clips.length > 0 && (
            <span className="text-muted-foreground text-sm">
              Showing {clips.length} clips
            </span>
          )}
        </div>

        {/* Clips Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Scraping Artlist for motion graphics...</p>
            <p className="text-muted-foreground/60 text-sm mt-2">This may take a few seconds</p>
          </div>
        ) : clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Sparkles className="w-16 h-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No clips found</h3>
            <p className="text-muted-foreground mb-4">Try a different category or search term</p>
            <Button onClick={fetchClips}>Try Again</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-32">
            {clips.map((clip) => {
              const isSelected = selectedClips.some(c => c.id === clip.id);
              const hasNote = selectedClips.find(c => c.id === clip.id)?.note;
              const hasImageError = imageErrors.has(clip.id);

              return (
                <div
                  key={clip.id}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                    isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]' : 'hover:scale-[1.02]'
                  }`}
                  onClick={() => toggleClipSelection(clip)}
                >
                  {/* Gradient Background based on category */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[selectedCategory] || categoryGradients['abstract']} opacity-60`} />
                  
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-secondary/30">
                    {!hasImageError ? (
                      <img
                        src={clip.thumbnail}
                        alt={clip.title}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(clip.id)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                        <Sparkles className="w-12 h-12 text-primary/50" />
                      </div>
                    )}

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center glow-purple">
                        <Check className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}

                    {/* Note Indicator */}
                    {hasNote && (
                      <div className="absolute top-3 left-3 w-8 h-8 bg-success rounded-full flex items-center justify-center glow-green">
                        <FileText className="w-4 h-4 text-success-foreground" />
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => openPreview(clip, e)}
                        className="w-14 h-14 bg-background/90 rounded-full flex items-center justify-center hover:bg-background transition-colors shadow-lg"
                      >
                        <Play className="w-7 h-7 text-primary ml-1" />
                      </button>
                    </div>

                    {/* External Link */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openArtlistLink(clip.sourceUrl);
                      }}
                      className="absolute bottom-3 right-3 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                    >
                      <ExternalLink className="w-4 h-4 text-foreground" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="relative p-4 glass">
                    <h3 className="font-semibold text-foreground truncate mb-2">{clip.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Monitor className="w-4 h-4" />
                        {clip.resolution}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
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

      {/* Selection Bar */}
      {selectedClips.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center glow-purple">
                  <span className="text-xl font-bold text-primary">{selectedClips.length}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Clips Selected</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedClips.filter(c => c.note).length} with notes
                  </p>
                </div>
              </div>

              {/* Selected Thumbnails */}
              <div className="hidden md:flex items-center gap-2 overflow-x-auto max-w-md">
                {selectedClips.slice(0, 6).map(clip => (
                  <div key={clip.id} className="relative flex-shrink-0">
                    <div className="w-16 h-10 rounded-lg overflow-hidden ring-2 ring-primary">
                      {!imageErrors.has(clip.id) ? (
                        <img src={clip.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-primary/50" />
                        </div>
                      )}
                    </div>
                    {clip.note && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center">
                        <MessageSquare className="w-2.5 h-2.5 text-success-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {selectedClips.length > 6 && (
                  <span className="text-muted-foreground text-sm">+{selectedClips.length - 6}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedClips([])}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
                <Button onClick={sendSelections} className="glow-purple gap-2">
                  <Send className="w-5 h-5" />
                  Send Selections
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl glass-strong">
          <DialogHeader>
            <DialogTitle className="text-2xl">{previewClip?.title}</DialogTitle>
            <DialogDescription>
              {previewClip?.resolution} • {previewClip?.duration}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Preview Info */}
            <div className="aspect-video bg-secondary/30 rounded-xl overflow-hidden flex items-center justify-center">
              <div className="text-center p-8">
                <Sparkles className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Preview available on Artlist</p>
                <Button
                  onClick={() => previewClip && openArtlistLink(previewClip.sourceUrl)}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Artlist
                </Button>
              </div>
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

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowPreviewModal(false)}>
                Cancel
              </Button>
              <Button onClick={addToSelectionFromPreview} className="glow-purple gap-2">
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
