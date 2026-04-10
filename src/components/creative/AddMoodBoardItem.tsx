import { useState, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Link2, Upload, Loader2, X, Film, FileText, ImageIcon } from 'lucide-react';

interface AddMoodBoardItemProps {
  sessionId: string;
  userName: string;
  onItemAdded: () => void;
}

/**
 * Extract a thumbnail from a video file at ~25% of its duration.
 */
function extractVideoThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(video.duration * 0.25, 5);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob);
        }, 'image/jpeg', 0.85);
      } catch {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve(null);
    }, 15000);
  });
}

async function getNextSortOrder(sessionId: string): Promise<number> {
  const { data } = await supabase
    .from('mood_board_items')
    .select('sort_order')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1);
  const max = data?.[0]?.sort_order ?? -1;
  return (max ?? -1) + 1;
}

export function AddMoodBoardItem({ sessionId, userName, onItemAdded }: AddMoodBoardItemProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('url');
  
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Generate preview URLs for selected files
  const filePreviews = useMemo(() => {
    return selectedFiles.map(file => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        return URL.createObjectURL(file);
      }
      return null;
    });
  }, [selectedFiles]);

  // Cleanup preview URLs when files change
  const cleanupPreviews = () => {
    filePreviews.forEach(url => url && URL.revokeObjectURL(url));
  };

  const detectUrlType = (url: string): 'pinterest' | 'instagram' | 'link' => {
    if (url.includes('pinterest.com') || url.includes('pin.it')) return 'pinterest';
    if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
    return 'link';
  };

  const handleUrlSubmit = async () => {
    if (!url.trim()) { toast.error('Please enter a URL'); return; }
    if (!userName) { toast.error('Please enter your name first'); return; }

    setLoading(true);
    const itemType = detectUrlType(url);
    const sortOrder = await getNextSortOrder(sessionId);

    const { error } = await supabase.from('mood_board_items').insert({
      session_id: sessionId,
      item_type: itemType,
      url: url.trim(),
      title: title.trim() || null,
      description: description.trim() || null,
      added_by: userName,
      sort_order: sortOrder,
    });

    if (error) {
      toast.error('Failed to add item');
      console.error(error);
    } else {
      toast.success('Item added to mood board!');
      resetForm();
      onItemAdded();
    }
    setLoading(false);
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) { toast.error('Please select files to upload'); return; }
    if (!userName) { toast.error('Please enter your name first'); return; }

    setLoading(true);
    let sortOrder = await getNextSortOrder(sessionId);

    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const baseName = `${sessionId}/${Date.now()}-${Math.random().toString(36).substring(2)}`;
      const fileName = `${baseName}.${fileExt}`;

      let itemType: 'image' | 'video' | 'pdf' = 'image';
      if (file.type.startsWith('video/')) itemType = 'video';
      else if (file.type === 'application/pdf') itemType = 'pdf';

      const { error: uploadError } = await supabase.storage
        .from('creative-uploads')
        .upload(fileName, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`);
        console.error(uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('creative-uploads')
        .getPublicUrl(fileName);

      let thumbnailUrl: string | null = null;
      if (itemType === 'video') {
        const thumbBlob = await extractVideoThumbnail(file);
        if (thumbBlob) {
          const thumbPath = `${baseName}-thumb.jpg`;
          const { error: thumbErr } = await supabase.storage
            .from('creative-uploads')
            .upload(thumbPath, thumbBlob, { contentType: 'image/jpeg' });
          if (!thumbErr) {
            const { data: thumbData } = supabase.storage
              .from('creative-uploads')
              .getPublicUrl(thumbPath);
            thumbnailUrl = thumbData.publicUrl;
          }
        }
      }

      const { error: insertError } = await supabase.from('mood_board_items').insert({
        session_id: sessionId,
        item_type: itemType,
        file_url: urlData.publicUrl,
        thumbnail_url: thumbnailUrl,
        title: file.name,
        added_by: userName,
        sort_order: sortOrder,
      });

      if (insertError) {
        toast.error(`Failed to save ${file.name}`);
        console.error(insertError);
      }
      sortOrder++;
    }

    toast.success(`${selectedFiles.length} file(s) uploaded!`);
    resetForm();
    onItemAdded();
    setLoading(false);
  };

  const resetForm = () => {
    cleanupPreviews();
    setUrl('');
    setTitle('');
    setDescription('');
    setSelectedFiles([]);
    setOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      cleanupPreviews();
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    const preview = filePreviews[index];
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) return <Film className="h-5 w-5 text-zinc-400" />;
    if (file.type === 'application/pdf') return <FileText className="h-5 w-5 text-zinc-400" />;
    return <ImageIcon className="h-5 w-5 text-zinc-400" />;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) cleanupPreviews(); setOpen(v); }}>
      <DialogTrigger asChild>
        <Button className="gap-2 h-12 sm:h-10 px-4 sm:px-6 font-tech uppercase tracking-wider text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 hover:text-cyan-300 touch-manipulation active:scale-95 transition-all">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg lg:max-w-2xl bg-zinc-900 border-zinc-700 font-tech max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-cyan-400 uppercase tracking-widest text-sm">Add_To_Board</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50 h-12 sm:h-10">
            <TabsTrigger 
              value="url" 
              className="gap-2 font-tech uppercase tracking-wider text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              <Link2 className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className="gap-2 font-tech uppercase tracking-wider text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-[10px] font-tech uppercase tracking-widest text-zinc-400">URL *</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Pinterest, Instagram, or any URL..."
                className="h-12 sm:h-10 text-base sm:text-sm font-tech bg-zinc-800/50 border-zinc-700 focus:border-cyan-500/50 placeholder:text-zinc-600"
              />
              <p className="text-[10px] text-zinc-600 font-tech uppercase tracking-wider">
                Supports Pinterest pins, Instagram posts, and general links
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-[10px] font-tech uppercase tracking-widest text-zinc-400">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give it a name..."
                className="h-12 sm:h-10 text-base sm:text-sm font-tech bg-zinc-800/50 border-zinc-700 focus:border-cyan-500/50 placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[10px] font-tech uppercase tracking-widest text-zinc-400">Notes (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why does this inspire you?"
                rows={3}
                className="text-base sm:text-sm font-tech bg-zinc-800/50 border-zinc-700 focus:border-cyan-500/50 placeholder:text-zinc-600 resize-none"
              />
            </div>

            <Button 
              onClick={handleUrlSubmit} 
              disabled={loading} 
              className="w-full h-12 sm:h-10 font-tech uppercase tracking-widest text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 touch-manipulation active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add URL
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div 
              className="border-2 border-dashed border-zinc-700 rounded-lg p-4 text-center cursor-pointer hover:border-cyan-500/50 transition-colors touch-manipulation active:scale-[0.98]"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <Upload className="h-6 w-6 mx-auto mb-1.5 text-zinc-600" />
              <p className="text-xs font-tech uppercase tracking-wider text-zinc-400">Tap to select files</p>
              <p className="text-[10px] text-zinc-600 font-tech mt-0.5 uppercase tracking-wider">
                Images, videos, and PDFs
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-tech uppercase tracking-widest text-cyan-400">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="relative group aspect-square rounded-md overflow-hidden bg-zinc-800 border border-zinc-700">
                      {filePreviews[i] && file.type.startsWith('image/') ? (
                        <img src={filePreviews[i]!} alt={file.name} className="w-full h-full object-cover" />
                      ) : filePreviews[i] && file.type.startsWith('video/') ? (
                        <video src={filePreviews[i]!} muted preload="metadata" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1">
                          {getFileIcon(file)}
                          <span className="text-[9px] text-zinc-500 font-tech truncate w-full text-center px-1">
                            {file.name.length > 12 ? file.name.slice(0, 10) + '…' : file.name}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="absolute top-0.5 right-0.5 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={handleFileUpload} 
              disabled={loading || selectedFiles.length === 0} 
              className="w-full h-12 sm:h-10 font-tech uppercase tracking-widest text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50 touch-manipulation active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
