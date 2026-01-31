import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ImageIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CoverImage {
  url: string;
  theme: string;
  prompt: string;
}

interface CoverImageSelectorProps {
  images: CoverImage[];
  selectedImage?: CoverImage | null;
  onSelect: (image: CoverImage) => void;
}

export function CoverImageSelector({ images, selectedImage, onSelect }: CoverImageSelectorProps) {
  const [open, setOpen] = useState(false);

  if (images.length === 0) {
    return null;
  }

  const handleSelect = (image: CoverImage) => {
    onSelect(image);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-tech uppercase tracking-wider"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          {selectedImage ? 'Change Cover' : 'Select Cover Image'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-lg font-tech uppercase tracking-wider text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Select Session Cover Image
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {images.map((image, idx) => {
            const isSelected = selectedImage?.url === image.url;
            return (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleSelect(image)}
                className={cn(
                  "relative group rounded-xl overflow-hidden aspect-video border-2 transition-all",
                  isSelected 
                    ? "border-amber-500 ring-2 ring-amber-500/30" 
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

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                    <Check className="w-5 h-5 text-black" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Preview section */}
        {selectedImage && (
          <div className="mt-6 pt-4 border-t border-zinc-700">
            <p className="text-xs font-tech uppercase tracking-wider text-zinc-500 mb-2">Selected Cover Preview</p>
            <div className="relative rounded-xl overflow-hidden aspect-[21/9] border border-amber-500/30">
              <img
                src={selectedImage.url}
                alt={selectedImage.theme}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3">
                <span className="text-xs font-tech uppercase tracking-wider text-amber-400 bg-black/60 px-2 py-1 rounded">{selectedImage.theme}</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Mini preview for displaying selected cover in session card
export function CoverImagePreview({ image, onClick }: { image: CoverImage; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative w-full aspect-[21/9] rounded-lg overflow-hidden border border-zinc-700 hover:border-amber-500/50 transition-colors group"
    >
      <img
        src={image.url}
        alt={image.theme}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="text-[10px] font-tech uppercase tracking-wider text-amber-400 bg-black/60 px-2 py-0.5 rounded">
          {image.theme}
        </span>
        <span className="text-[10px] font-tech text-zinc-400 bg-black/60 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          Click to change
        </span>
      </div>
    </button>
  );
}