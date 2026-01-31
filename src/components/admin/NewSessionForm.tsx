import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Loader2, Sparkles, CheckCircle2, Palette } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

interface CoverImage {
  url: string;
  theme: string;
  prompt: string;
}

interface NewSessionFormProps {
  onSessionCreated: () => void;
  onCancel: () => void;
}

export function NewSessionForm({ onSessionCreated, onCancel }: NewSessionFormProps) {
  const [creating, setCreating] = useState(false);
  const [generatingCovers, setGeneratingCovers] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [coverImages, setCoverImages] = useState<CoverImage[]>([]);
  const [selectedCover, setSelectedCover] = useState<CoverImage | null>(null);
  
  // Form state
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [circlebackUrl, setCirclebackUrl] = useState('');
  const [circlebackSummary, setCirclebackSummary] = useState('');
  const [technicalNotes, setTechnicalNotes] = useState('');
  const [creativeNotes, setCreativeNotes] = useState('');

  const generateToken = () => {
    return `creative-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  };

  const createSession = async () => {
    if (!projectName.trim() || !clientName.trim()) {
      toast.error('Project name and client name are required');
      return;
    }

    setCreating(true);
    const token = generateToken();

    const { data, error } = await supabase.from('creative_sessions').insert({
      token,
      project_name: projectName.trim(),
      client_name: clientName.trim(),
      circleback_url: circlebackUrl.trim() || null,
      circleback_summary: circlebackSummary.trim() || null,
      technical_notes: technicalNotes.trim() || null,
      creative_notes: creativeNotes.trim() || null,
    }).select('id').single();

    if (error) {
      toast.error('Failed to create session');
      console.error(error);
      setCreating(false);
    } else {
      toast.success('Creative session created!');
      setSessionId(data.id);
      setCreating(false);
      
      // Auto-generate covers if we have creative notes
      if (creativeNotes.trim() || circlebackSummary.trim() || technicalNotes.trim()) {
        generateCoverImages(data.id);
      }
    }
  };

  const generateCoverImages = async (id: string) => {
    setGeneratingCovers(true);
    toast.info('Generating cover images...');

    try {
      const { data, error } = await supabase.functions.invoke('generate-cover-images', {
        body: {
          sessionId: id,
          circleback_summary: circlebackSummary,
          project_name: projectName,
          client_name: clientName,
          creative_notes: creativeNotes,
          technical_notes: technicalNotes,
        },
      });

      if (error) throw error;

      if (data.images && data.images.length > 0) {
        setCoverImages(data.images);
        toast.success(`Generated ${data.images.length} cover images`);
      } else {
        toast.error('No images were generated');
      }
    } catch (err) {
      console.error('Error generating cover images:', err);
      toast.error('Failed to generate cover images');
    } finally {
      setGeneratingCovers(false);
    }
  };

  const selectCoverImage = async (image: CoverImage) => {
    if (!sessionId) return;
    
    setSelectedCover(image);
    
    // Reorder so selected is first
    const reorderedImages = [image, ...coverImages.filter(img => img.url !== image.url)];
    
    const { error } = await supabase
      .from('creative_sessions')
      .update({ cover_images: reorderedImages as unknown as Json })
      .eq('id', sessionId);

    if (error) {
      toast.error('Failed to save cover selection');
    } else {
      toast.success('Cover image selected');
    }
  };

  const finishAndClose = () => {
    onSessionCreated();
  };

  const hasContent = creativeNotes.trim() || circlebackSummary.trim() || technicalNotes.trim();

  return (
    <Card className="border-cyan-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-cyan-950/20 shadow-2xl shadow-cyan-500/5">
      {/* Accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
      
      <CardHeader className="pb-4 border-b border-zinc-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-tech font-bold uppercase tracking-wider text-white">
              {sessionId ? 'Session Created' : 'New Creative Session'}
            </CardTitle>
            <CardDescription className="text-zinc-500 text-xs font-tech tracking-widest uppercase">
              {sessionId ? 'Generate Cover Art & Finalize' : 'Configure Creative Workspace'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {!sessionId ? (
          // Form fields
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-xs font-tech uppercase tracking-widest text-cyan-400">
                  Project Name *
                </Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Soleia Grand Opening"
                  className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-cyan-500/20 font-tech h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-xs font-tech uppercase tracking-widest text-purple-400">
                  Client Name *
                </Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-purple-500 focus:ring-purple-500/20 font-tech h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="circlebackUrl" className="text-xs font-tech uppercase tracking-widest text-emerald-400">
                Circleback Call URL
              </Label>
              <Input
                id="circlebackUrl"
                value={circlebackUrl}
                onChange={(e) => setCirclebackUrl(e.target.value)}
                placeholder="https://app.circleback.ai/view/..."
                className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500/20 font-tech text-sm h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="circlebackSummary" className="text-xs font-tech uppercase tracking-widest text-amber-400">
                Call Transcript / Summary
              </Label>
              <Textarea
                id="circlebackSummary"
                value={circlebackSummary}
                onChange={(e) => setCirclebackSummary(e.target.value)}
                placeholder="Paste the call transcript or AI summary..."
                rows={3}
                className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20 font-tech"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="technicalNotes" className="text-xs font-tech uppercase tracking-widest text-blue-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Technical Notes
                </Label>
                <Textarea
                  id="technicalNotes"
                  value={technicalNotes}
                  onChange={(e) => setTechnicalNotes(e.target.value)}
                  placeholder="Resolution requirements, file formats..."
                  rows={3}
                  className="bg-blue-950/20 border-blue-500/30 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20 font-tech"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creativeNotes" className="text-xs font-tech uppercase tracking-widest text-pink-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-500" />
                  Creative Notes (for AI covers)
                </Label>
                <Textarea
                  id="creativeNotes"
                  value={creativeNotes}
                  onChange={(e) => setCreativeNotes(e.target.value)}
                  placeholder="Brand colors, mood, style direction..."
                  rows={3}
                  className="bg-pink-950/20 border-pink-500/30 text-white placeholder:text-zinc-600 focus:border-pink-500 focus:ring-pink-500/20 font-tech"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-zinc-700/50">
              <Button 
                onClick={createSession} 
                disabled={creating || !projectName.trim() || !clientName.trim()}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 font-tech uppercase tracking-wider h-11 touch-manipulation"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Session
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="border-zinc-600 text-zinc-400 hover:bg-zinc-800 hover:text-white font-tech uppercase tracking-wider h-11 touch-manipulation"
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          // Cover generation view
          <>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-sm font-tech text-emerald-300 uppercase tracking-wider">
                  Session Created: {projectName}
                </p>
                <p className="text-xs font-tech text-zinc-500">
                  Client: {clientName}
                </p>
              </div>
            </div>

            {/* Cover Image Generation */}
            {generatingCovers ? (
              <div className="border border-purple-500/30 bg-purple-500/5 rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                    <Sparkles className="h-5 w-5 text-purple-400 absolute inset-0 m-auto" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-tech text-purple-300 uppercase tracking-wider">
                      AI Image Generation
                    </p>
                    <p className="text-xs font-tech text-zinc-500">
                      Creating themed visuals from your notes...
                    </p>
                  </div>
                </div>
              </div>
            ) : coverImages.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-tech uppercase tracking-widest text-purple-400">
                    Select Cover Image ({coverImages.length} generated)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {coverImages.map((image, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectCoverImage(image)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        selectedCover?.url === image.url 
                          ? 'border-cyan-500 ring-2 ring-cyan-500/30' 
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <img 
                        src={image.url} 
                        alt={image.theme}
                        className="w-full h-full object-cover"
                      />
                      {selectedCover?.url === image.url && (
                        <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                          <CheckCircle2 className="h-8 w-8 text-cyan-400" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="text-[10px] font-tech text-white uppercase tracking-wider">
                          {image.theme}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : hasContent ? (
              <Button
                onClick={() => sessionId && generateCoverImages(sessionId)}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 hover:from-purple-500 hover:via-pink-400 hover:to-cyan-400 text-white font-tech uppercase tracking-wider h-12 touch-manipulation shadow-lg shadow-purple-500/20"
              >
                <Palette className="h-4 w-4 mr-2" />
                Generate Cover Images
              </Button>
            ) : (
              <div className="border border-dashed border-zinc-700 rounded-lg p-6 text-center">
                <Palette className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
                <p className="text-xs font-tech text-zinc-500 uppercase tracking-wider">
                  No creative notes provided - add notes to enable cover generation
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-3 border-t border-zinc-700/50">
              <Button 
                onClick={finishAndClose}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 font-tech uppercase tracking-wider h-11 touch-manipulation"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Done
              </Button>
              {sessionId && hasContent && coverImages.length === 0 && !generatingCovers && (
                <Button 
                  variant="outline"
                  onClick={() => sessionId && generateCoverImages(sessionId)}
                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-tech uppercase tracking-wider h-11"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Covers
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
