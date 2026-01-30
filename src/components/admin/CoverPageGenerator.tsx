import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CoverImage {
  url: string;
  theme: string;
  prompt: string;
}

interface StrategicBrief {
  headline: string;
  executiveSummary: string;
  keyObjectives: string[];
  creativeDirection: {
    theme: string;
    description: string;
    visualKeywords: string[];
  };
  technicalRequirements: string[];
  timeline: {
    phase: string;
    description: string;
  }[];
  actionItems: string[];
  imagePrompts: string[];
}

interface CoverPageGeneratorProps {
  sessionId: string;
  projectName: string;
  clientName: string;
  circlebackUrl?: string | null;
  circlebackSummary?: string | null;
  creativeNotes?: string | null;
  technicalNotes?: string | null;
  existingImages?: CoverImage[] | null;
  onImagesGenerated?: (images: CoverImage[]) => void;
  onBriefGenerated?: (brief: StrategicBrief | null) => void;
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

  // Check if we have Creative Director notes to generate from
  const hasCreativeNotes = !!creativeNotes?.trim();
  const hasAnyContent = hasCreativeNotes || !!circlebackSummary || !!technicalNotes;

  // Generate images from Creative Director notes
  const generateCoverImages = async () => {
    if (!hasAnyContent) {
      toast.error('Add Creative Director notes to generate themed images');
      return;
    }

    setIsGenerating(true);
    toast.info('Generating cover images from Creative Director notes...');

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
    <div className="space-y-3">
      {/* Primary Action: Generate from Creative Director Notes */}
      <Button
        onClick={generateCoverImages}
        disabled={isGenerating || !hasAnyContent}
        className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 hover:from-purple-500 hover:via-pink-400 hover:to-cyan-400 text-white font-tech uppercase tracking-wider h-12 touch-manipulation shadow-lg shadow-purple-500/20 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating from Creative Notes...
          </>
        ) : images.length > 0 ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Cover Images
          </>
        ) : (
          <>
            <Palette className="h-4 w-4 mr-2" />
            Generate Cover Images
          </>
        )}
      </Button>

      {/* Loading State */}
      {isGenerating && (
        <div className="border border-purple-500/30 bg-purple-500/5 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
              <Sparkles className="h-4 w-4 text-purple-400 absolute inset-0 m-auto" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-tech text-purple-300 uppercase tracking-wider">
                AI Image Generation
              </p>
              <p className="text-xs font-tech text-zinc-500">
                Reading Creative Director notes • Generating themed visuals
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !isGenerating && !hasCreativeNotes && (
        <div className="border border-dashed border-zinc-700 rounded-lg p-4 text-center">
          <Palette className="h-6 w-6 mx-auto text-zinc-600 mb-2" />
          <p className="text-xs font-tech text-zinc-500 uppercase tracking-wider">
            Add Creative Director notes to generate cover images
          </p>
        </div>
      )}
    </div>
  );
}
