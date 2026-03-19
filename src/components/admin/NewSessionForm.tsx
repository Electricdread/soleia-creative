import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Loader2, Upload, ImageIcon, X } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

interface NewSessionFormProps {
  onSessionCreated: () => void;
  onCancel: () => void;
}

export function NewSessionForm({ onSessionCreated, onCancel }: NewSessionFormProps) {
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateToken = () => {
    return `creative-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const removeCover = () => {
    setCoverFile(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
  };

  const createSession = async () => {
    if (!projectName.trim() || !clientName.trim()) {
      toast.error('Project name and client name are required');
      return;
    }

    setCreating(true);
    const token = generateToken();

    let coverImages: Json | null = null;

    // Upload cover image if provided
    if (coverFile) {
      const ext = coverFile.name.split('.').pop()?.toLowerCase();
      const path = `covers/${token}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('creative-uploads')
        .upload(path, coverFile);

      if (uploadErr) {
        toast.error('Failed to upload cover image');
        setCreating(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('creative-uploads')
        .getPublicUrl(path);

      coverImages = [{ url: urlData.publicUrl, theme: 'cover', prompt: '' }] as unknown as Json;
    }

    const { error } = await supabase.from('creative_sessions').insert({
      token,
      project_name: projectName.trim(),
      client_name: clientName.trim(),
      cover_images: coverImages,
    });

    if (error) {
      toast.error('Failed to create session');
      console.error(error);
    } else {
      toast.success('Session created!');
      onSessionCreated();
    }
    setCreating(false);
  };

  return (
    <Card className="border-zinc-700/50 bg-zinc-900/90 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />

      <CardHeader className="pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Plus className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <CardTitle className="text-base font-tech font-bold uppercase tracking-wider text-white">
              New Creative Session
            </CardTitle>
            <CardDescription className="text-zinc-500 text-[10px] font-tech tracking-widest uppercase">
              Per-client mood board workspace
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-tech uppercase tracking-widest text-cyan-400">
              Project Name *
            </Label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Soleia Grand Opening"
              className="bg-black/40 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-cyan-500 font-tech h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-tech uppercase tracking-widest text-purple-400">
              Client Name *
            </Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., Acme Corp"
              className="bg-black/40 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-purple-500 font-tech h-11"
            />
          </div>
        </div>

        {/* Cover Image Upload */}
        <div className="space-y-2">
          <Label className="text-[10px] font-tech uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
            <ImageIcon className="h-3 w-3" />
            Cover Image (optional)
          </Label>
          {coverPreview ? (
            <div className="relative rounded-lg overflow-hidden">
              <img src={coverPreview} alt="Cover" className="w-full max-h-48 object-cover rounded-lg" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={removeCover}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-amber-500/40 transition-colors"
            >
              <Upload className="h-6 w-6 mx-auto text-zinc-600 mb-2" />
              <p className="text-xs font-tech text-zinc-500 uppercase tracking-wider">
                Tap to upload cover image
              </p>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverSelect}
          />
        </div>

        <div className="flex gap-3 pt-3 border-t border-zinc-800">
          <Button
            onClick={createSession}
            disabled={creating || !projectName.trim() || !clientName.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 font-tech uppercase tracking-wider h-11"
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
            className="border-zinc-600 text-zinc-400 hover:bg-zinc-800 hover:text-white font-tech uppercase tracking-wider h-11"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
