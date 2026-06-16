import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Trash2, Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

interface ProposalGalleryProps {
  gallery: any[];
  isAdmin?: boolean;
  proposalId?: string;
  onRefresh?: () => void;
}

export default function ProposalGallery({ gallery, isAdmin, proposalId, onRefresh }: ProposalGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !proposalId) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const path = `proposals/${proposalId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from('creative-uploads').upload(path, file);
      if (uploadErr) { toast.error(`Failed to upload ${file.name}`); continue; }

      const { data: urlData } = supabase.storage.from('creative-uploads').getPublicUrl(path);

      const { error: insertErr } = await supabase.from('proposal_gallery').insert({
        proposal_id: proposalId,
        image_url: urlData.publicUrl,
        caption: file.name.replace(/\.[^/.]+$/, ''),
        sort_order: gallery.length,
      });
      if (insertErr) toast.error(`Failed to save ${file.name}`);
    }

    toast.success(`${files.length} image(s) uploaded`);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRefresh?.();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from('proposal_gallery').delete().eq('id', id);
    toast.success('Image removed');
    setDeleting(null);
    onRefresh?.();
  };

  const saveCaption = async (id: string) => {
    await supabase.from('proposal_gallery').update({ caption: captionText || null }).eq('id', id);
    setEditingCaption(null);
    toast.success('Caption updated');
    onRefresh?.();
  };

  if (gallery.length === 0 && !isAdmin) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 flex-1">Gallery</h2>
        {isAdmin && proposalId && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 ml-4"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading...' : 'Add Images'}
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {gallery.length === 0 && isAdmin && (
        <div
          className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground/80">Click to upload gallery images</p>
          <p className="text-xs text-muted-foreground/60 mt-1">The first image will be used as the PDF cover</p>
        </div>
      )}

      {gallery.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {gallery.map(img => (
            <div key={img.id} className="bg-background rounded-lg overflow-hidden border border-border shadow-sm relative group">
              <img
                src={img.image_url}
                alt={img.caption || ''}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              {isAdmin && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <DeleteConfirmDialog
                    trigger={
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        disabled={deleting === img.id}
                      >
                        {deleting === img.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </Button>
                    }
                    title="Delete gallery image?"
                    description={`This will permanently remove "${img.caption || 'this image'}" from the proposal gallery. This action cannot be undone.`}
                    onConfirm={() => handleDelete(img.id)}
                  />
                </div>
              )}
              {editingCaption === img.id ? (
                <div className="p-2 flex gap-1">
                  <Input
                    value={captionText}
                    onChange={e => setCaptionText(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && saveCaption(img.id)}
                  />
                  <Button size="sm" className="h-8" onClick={() => saveCaption(img.id)}>Save</Button>
                </div>
              ) : (
                <div
                  className={`p-3 ${isAdmin ? 'cursor-pointer hover:bg-background' : ''}`}
                  onClick={() => { if (isAdmin) { setEditingCaption(img.id); setCaptionText(img.caption || ''); } }}
                >
                  <p className="text-sm text-muted-foreground">{img.caption || (isAdmin ? 'Click to add caption...' : '')}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {gallery.length > 0 && !isAdmin && (
        <p className="text-xs text-muted-foreground/80 mt-4 italic">
          These mockups are references only. The final design is rebuilt and realized for production.
        </p>
      )}
    </section>
  );
}
