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

      {/* Search and Select All */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <button
          type="button"
          onClick={toggleAll}
          className="h-11 px-4 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors whitespace-nowrap"
        >
          {allFilteredSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Selection Count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {filteredSelectedCount} of {filteredClips.length} selected
        </span>
        {selectedClipIds.length > 0 && (
          <span className="text-primary font-medium">
            {selectedClipIds.length} total
          </span>
        )}
      </div>

      {/* Clip Grid - Optimized for mobile */}
      <ScrollArea className={isMobile ? "h-[50vh]" : "h-[320px]"}>
        <div className={`
          grid gap-2 p-1
          ${isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}
        `}>
          {filteredClips.map((clip) => {
            const isSelected = selectedClipIds.includes(clip.id);
            const category = artlistCategories.find(c => c.key === clip.category);
            
            return (
              <button
                key={clip.id}
                type="button"
                onClick={() => toggleClip(clip.id)}
                className={`
                  relative group rounded-xl overflow-hidden border-2 transition-all touch-manipulation
                  ${isSelected 
                    ? 'border-primary ring-2 ring-primary/30 scale-[0.98]' 
                    : 'border-transparent hover:border-border active:scale-[0.98]'
                  }
                `}
              >
                {/* Thumbnail */}
                <div className={`
                  bg-secondary/50 relative
                  ${isMobile ? 'aspect-[4/3]' : 'aspect-video'}
                `}>
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
                  
                  {/* Selection Checkmark */}
                  <div className={`
                    absolute top-2 right-2 w-6 h-6 rounded-full border-2 
                    flex items-center justify-center transition-all
                    ${isSelected 
                      ? 'bg-primary border-primary shadow-lg' 
                      : 'bg-background/90 border-muted-foreground/40'
                    }
                  `}>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                    )}
                  </div>

                  {/* Category Badge */}
                  {category && (
                    <div 
                      className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm"
                      style={{ 
                        backgroundColor: `${category.color}30`,
                        color: category.color
                      }}
                    >
                      {category.label}
                    </div>
                  )}
                </div>
                
                {/* Title */}
                <div className={`
                  p-2 bg-card/95 backdrop-blur-sm
                  ${isMobile ? 'py-2.5' : 'py-1.5'}
                `}>
                  <p className={`
                    font-medium truncate
                    ${isMobile ? 'text-sm' : 'text-xs'}
                  `}>
                    {clip.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {filteredClips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Video className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">No clips found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}