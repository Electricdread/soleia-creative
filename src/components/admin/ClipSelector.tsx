import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Video } from 'lucide-react';

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

  useEffect(() => {
    const fetchClips = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cached_clips')
        .select('id, title, thumbnail, category')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        setClips(data);
      }
      setIsLoading(false);
    };

    fetchClips();
  }, []);

  const toggleClip = (clipId: string) => {
    if (selectedClipIds.includes(clipId)) {
      onSelectionChange(selectedClipIds.filter(id => id !== clipId));
    } else {
      onSelectionChange([...selectedClipIds, clipId]);
    }
  };

  const toggleAll = () => {
    if (selectedClipIds.length === clips.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(clips.map(c => c.id));
    }
  };

  const filteredClips = clips.filter(clip =>
    clip.title.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <button
          type="button"
          onClick={toggleAll}
          className="text-sm text-primary hover:underline whitespace-nowrap"
        >
          {selectedClipIds.length === clips.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="text-sm text-muted-foreground">
        {selectedClipIds.length} of {clips.length} clips selected
      </div>

      <ScrollArea className="h-[280px] rounded-lg border border-border/50 bg-secondary/20">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
          {filteredClips.map((clip) => {
            const isSelected = selectedClipIds.includes(clip.id);
            return (
              <button
                key={clip.id}
                type="button"
                onClick={() => toggleClip(clip.id)}
                className={`
                  relative group rounded-lg overflow-hidden border-2 transition-all
                  ${isSelected 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'border-transparent hover:border-border'
                  }
                `}
              >
                <div className="aspect-video bg-secondary/50 relative">
                  {clip.thumbnail ? (
                    <img
                      src={clip.thumbnail}
                      alt={clip.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Selection indicator */}
                  <div className={`
                    absolute top-1.5 right-1.5 w-5 h-5 rounded-full border-2 
                    flex items-center justify-center transition-all
                    ${isSelected 
                      ? 'bg-primary border-primary' 
                      : 'bg-background/80 border-muted-foreground/50'
                    }
                  `}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12">
                        <path 
                          fill="currentColor" 
                          d="M10.28 2.28a.75.75 0 0 1 0 1.06l-5.5 5.5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 0 1 1.06-1.06L4.25 7.22l4.97-4.94a.75.75 0 0 1 1.06 0Z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                
                <div className="p-1.5 bg-background/80">
                  <p className="text-xs font-medium truncate">{clip.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
