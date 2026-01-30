import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Image, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CoverImage {
  url: string;
  theme: string;
  prompt: string;
}

interface CoverPageGeneratorProps {
  sessionId: string;
  projectName: string;
  clientName: string;
  circlebackSummary?: string | null;
  creativeNotes?: string | null;
  technicalNotes?: string | null;
  existingImages?: CoverImage[] | null;
  onImagesGenerated?: (images: CoverImage[]) => void;
}

export function CoverPageGenerator({
  sessionId,
  projectName,
  clientName,
  circlebackSummary,
  creativeNotes,
  technicalNotes,
  existingImages,
  onImagesGenerated,
}: CoverPageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<CoverImage[]>(existingImages || []);

  const generateCoverImages = async () => {
    if (!circlebackSummary && !creativeNotes && !technicalNotes) {
      toast.error('Add call summary or notes to generate themed images');
      return;
    }

    setIsGenerating(true);
    toast.info('Analyzing themes and generating images...');

    try {
      const { data, error } = await supabase.functions.invoke('generate-cover-images', {
        body: {
          sessionId,
          circleback_summary: circlebackSummary,
          project_name: projectName,
          client_name: clientName,
          creative_notes: creativeNotes,
          technical_notes: technicalNotes,
        },
      });

      if (error) throw error;

      if (data.images && data.images.length > 0) {
        setImages(data.images);
        onImagesGenerated?.(data.images);
        toast.success(`Generated ${data.images.length} cover images`);
      } else {
        toast.error('No images were generated');
      }
    } catch (err) {
      console.error('Error generating cover images:', err);
      toast.error('Failed to generate cover images');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      <Button
        onClick={generateCoverImages}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 hover:from-purple-500 hover:via-pink-400 hover:to-cyan-400 text-white font-tech uppercase tracking-wider h-12 touch-manipulation"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating AI Cover...
          </>
        ) : images.length > 0 ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Cover Images
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate AI Cover Images
          </>
        )}
      </Button>

      {/* Generated Images Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-tech uppercase tracking-widest text-cyan-400">
            <Image className="h-3.5 w-3.5" />
            AI-Generated Cover Themes
          </div>
          
          {/* Strategic Layout: 1 large + 2 smaller */}
          <div className="grid grid-cols-2 gap-2">
            {/* Main Hero Image */}
            {images[0] && (
              <div className="col-span-2 relative group">
                <div className="aspect-[21/9] rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
                  <img
                    src={images[0].url}
                    alt={images[0].theme}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <span className="text-[10px] font-tech uppercase tracking-widest text-cyan-400">
                      {images[0].theme}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Two smaller images */}
            {images.slice(1, 3).map((img, idx) => (
              <div key={idx} className="relative group">
                <div className="aspect-video rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
                  <img
                    src={img.url}
                    alt={img.theme}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-1.5 left-2 right-2">
                    <span className="text-[9px] font-tech uppercase tracking-widest text-purple-300">
                      {img.theme}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !isGenerating && (
        <div className="border border-dashed border-zinc-700 rounded-lg p-6 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
          <p className="text-xs font-tech text-zinc-500 uppercase tracking-wider">
            AI will analyze call themes to generate cover art
          </p>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="border border-cyan-500/30 bg-cyan-500/5 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
              <Sparkles className="h-5 w-5 text-cyan-400 absolute inset-0 m-auto" />
            </div>
            <div className="text-left">
              <p className="text-sm font-tech text-cyan-300 uppercase tracking-wider">
                Generating Visuals
              </p>
              <p className="text-xs font-tech text-zinc-500">
                Analyzing themes • Creating 3 images
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
