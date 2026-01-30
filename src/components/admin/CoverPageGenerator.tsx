import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw, Brain, FileText } from 'lucide-react';
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
  circlebackUrl,
  circlebackSummary,
  creativeNotes,
  technicalNotes,
  existingImages,
  onImagesGenerated,
  onBriefGenerated,
}: CoverPageGeneratorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<CoverImage[]>(existingImages || []);

  // Check if we have a Circleback URL to analyze
  const hasCirclebackUrl = !!circlebackUrl?.trim();
  const hasExistingBrief = !!circlebackSummary;

  // Analyze Circleback URL with Perplexity
  const analyzeCircleback = async () => {
    if (!circlebackUrl) {
      toast.error('No Circleback URL to analyze');
      return;
    }

    setIsAnalyzing(true);
    toast.info('Analyzing call recording with Perplexity AI...', {
      description: 'This may take 30-60 seconds'
    });

    try {
      const { data, error } = await supabase.functions.invoke('analyze-circleback', {
        body: {
          sessionId,
          circlebackUrl,
          projectName,
          clientName,
        },
      });

      if (error) throw error;

      if (data.success) {
        if (data.images && data.images.length > 0) {
          setImages(data.images);
          onImagesGenerated?.(data.images);
        }
        if (data.brief) {
          onBriefGenerated?.(data.brief);
        }
        toast.success('Strategic brief generated!', {
          description: `${data.images?.length || 0} cover images created`
        });
      } else {
        toast.error(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Error analyzing Circleback:', err);
      toast.error('Failed to analyze call recording');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fallback: Generate images from existing notes (old method)
  const generateCoverImages = async () => {
    if (!circlebackSummary && !creativeNotes && !technicalNotes) {
      toast.error('Add call summary or notes to generate themed images');
      return;
    }

    setIsGenerating(true);
    toast.info('Generating cover images...');

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

  const isLoading = isAnalyzing || isGenerating;

  return (
    <div className="space-y-3">
      {/* Primary Action: Analyze Circleback URL */}
      {hasCirclebackUrl && (
        <Button
          onClick={analyzeCircleback}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 hover:from-purple-500 hover:via-pink-400 hover:to-cyan-400 text-white font-tech uppercase tracking-wider h-12 touch-manipulation shadow-lg shadow-purple-500/20"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Call with Perplexity...
            </>
          ) : hasExistingBrief ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-analyze Call Recording
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Analyze Call & Generate Brief
            </>
          )}
        </Button>
      )}

      {/* Secondary Action: Generate from Notes (when no URL) */}
      {!hasCirclebackUrl && (
        <Button
          onClick={generateCoverImages}
          disabled={isLoading}
          variant="outline"
          className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white font-tech uppercase tracking-wider h-10 touch-manipulation"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : images.length > 0 ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate from Notes
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate from Notes
            </>
          )}
        </Button>
      )}

      {/* Fallback option when URL exists */}
      {hasCirclebackUrl && (circlebackSummary || creativeNotes || technicalNotes) && (
        <Button
          onClick={generateCoverImages}
          disabled={isLoading}
          variant="ghost"
          size="sm"
          className="w-full text-zinc-500 hover:text-zinc-300 font-tech text-xs uppercase tracking-wider"
        >
          <FileText className="h-3 w-3 mr-1.5" />
          Or generate from existing notes only
        </Button>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="border border-purple-500/30 bg-purple-500/5 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
              <Brain className="h-4 w-4 text-purple-400 absolute inset-0 m-auto" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-tech text-purple-300 uppercase tracking-wider">
                Perplexity Analysis
              </p>
              <p className="text-xs font-tech text-zinc-500">
                Reading call transcript • Extracting insights • Generating visuals
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !isLoading && !hasCirclebackUrl && (
        <div className="border border-dashed border-zinc-700 rounded-lg p-4 text-center">
          <Sparkles className="h-6 w-6 mx-auto text-zinc-600 mb-2" />
          <p className="text-xs font-tech text-zinc-500 uppercase tracking-wider">
            {hasCirclebackUrl 
              ? 'Analyze Circleback URL to generate strategic brief'
              : 'Add notes to generate cover images'
            }
          </p>
        </div>
      )}
    </div>
  );
}
