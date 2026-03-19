import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Copy, Trash2, ExternalLink, Users, Clock, Globe, Lock, Upload, ImageIcon, X } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface CoverImage {
  url: string;
  theme: string;
  prompt: string;
}

interface CreativeSession {
  id: string;
  token: string;
  project_name: string;
  client_name: string;
  circleback_url: string | null;
  circleback_summary: string | null;
  technical_notes: string | null;
  creative_notes: string | null;
  created_at: string;
  is_active: boolean;
  is_public?: boolean;
  cover_images?: CoverImage[] | null;
  cover_themes?: string[] | null;
  cover_generated_at?: string | null;
  featured_images?: CoverImage[] | null;
}

interface CreativeSessionCardProps {
  session: CreativeSession;
  index: number;
  onCopyLink: (token: string) => void;
  onDelete: (id: string) => void;
  onOpen: (token: string) => void;
  onSessionUpdate?: () => void;
}

export function CreativeSessionCard({ session, index, onCopyLink, onDelete, onOpen, onSessionUpdate }: CreativeSessionCardProps) {
  const [isPublic, setIsPublic] = useState(session.is_public ?? false);
  const [coverImage, setCoverImage] = useState<CoverImage | null>(
    (session.cover_images as CoverImage[])?.[0] || null
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sessionDate = new Date(session.created_at);
  const expirationDate = addDays(sessionDate, 21);
  const daysRemaining = differenceInDays(expirationDate, new Date());
  const isExpired = daysRemaining < 0;
  const isUrgent = daysRemaining <= 5 && daysRemaining >= 0;

  const handlePublicToggle = async (checked: boolean) => {
    setIsPublic(checked);
    const { error } = await supabase
      .from('creative_sessions')
      .update({ is_public: checked })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to update visibility');
      setIsPublic(!checked);
    } else {
      toast.success(checked ? 'Session is now public' : 'Session is now private');
      onSessionUpdate?.();
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const path = `covers/${session.token}-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('creative-uploads')
      .upload(path, file);

    if (uploadErr) {
      toast.error('Failed to upload cover');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('creative-uploads')
      .getPublicUrl(path);

    const newCover: CoverImage = { url: urlData.publicUrl, theme: 'cover', prompt: '' };

    const { error } = await supabase
      .from('creative_sessions')
      .update({ cover_images: [newCover] as unknown as Json })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to save cover');
    } else {
      setCoverImage(newCover);
      toast.success('Cover updated');
      onSessionUpdate?.();
    }
    setUploading(false);
  };

  const removeCover = async () => {
    const { error } = await supabase
      .from('creative_sessions')
      .update({ cover_images: null })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to remove cover');
    } else {
      setCoverImage(null);
      toast.success('Cover removed');
      onSessionUpdate?.();
    }
  };

  return (
    <Card className="group border-zinc-700/50 bg-zinc-900/90 hover:border-cyan-500/30 transition-all overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Date + Project */}
            <div className="flex items-start gap-4 mb-3">
              <div className="shrink-0 text-center">
                <div className={`text-3xl font-tech font-bold leading-none ${isExpired ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {format(sessionDate, 'd')}
                </div>
                <div className="text-[10px] font-tech uppercase tracking-widest text-zinc-400 mt-0.5">
                  {format(sessionDate, 'MMM yyyy')}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-tech font-bold uppercase tracking-wide text-white truncate">
                  {session.project_name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 font-tech uppercase text-[10px] tracking-wider h-5">
                    <Users className="h-3 w-3 mr-1" />
                    {session.client_name}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={isPublic}
                      onCheckedChange={handlePublicToggle}
                      className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-zinc-600 scale-90"
                    />
                    <span className={`text-[10px] font-tech uppercase tracking-wider ${isPublic ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-tech ${
              isExpired
                ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                : isUrgent
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                  : 'bg-zinc-800/50 border border-zinc-700/30 text-zinc-400'
            }`}>
              <Clock className="h-3.5 w-3.5" />
              <span>
                {isExpired
                  ? `Expired ${Math.abs(daysRemaining)}d ago`
                  : `${daysRemaining}d remaining · Expires ${format(expirationDate, 'MMM d')}`
                }
              </span>
            </div>

            {/* Cover Image */}
            <div className="mt-3">
              {coverImage ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img src={coverImage.url} alt="Cover" className="w-full max-h-40 object-cover rounded-lg" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-black/60 hover:bg-black/80 text-white"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={removeCover}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full border border-dashed border-zinc-700 rounded-lg p-4 text-center hover:border-amber-500/40 transition-colors"
                >
                  <ImageIcon className="h-5 w-5 mx-auto text-zinc-600 mb-1" />
                  <p className="text-[10px] font-tech text-zinc-500 uppercase tracking-wider">
                    {uploading ? 'Uploading...' : 'Upload cover image'}
                  </p>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onOpen(session.token)} title="Open"
              className="text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 h-9 w-9">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onCopyLink(session.token)} title="Copy link"
              className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 h-9 w-9">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(session.id)} title="Delete"
              className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 h-9 w-9">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
