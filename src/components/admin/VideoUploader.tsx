import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { compressVideo, extractVideoMetadata, CompressionProgress } from '@/lib/videoCompressor';
import { Upload, Loader2, Video, Check, X, FileVideo } from 'lucide-react';

interface VideoUploaderProps {
  onClipAdded?: () => void;
}

export function VideoUploader({ onClipAdded }: VideoUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<CompressionProgress | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{ duration: string; resolution: string } | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('video/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a video file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (500MB max)
    if (selectedFile.size > 524288000) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 500MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));

    // Extract quick metadata for preview
    try {
      const meta = await extractVideoMetadata(selectedFile);
      setMetadata({ duration: meta.duration, resolution: meta.resolution });
      setThumbnailUrl(URL.createObjectURL(meta.thumbnailBlob));
    } catch (error) {
      console.error('Failed to extract metadata:', error);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      const fakeEvent = {
        target: { files: [droppedFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!file || !category) {
      toast({
        title: 'Missing fields',
        description: 'Please select a file and category',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Step 1: Compress video for preview
      setProgress({ stage: 'loading', progress: 0 });
      const compressed = await compressVideo(file, setProgress);

      // Step 2: Upload original video
      setProgress({ stage: 'complete', progress: 100 });
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const originalPath = `${timestamp}-${sanitizedName}`;

      const { data: originalUpload, error: originalError } = await supabase.storage
        .from('clips')
        .upload(originalPath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (originalError) throw originalError;
      setUploadProgress(33);

      // Step 3: Upload preview video
      const previewPath = `${timestamp}-preview.webm`;
      const { data: previewUpload, error: previewError } = await supabase.storage
        .from('clip-previews')
        .upload(previewPath, compressed.previewBlob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (previewError) throw previewError;
      setUploadProgress(66);

      // Step 4: Upload thumbnail
      const thumbPath = `${timestamp}-thumb.jpg`;
      const { data: thumbUpload, error: thumbError } = await supabase.storage
        .from('clip-previews')
        .upload(thumbPath, compressed.thumbnailBlob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (thumbError) throw thumbError;
      setUploadProgress(90);

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

      // Step 5: Save to database
      const { error: dbError } = await supabase.from('cached_clips').insert({
        title: title || 'Untitled Clip',
        video_url: videoUrl,
        preview_url: previewVideoUrl,
        thumbnail: thumbnailPublicUrl,
        resolution: compressed.resolution,
        duration: compressed.duration,
        category: category,
        source_url: videoUrl,
        external_id: `upload-${timestamp}`,
      });

      if (dbError) throw dbError;

      setUploadProgress(100);
      toast({
        title: 'Upload complete',
        description: `"${title}" has been added to ${category}`,
      });

      // Reset form
      setFile(null);
      setTitle('');
      setCategory('');
      setPreviewUrl(null);
      setThumbnailUrl(null);
      setMetadata(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onClipAdded?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(null);
      setUploadProgress(0);
    }
  };

  const clearFile = () => {
    setFile(null);
    setTitle('');
    setPreviewUrl(null);
    setThumbnailUrl(null);
    setMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getProgressText = () => {
    if (!progress) return '';
    switch (progress.stage) {
      case 'loading':
        return 'Loading video...';
      case 'processing':
        return 'Processing video...';
      case 'encoding':
        return 'Creating preview...';
      case 'complete':
        return uploadProgress < 100 ? 'Uploading files...' : 'Complete!';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6 p-6 bg-card rounded-lg border border-border">
      {/* File Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />

        {!file ? (
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drop video file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP4, WebM, MOV up to 500MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="Video thumbnail"
                  className="w-24 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-24 h-16 bg-muted rounded flex items-center justify-center">
                  <FileVideo className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                  {metadata && ` • ${metadata.resolution} • ${metadata.duration}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Title Input */}
      <div className="space-y-2">
        <Label htmlFor="upload-title" className="text-foreground">Title</Label>
        <Input
          id="upload-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Clip title..."
          disabled={isProcessing}
        />
      </div>

      {/* Category Select */}
      <div className="space-y-2">
        <Label htmlFor="upload-category" className="text-foreground">Category</Label>
        <Select value={category} onValueChange={setCategory} disabled={isProcessing}>
          <SelectTrigger>
            <SelectValue placeholder="Select category..." />
          </SelectTrigger>
          <SelectContent>
            {artlistCategories.map((cat) => (
              <SelectItem key={cat.key} value={cat.key}>
                {cat.icon} {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{getProgressText()}</span>
            <span className="text-foreground font-medium">
              {progress ? Math.round(progress.progress) : uploadProgress}%
            </span>
          </div>
          <Progress value={progress?.progress ?? uploadProgress} className="h-2" />
        </div>
      )}

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={!file || !category || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>
            <Video className="h-4 w-4 mr-2" />
            Upload & Encode
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Videos will be automatically compressed for preview playback
      </p>
    </div>
  );
}
