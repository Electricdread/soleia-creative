import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Video, Eye, ChevronLeft, Loader2 } from 'lucide-react';
import { artlistCategories } from '@/lib/api/artlist';
import { useIsMobile } from '@/hooks/use-mobile';

interface Clip {
  id: string;
  title: string;
  thumbnail: string | null;
  category: string;
  video_url: string | null;
}

interface ClipSelectionPreviewProps {
  selectedClipIds: string[];
  onRemoveClip: (clipId: string) => void;
  onBack: () => void;
}

export function ClipSelectionPreview({ 
  selectedClipIds, 
  onRemoveClip, 
  onBack 
}: ClipSelectionPreviewProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewingClip, setPreviewingClip] = useState<Clip | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchClips = async () => {
      if (selectedClipIds.length === 0) {
        setClips([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('cached_clips')
        .select('id, title, thumbnail, category, video_url')
        .in('id', selectedClipIds);

      if (!error && data) {
        // Sort by the order they were selected
        const sortedClips = selectedClipIds
          .map(id => data.find(c => c.id === id))
          .filter(Boolean) as Clip[];
        setClips(sortedClips);
      }
      setIsLoading(false);
    };

    fetchClips();
  }, [selectedClipIds]);

  const getCategoryInfo = (key: string) => {
    return artlistCategories.find(c => c.key === key);
  };

  // Group clips by category
  const clipsByCategory = clips.reduce((acc, clip) => {
    const cat = clip.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(clip);
    return acc;
  }, {} as Record<string, Clip[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="text-center py-8">
        <Video className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">No clips selected yet</p>
        <Button variant="outline" onClick={onBack} className="mt-4 gap-2">
          <ChevronLeft className="w-4 h-4" />
          Go back to select clips
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
          <ChevronLeft className="w-4 h-4" />
          Back to Selection
        </Button>
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            Preview ({clips.length} clips)
          </span>
        </div>
      </div>

      {/* Clips organized by category */}
      <ScrollArea className={isMobile ? "h-[55vh]" : "h-[380px]"}>
        <div className="space-y-6 pr-2">
          {Object.entries(clipsByCategory).map(([category, categoryClips]) => {
            const catInfo = getCategoryInfo(category);
            return (
              <div key={category}>
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: catInfo?.color || '#888' }}
                  />
                  <span className="text-sm font-medium">{catInfo?.label || category}</span>
                  <span className="text-xs text-muted-foreground">
                    ({categoryClips.length})
                  </span>
                </div>

                {/* Clips Grid */}
                <div className={`
                  grid gap-3
                  ${isMobile ? 'grid-cols-2' : 'grid-cols-3 sm:grid-cols-4'}
                `}>
                  {categoryClips.map((clip) => (
                    <div
                      key={clip.id}
                      className="relative group rounded-xl overflow-hidden border border-border/50 bg-card transition-all hover:border-primary/30"
                    >
                      {/* Thumbnail */}
                      <div 
                        className="aspect-video bg-secondary/50 cursor-pointer"
                        onClick={() => setPreviewingClip(clip)}
                      >
                        {clip.thumbnail ? (
                          <img
                            src={clip.thumbnail}
                            alt={clip.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}

                        {/* Play indicator on hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => onRemoveClip(clip.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:scale-110 touch-manipulation"
                        style={{ opacity: isMobile ? 1 : undefined }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Title */}
                      <div className="p-2 bg-card">
                        <p className="text-xs font-medium truncate">{clip.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Summary Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          {Object.keys(clipsByCategory).length} categories • {clips.length} total clips
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            clips.forEach(c => onRemoveClip(c.id));
          }}
          className="text-destructive hover:bg-destructive/10"
        >
          Clear All
        </Button>
      </div>

      {/* Video Preview Modal */}
      {previewingClip && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewingClip(null)}
        >
          <div 
            className="relative w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setPreviewingClip(null)}
            >
              <X className="w-5 h-5" />
            </Button>

            {previewingClip.video_url ? (
              <video
                src={previewingClip.video_url}
                controls
                autoPlay
                className="w-full rounded-lg"
              />
            ) : previewingClip.thumbnail ? (
              <img
                src={previewingClip.thumbnail}
                alt={previewingClip.title}
                className="w-full rounded-lg"
              />
            ) : (
              <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
                <Video className="w-16 h-16 text-muted-foreground" />
              </div>
            )}

            <p className="text-center text-white mt-4 font-medium">
              {previewingClip.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
