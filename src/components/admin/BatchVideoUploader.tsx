import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { artlistCategories } from '@/lib/api/artlist';
import { compressVideo, extractVideoMetadata } from '@/lib/videoCompressor';
import { uploadQueue, QueueItem } from '@/lib/uploadQueue';
import { Upload, Loader2, Check, X, RotateCcw, Trash2, FileVideo } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BatchVideoUploaderProps {
  onClipAdded?: () => void;
}

export function BatchVideoUploader({ onClipAdded }: BatchVideoUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [category, setCategory] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Subscribe to queue updates
  useEffect(() => {
    const unsubscribe = uploadQueue.subscribe(setQueue);
    return () => { unsubscribe(); };
  }, []);

  // Set up the processor
  useEffect(() => {
    uploadQueue.setProcessor(async (item: QueueItem) => {
      try {
        // Update status to compressing
        uploadQueue.updateItem(item.id, { status: 'compressing', progress: 0 });

        // Compress video
        const compressed = await compressVideo(item.file, (progress) => {
          uploadQueue.updateItem(item.id, { 
            progress: progress.stage === 'encoding' ? progress.progress * 0.6 : progress.progress * 0.3 
          });
        });

        // Update status to uploading
        uploadQueue.updateItem(item.id, { status: 'uploading', progress: 60 });

        // Upload original video
        const timestamp = Date.now();
        const sanitizedName = item.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const originalPath = `${timestamp}-${sanitizedName}`;

        const { error: originalError } = await supabase.storage
          .from('clips')
          .upload(originalPath, item.file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (originalError) throw originalError;
        uploadQueue.updateItem(item.id, { progress: 75 });

        // Upload preview video
        const previewPath = `${timestamp}-preview.webm`;
        const { error: previewError } = await supabase.storage
          .from('clip-previews')
          .upload(previewPath, compressed.previewBlob, {
            cacheControl: '3600',
            upsert: false,
          });

        if (previewError) throw previewError;
        uploadQueue.updateItem(item.id, { progress: 85 });

        // Upload thumbnail
        const thumbPath = `${timestamp}-thumb.jpg`;
        const { error: thumbError } = await supabase.storage
          .from('clip-previews')
          .upload(thumbPath, compressed.thumbnailBlob, {
            cacheControl: '3600',
            upsert: false,
          });

        if (thumbError) throw thumbError;
        uploadQueue.updateItem(item.id, { progress: 92 });

        // Get public URLs
        const { data: { publicUrl: videoUrl } } = supabase.storage
          .from('clips')
          .getPublicUrl(originalPath);

        const { data: { publicUrl: previewVideoUrl } } = supabase.storage
          .from('clip-previews')
          .getPublicUrl(previewPath);

        const { data: { publicUrl: thumbnailPublicUrl } } = supabase.storage
          .from('clip-previews')
          .getPublicUrl(thumbPath);

        // Save to database
        const { error: dbError } = await supabase.from('cached_clips').insert({
          title: item.title || 'Untitled Clip',
          video_url: videoUrl,
          preview_url: previewVideoUrl,
          thumbnail: thumbnailPublicUrl,
          resolution: compressed.resolution,
          duration: compressed.duration,
          category: item.category,
          source_url: videoUrl,
          external_id: `upload-${timestamp}`,
        });

        if (dbError) throw dbError;

        uploadQueue.updateItem(item.id, { status: 'complete', progress: 100 });
        onClipAdded?.();

      } catch (error) {
        throw error;
      }
    });
  }, [onClipAdded]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (!category) {
      toast({
        title: 'Select a category first',
        description: 'Please choose a category before adding files',
        variant: 'destructive',
      });
      return;
    }

    // Filter valid video files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('video/')) {
        toast({
          title: `Skipped: ${file.name}`,
          description: 'Not a valid video file',
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > 524288000) {
        toast({
          title: `Skipped: ${file.name}`,
          description: 'File exceeds 500MB limit',
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add to queue
    const newItems = uploadQueue.addFiles(validFiles, category);

    // Generate thumbnails for preview
    for (const item of newItems) {
      try {
        const meta = await extractVideoMetadata(item.file);
        const thumbUrl = URL.createObjectURL(meta.thumbnailBlob);
        setThumbnails(prev => ({ ...prev, [item.id]: thumbUrl }));
      } catch (error) {
        console.error('Failed to extract thumbnail:', error);
      }
    }

    toast({
      title: `Added ${validFiles.length} file(s) to queue`,
      description: 'Processing will start automatically',
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [category, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const fakeEvent = {
        target: { files },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  }, [handleFileSelect]);

  const getStatusIcon = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/50" />;
      case 'compressing':
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'complete':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusText = (item: QueueItem) => {
    switch (item.status) {
      case 'pending':
        return 'Waiting...';
      case 'compressing':
        return 'Compressing...';
      case 'uploading':
        return 'Uploading...';
      case 'complete':
        return 'Complete';
      case 'error':
        return item.error || 'Failed';
    }
  };

  const pendingCount = queue.filter(i => i.status === 'pending').length;
  const processingCount = queue.filter(i => i.status === 'compressing' || i.status === 'uploading').length;
  const completeCount = queue.filter(i => i.status === 'complete').length;
  const errorCount = queue.filter(i => i.status === 'error').length;

  return (
    <div className="space-y-6 p-6 bg-card rounded-lg border border-border">
      {/* Category Select - Must select before adding files */}
      <div className="space-y-2">
        <Label htmlFor="batch-category" className="text-foreground">Category (select first)</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category for uploads..." />
          </SelectTrigger>
          <SelectContent>
            {artlistCategories.map((cat) => (
              <SelectItem key={cat.key} value={cat.key}>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* File Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${category ? 'border-muted-foreground/25 hover:border-primary/50 cursor-pointer' : 'border-muted-foreground/10 opacity-50 cursor-not-allowed'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={!category}
        />

        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Drop multiple video files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              MP4, WebM, MOV up to 500MB each
            </p>
          </div>
        </div>
      </div>

      {/* Queue Stats */}
      {queue.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {processingCount > 0 && (
              <span className="text-primary">Processing: {processingCount}</span>
            )}
            {pendingCount > 0 && (
              <span className="text-muted-foreground">Pending: {pendingCount}</span>
            )}
            {completeCount > 0 && (
              <span className="text-green-500">Complete: {completeCount}</span>
            )}
            {errorCount > 0 && (
              <span className="text-destructive">Failed: {errorCount}</span>
            )}
          </div>
          {completeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => uploadQueue.clearCompleted()}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear completed
            </Button>
          )}
        </div>
      )}

      {/* Queue List */}
      {queue.length > 0 && (
        <ScrollArea className="h-[300px] rounded-md border">
          <div className="p-4 space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border
                  ${item.status === 'complete' ? 'bg-green-500/5 border-green-500/20' : ''}
                  ${item.status === 'error' ? 'bg-destructive/5 border-destructive/20' : ''}
                  ${item.status === 'pending' ? 'bg-muted/30 border-border' : ''}
                  ${(item.status === 'compressing' || item.status === 'uploading') ? 'bg-primary/5 border-primary/20' : ''}
                `}
              >
                {/* Thumbnail */}
                {thumbnails[item.id] ? (
                  <img
                    src={thumbnails[item.id]}
                    alt=""
                    className="w-16 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                    <FileVideo className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(item.status)}
                    <span className={`text-xs ${item.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {getStatusText(item)}
                    </span>
                  </div>
                  {(item.status === 'compressing' || item.status === 'uploading') && (
                    <Progress value={item.progress} className="h-1 mt-2" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {item.status === 'error' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => uploadQueue.retryItem(item.id)}
                      className="h-8 w-8"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  {(item.status === 'pending' || item.status === 'error' || item.status === 'complete') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        uploadQueue.removeItem(item.id);
                        if (thumbnails[item.id]) {
                          URL.revokeObjectURL(thumbnails[item.id]);
                          setThumbnails(prev => {
                            const next = { ...prev };
                            delete next[item.id];
                            return next;
                          });
                        }
                      }}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Videos are processed one at a time • 4 Mbps preview quality
      </p>
    </div>
  );
}
