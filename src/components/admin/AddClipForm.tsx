import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, Link, Check } from 'lucide-react';

interface ClipMetadata {
  title: string;
  resolution: string;
  duration: string;
  thumbnail: string;
}

export function AddClipForm({ onClipAdded }: { onClipAdded?: () => void }) {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [metadata, setMetadata] = useState<ClipMetadata>({
    title: '',
    resolution: '',
    duration: '',
    thumbnail: '',
  });
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getResolutionLabel = (width: number, height: number): string => {
    if (width >= 3840 || height >= 2160) return '4K';
    if (width >= 1920 || height >= 1080) return '1080p';
    if (width >= 1280 || height >= 720) return '720p';
    if (width >= 854 || height >= 480) return '480p';
    return `${width}x${height}`;
  };

  const extractTitleFromUrl = (videoUrl: string): string => {
    try {
      const urlObj = new URL(videoUrl);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || '';
      // Remove extension and clean up
      const name = filename
        .replace(/\.(mp4|webm|mov|avi|mkv)$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      // Capitalize first letter of each word
      return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ') || 'Untitled Clip';
    } catch {
      return 'Untitled Clip';
    }
  };

  const extractMetadata = async (videoUrl: string) => {
    if (!videoUrl) return;

    setIsExtracting(true);
    setMetadata({
      title: extractTitleFromUrl(videoUrl),
      resolution: 'Loading...',
      duration: 'Loading...',
      thumbnail: '',
    });

    try {
      // Create a video element to extract metadata
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          const duration = formatDuration(video.duration);
          const resolution = getResolutionLabel(video.videoWidth, video.videoHeight);
          
          setMetadata(prev => ({
            ...prev,
            duration,
            resolution,
          }));

          // Try to capture a thumbnail
          video.currentTime = Math.min(1, video.duration / 4);
        };

        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
              setMetadata(prev => ({ ...prev, thumbnail }));
            }
          } catch (e) {
            console.log('Could not capture thumbnail (CORS):', e);
          }
          resolve();
        };

        video.onerror = () => {
          // Still try to use the URL even if we can't load metadata
          setMetadata(prev => ({
            ...prev,
            resolution: 'Unknown',
            duration: 'Unknown',
          }));
          resolve();
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (video.readyState < 1) {
            setMetadata(prev => ({
              ...prev,
              resolution: 'Unknown',
              duration: 'Unknown',
            }));
            resolve();
          }
        }, 10000);

        video.src = videoUrl;
      });
    } catch (error) {
      console.error('Error extracting metadata:', error);
      setMetadata(prev => ({
        ...prev,
        resolution: 'Unknown',
        duration: 'Unknown',
      }));
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Auto-extract metadata when URL looks valid
    if (newUrl.match(/^https?:\/\/.+\.(mp4|webm|mov)(\?.*)?$/i)) {
      extractMetadata(newUrl);
    }
  };

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedUrl = e.clipboardData.getData('text');
    if (pastedUrl.match(/^https?:\/\/.+\.(mp4|webm|mov)(\?.*)?$/i)) {
      setTimeout(() => extractMetadata(pastedUrl), 100);
    }
  };

  const handleSave = async () => {
    if (!url || !category) {
      toast({
        title: 'Missing fields',
        description: 'Please enter a URL and select a category',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('cached_clips').insert({
        title: metadata.title || 'Untitled Clip',
        video_url: url,
        preview_url: url,
        thumbnail: metadata.thumbnail || null,
        resolution: metadata.resolution || '4K',
        duration: metadata.duration || 'Unknown',
        category: category,
        source_url: url,
        external_id: `manual-${Date.now()}`,
      });

      if (error) throw error;

      toast({
        title: 'Clip added',
        description: `"${metadata.title}" added to ${category}`,
      });

      // Reset form
      setUrl('');
      setCategory('');
      setMetadata({ title: '', resolution: '', duration: '', thumbnail: '' });
      onClipAdded?.();
    } catch (error) {
      console.error('Error saving clip:', error);
      toast({
        title: 'Error',
        description: 'Failed to save clip. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-card rounded-lg border border-border">
      <div className="space-y-2">
        <Label htmlFor="url" className="text-foreground">Video URL</Label>
        <div className="relative">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="url"
            type="url"
            placeholder="Paste .mp4 or .webm URL..."
            value={url}
            onChange={handleUrlChange}
            onPaste={handleUrlPaste}
            className="pl-10"
          />
          {isExtracting && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Paste a direct video link (.mp4, .webm) to auto-extract metadata
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-foreground">Category</Label>
        <Select value={category} onValueChange={setCategory}>
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

      {metadata.title && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Extracted Metadata
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Resolution</Label>
              <Input
                value={metadata.resolution}
                onChange={(e) => setMetadata(prev => ({ ...prev, resolution: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Duration</Label>
              <Input
                value={metadata.duration}
                onChange={(e) => setMetadata(prev => ({ ...prev, duration: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {metadata.thumbnail && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <img
                src={metadata.thumbnail}
                alt="Thumbnail preview"
                className="w-full max-w-xs rounded-md border border-border"
              />
            </div>
          )}
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={!url || !category || isSaving}
        className="w-full"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving...
          </>
        ) : (
          'Add Clip'
        )}
      </Button>
    </div>
  );
}
