import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { compressVideo, extractVideoMetadata } from '@/lib/videoCompressor';
import { uploadQueue, QueueItem } from '@/lib/uploadQueue';
import { Upload, Loader2, Check, X, FileVideo, Trash2, RotateCcw, FolderPlus } from 'lucide-react';
import type { LookbookCategory } from './CategoryManagerDialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: LookbookCategory[];
  onUploaded?: () => void;
  onCreateCategory?: () => void;
}

export function AddLookMediaDialog({ open, onOpenChange, categories, onUploaded, onCreateCategory }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categoryId, setCategoryId] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = uploadQueue.subscribe(setQueue);
    return () => { unsubscribe(); };
  }, []);

  // Reset local state when the dialog closes
  useEffect(() => {
    if (!open) {
      setThumbnails({});
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open]);

  useEffect(() => {
    uploadQueue.setProcessor(async (item: QueueItem) => {
      uploadQueue.updateItem(item.id, { status: 'compressing', progress: 0 });
      const compressed = await compressVideo(item.file, (p) => {
        uploadQueue.updateItem(item.id, {
          progress: p.stage === 'encoding' ? p.progress * 0.6 : p.progress * 0.3,
        });
      });
      uploadQueue.updateItem(item.id, { status: 'uploading', progress: 60 });

      const timestamp = Date.now();
      const sanitized = item.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

      const driveForm = new FormData();
      driveForm.append('file', item.file, sanitized);
      driveForm.append('filename', `${timestamp}-${sanitized}`);
      driveForm.append('mimeType', item.file.type || 'video/mp4');
      const { data: driveData, error: driveError } = await supabase.functions.invoke(
        'upload-to-drive',
        { body: driveForm },
      );
      if (driveError) throw driveError;
      if (!driveData?.fileId) throw new Error('Drive upload returned no fileId');
      uploadQueue.updateItem(item.id, { progress: 75 });

      const previewPath = `${timestamp}-preview.webm`;
      const { error: previewError } = await supabase.storage
        .from('clip-previews')
        .upload(previewPath, compressed.previewBlob, { cacheControl: '3600', upsert: false });
      if (previewError) throw previewError;
      uploadQueue.updateItem(item.id, { progress: 85 });

      const thumbPath = `${timestamp}-thumb.jpg`;
      const { error: thumbError } = await supabase.storage
        .from('clip-previews')
        .upload(thumbPath, compressed.thumbnailBlob, { cacheControl: '3600', upsert: false });
      if (thumbError) throw thumbError;
      uploadQueue.updateItem(item.id, { progress: 92 });

      const { data: { publicUrl: previewUrl } } = supabase.storage.from('clip-previews').getPublicUrl(previewPath);
      const { data: { publicUrl: thumbUrl } } = supabase.storage.from('clip-previews').getPublicUrl(thumbPath);

      const cat = categories.find((c) => c.id === item.category) || categories.find((c) => c.id === categoryId);
      const { error: dbError } = await supabase.from('cached_clips').insert({
        title: item.title || 'Untitled Look',
        video_url: null,
        preview_url: previewUrl,
        thumbnail: thumbUrl,
        resolution: compressed.resolution,
        duration: compressed.duration,
        category: cat?.slug || 'uncategorized',
        category_id: cat?.id ?? null,
        source_url: driveData.webViewLink ?? null,
        external_id: `look-${timestamp}`,
        drive_file_id: driveData.fileId,
        drive_web_view_link: driveData.webViewLink ?? null,
        original_storage: 'drive',
      } as any);
      if (dbError) throw dbError;

      uploadQueue.updateItem(item.id, { status: 'complete', progress: 100 });
      onUploaded?.();
    });
  }, [categories, categoryId, onUploaded]);

  const openFilePicker = () => {
    if (!categoryId) {
      toast({
        title: 'Pick a category first',
        description: categories.length === 0
          ? 'Create at least one category to organize your looks.'
          : 'Choose a category from the dropdown above before adding files.',
        variant: 'destructive',
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (!categoryId) {
      toast({ title: 'Pick a category first', variant: 'destructive' });
      return;
    }
    const VIDEO_EXTS = ['.mp4', '.mov', '.webm', '.m4v', '.mkv', '.avi'];
    const looksLikeVideo = (f: File) => {
      if (f.type.startsWith('video/')) return true;
      const name = f.name.toLowerCase();
      return VIDEO_EXTS.some((ext) => name.endsWith(ext));
    };
    const valid = files.filter((f) => {
      if (!looksLikeVideo(f)) {
        toast({ title: `Skipped ${f.name}`, description: 'Not a video file', variant: 'destructive' });
        return false;
      }
      if (f.size > 524288000) {
        toast({ title: `Skipped ${f.name}`, description: 'Exceeds 500MB', variant: 'destructive' });
        return false;
      }
      return true;
    });
    if (!valid.length) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Queue immediately so processing starts even if metadata extraction fails
    const items = uploadQueue.addFiles(valid, categoryId);
    toast({ title: `${items.length} file${items.length > 1 ? 's' : ''} added to upload queue` });

    // Best-effort thumbnail extraction (non-blocking per file)
    for (const it of items) {
      extractVideoMetadata(it.file)
        .then((meta) => {
          setThumbnails((prev) => ({ ...prev, [it.id]: URL.createObjectURL(meta.thumbnailBlob) }));
        })
        .catch(() => { /* preview only — ignore */ });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast({ title: 'Pick a category first', variant: 'destructive' });
      return;
    }
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      handleFiles({ target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-[#c49a3c]" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Add to Look Book
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Upload videos. Each will be re-encoded to a 720p preview; originals go to cold storage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-zinc-300">Category</Label>
            {onCreateCategory && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onCreateCategory}
                className="h-7 px-2 text-xs text-[#c49a3c] hover:text-[#c49a3c] hover:bg-zinc-900"
              >
                <FolderPlus className="h-3.5 w-3.5 mr-1" /> Manage categories
              </Button>
            )}
          </div>
          {categories.length === 0 ? (
            <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-400 flex items-center justify-between gap-3">
              <span>No categories yet — create one to start uploading.</span>
              {onCreateCategory && (
                <Button
                  type="button"
                  size="sm"
                  onClick={onCreateCategory}
                  className="bg-[#c49a3c] hover:bg-[#b38a30] text-black"
                >
                  <FolderPlus className="h-3.5 w-3.5 mr-1" /> Create
                </Button>
              )}
            </div>
          ) : (
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <SelectValue placeholder="Choose a category…" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Hidden native input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.mov,.webm,.m4v,.mkv,.avi"
          multiple
          onChange={handleFiles}
          className="hidden"
        />

        {/* Drop zone (drag) + click fallback */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={openFilePicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openFilePicker(); }}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            categoryId
              ? 'border-zinc-700 hover:border-[#c49a3c]/60'
              : 'border-zinc-800 hover:border-[#c49a3c]/40'
          }`}
          style={{ touchAction: 'manipulation' }}
        >
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
              <Upload className="h-6 w-6 text-[#c49a3c]" />
            </div>
            <p className="text-sm text-zinc-200">Drop videos here or tap to browse</p>
            <p className="text-xs text-zinc-500">MP4, WebM, MOV — up to 500 MB each</p>
            <Button
              type="button"
              onClick={(e) => { e.stopPropagation(); openFilePicker(); }}
              className="bg-[#c49a3c] hover:bg-[#b38a30] text-black min-h-[44px]"
            >
              <Upload className="h-4 w-4 mr-2" />
              Browse files
            </Button>
            {!categoryId && (
              <p className="text-[11px] uppercase tracking-wider text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Pick or create a category first
              </p>
            )}
          </div>
        </div>

        {queue.length > 0 && (
          <ScrollArea className="h-56 rounded-md border border-zinc-800 bg-zinc-900/40">
            <div className="p-3 space-y-2">
              {queue.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded border border-zinc-800 bg-zinc-950">
                  {thumbnails[item.id] ? (
                    <img src={thumbnails[item.id]} alt="" className="w-14 h-9 object-cover rounded" />
                  ) : (
                    <div className="w-14 h-9 bg-zinc-900 rounded flex items-center justify-center">
                      <FileVideo className="h-4 w-4 text-zinc-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-100 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.status === 'complete' && <Check className="h-3 w-3 text-emerald-400" />}
                      {item.status === 'error' && <X className="h-3 w-3 text-red-400" />}
                      {(item.status === 'compressing' || item.status === 'uploading') && (
                        <Loader2 className="h-3 w-3 animate-spin text-[#c49a3c]" />
                      )}
                      <span className={`text-[10px] uppercase tracking-wider ${item.status === 'error' ? 'text-red-400' : 'text-zinc-500'}`}>
                        {item.status === 'error'
                          ? (typeof item.error === 'string' ? item.error : 'Upload failed')
                          : item.status}
                      </span>
                    </div>
                    {(item.status === 'compressing' || item.status === 'uploading') && (
                      <Progress value={item.progress} className="h-1 mt-1" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    {item.status === 'error' && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400" onClick={() => uploadQueue.retryItem(item.id)}>
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {(item.status === 'pending' || item.status === 'error' || item.status === 'complete') && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400" onClick={() => uploadQueue.removeItem(item.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {queue.some((q) => q.status === 'complete') && (
          <Button variant="ghost" size="sm" onClick={() => uploadQueue.clearCompleted()} className="text-zinc-400">
            <Trash2 className="h-3 w-3 mr-1" /> Clear completed
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
