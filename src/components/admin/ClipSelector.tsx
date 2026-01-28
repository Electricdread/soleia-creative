import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Video, Check } from 'lucide-react';
import { artlistCategories } from '@/lib/api/artlist';
import { useIsMobile } from '@/hooks/use-mobile';

interface Clip {
  id: string;
  title: string;
  thumbnail: string | null;
  category: string;
}

interface ClipSelectorProps {
  selectedClipIds: string[];
  onSelectionChange: (clipIds: string[]) => void;
}

export function ClipSelector({ selectedClipIds, onSelectionChange }: ClipSelectorProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchClips = async () => {
      setIsLoading(true);
      let query = supabase
        .from('cached_clips')
        .select('id, title, thumbnail, category')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (!error && data) {
        setClips(data);
      }
      setIsLoading(false);
    };

    fetchClips();
  }, [selectedCategory]);

  const toggleClip = (clipId: string) => {
    if (selectedClipIds.includes(clipId)) {
      onSelectionChange(selectedClipIds.filter(id => id !== clipId));
    } else {
      onSelectionChange([...selectedClipIds, clipId]);
    }
  };

  const toggleAll = () => {
    const filteredClipIds = filteredClips.map(c => c.id);
    const allSelected = filteredClipIds.every(id => selectedClipIds.includes(id));
    
    if (allSelected) {
      // Remove all filtered clips from selection
      onSelectionChange(selectedClipIds.filter(id => !filteredClipIds.includes(id)));
    } else {
      // Add all filtered clips to selection
      const newSelection = [...new Set([...selectedClipIds, ...filteredClipIds])];
      onSelectionChange(newSelection);
    }
  };

  const filteredClips = clips.filter(clip =>
    clip.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSelectedCount = filteredClips.filter(c => selectedClipIds.includes(c.id)).length;
  const allFilteredSelected = filteredClips.length > 0 && filteredSelectedCount === filteredClips.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Category Pills - Horizontal Scroll */}
      <div className="overflow-x-auto -mx-1 px-1 pb-2">
        <div className="flex gap-2 min-w-max">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
              ${selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
              }
            `}
          >
            All
          </button>
          {artlistCategories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5
                ${selectedCategory === cat.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                }
              `}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clips..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Selection Controls */}
      <div className="flex items-center justify-between gap-2 py-2 border-y border-border/30">
        <span className="text-sm text-muted-foreground">
          {selectedClipIds.length} selected
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
          >
            {allFilteredSelected ? 'Deselect All' : 'Select All'}
          </button>
          {selectedClipIds.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectionChange([])}
              className="px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Clip Grid - Square thumbnails */}
      <ScrollArea className={isMobile ? "h-[50vh]" : "h-[300px]"}>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5 p-1">
          {filteredClips.map((clip) => {
            const isSelected = selectedClipIds.includes(clip.id);
            const category = artlistCategories.find(c => c.key === clip.category);
            
            return (
              <button
                key={clip.id}
                type="button"
                onClick={() => toggleClip(clip.id)}
                className={`
                  relative rounded-md overflow-hidden border-2 transition-all touch-manipulation
                  aspect-square
                  ${isSelected 
                    ? 'border-primary ring-1 ring-primary/30' 
                    : 'border-transparent hover:border-border/50'
                  }
                `}
              >
                {clip.thumbnail ? (
                  <img
                    src={clip.thumbnail}
                    alt={clip.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
                    <Video className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                
                {/* Selection Checkmark */}
                <div className={`
                  absolute top-0.5 right-0.5 w-4 h-4 rounded-full border 
                  flex items-center justify-center transition-all
                  ${isSelected 
                    ? 'bg-primary border-primary' 
                    : 'bg-background/70 border-muted-foreground/40'
                  }
                `}>
                  {isSelected && (
                    <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
                  )}
                </div>

                {/* Category dot */}
                {category && (
                  <div 
                    className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {filteredClips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Video className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">No clips found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}