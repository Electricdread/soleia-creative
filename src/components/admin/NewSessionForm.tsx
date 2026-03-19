import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Loader2, Upload, X } from 'lucide-react';
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
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plus className="w-5 h-5 text-primary" />
          New Creative Session
        </CardTitle>
        <CardDescription>
          Create a mood board workspace for client collaboration
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Project Name *</Label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Soleia Grand Opening"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Client Name *</Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., Acme Corp"
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Cover Image */}
        <div className="border border-dashed border-border/60 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Cover Image (optional)
          </p>
          {coverPreview ? (
            <div className="relative rounded-lg overflow-hidden">
              <img src={coverPreview} alt="Cover" className="w-full max-h-40 object-cover rounded-lg" />
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
              className="w-full border border-dashed border-border/40 rounded-lg p-4 text-center hover:border-primary/40 transition-colors"
            >
              <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Click to upload</p>
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

        <div className="flex gap-3">
          <Button
            onClick={createSession}
            disabled={creating || !projectName.trim() || !clientName.trim()}
            className="gap-1.5 flex-1"
          >
            {creating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Create Session
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
