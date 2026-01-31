import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ImageIcon, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface CoverImage {
  url: string;
  theme: string;
  prompt: string;
}

interface FeaturedImageSelectorProps {
  images: CoverImage[];
  featuredImages: CoverImage[];
  onSelect: (images: CoverImage[]) => void;
  maxSelection?: number;
}

export function FeaturedImageSelector({ 
  images, 
  featuredImages, 
  onSelect,
  maxSelection = 3 
}: FeaturedImageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CoverImage[]>(featuredImages);

  // Sync with prop changes
  useEffect(() => {
    setSelected(featuredImages);
  }, [featuredImages]);

  if (images.length === 0) {
    return null;
  }

  const handleToggle = (image: CoverImage) => {
    const isSelected = selected.some(img => img.url === image.url);
    
    if (isSelected) {
      setSelected(selected.filter(img => img.url !== image.url));
    } else if (selected.length < maxSelection) {
      setSelected([...selected, image]);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    setOpen(false);
  };

  const handleClear = () => {
    setSelected([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-pink-500/30 text-pink-400 hover:bg-pink-500/10 font-tech uppercase tracking-wider"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          {featuredImages.length > 0 
            ? `${featuredImages.length} Featured Image${featuredImages.length > 1 ? 's' : ''}`
            : 'Select Editorial Images'
          }
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-lg font-tech uppercase tracking-wider text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-400" />
            Select Images for Editorial Summary
          </DialogTitle>
        </DialogHeader>
        
        <p className="text-sm text-zinc-400 font-tech -mt-2">
          Choose up to {maxSelection} images to feature in the technical briefing editorial
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {images.map((image, idx) => {
            const isSelected = selected.some(img => img.url === image.url);
            const selectionIndex = selected.findIndex(img => img.url === image.url);
            
            return (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleToggle(image)}
                disabled={!isSelected && selected.length >= maxSelection}
                className={cn(
                  "relative group rounded-xl overflow-hidden aspect-video border-2 transition-all",
                  isSelected 
                    ? "border-pink-500 ring-2 ring-pink-500/30" 
                    : selected.length >= maxSelection
                      ? "border-zinc-800 opacity-40 cursor-not-allowed"
                      : "border-zinc-700 hover:border-zinc-500"
                )}
              >
                <img
                  src={image.url}
                  alt={image.theme}
                  className="w-full h-full object-cover"
                />
                
                {/* Theme label - minimal, no overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <span className="text-[10px] font-tech uppercase tracking-wider text-white bg-black/60 px-2 py-0.5 rounded">
                    {image.theme}
                  </span>
                </div>

                {/* Selection indicator */}
                <div className={cn(
                  "absolute top-3 left-3 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                  isSelected 
                    ? "bg-pink-500 border-pink-500" 
                    : "bg-black/50 border-zinc-500 group-hover:border-pink-400"
                )}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>

                {/* Selection order badge */}
                {isSelected && selectionIndex >= 0 && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-pink-500 text-white font-tech text-xs px-2">
                      {selectionIndex + 1}
                    </Badge>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Selected preview strip */}
        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-zinc-700"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-tech uppercase tracking-widest text-pink-400">
                  Selected ({selected.length}/{maxSelection})
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-zinc-500 hover:text-red-400 h-7 text-xs font-tech"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {selected.map((image, idx) => (
                  <div
                    key={image.url}
                    className="relative shrink-0 w-32 aspect-video rounded-lg overflow-hidden border border-pink-500/30"
                  >
                    <img
                      src={image.url}
                      alt={image.theme}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-1 left-1 bg-pink-500 text-white font-tech text-[10px] px-1.5 py-0">
                      {idx + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="font-tech uppercase tracking-wider border-zinc-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 font-tech uppercase tracking-wider"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirm Selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact preview for session card showing featured images
export function FeaturedImagesPreview({ images }: { images: CoverImage[] }) {
  if (images.length === 0) return null;

  return (
    <div className="flex gap-2 mt-2">
      {images.slice(0, 3).map((image, idx) => (
        <div
          key={image.url}
          className="relative w-16 h-10 rounded-md overflow-hidden border border-pink-500/30"
        >
          <img
            src={image.url}
            alt={image.theme}
            className="w-full h-full object-cover"
          />
          <Badge className="absolute bottom-0.5 left-1 bg-pink-500/80 text-white font-tech text-[8px] px-1 py-0">
            {idx + 1}
          </Badge>
        </div>
      ))}
    </div>
  );
}
