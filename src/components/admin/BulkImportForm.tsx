import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2, Upload, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ImportResult {
  url: string;
  success: boolean;
  title?: string;
  error?: string;
}

export function BulkImportForm({ onClipsAdded }: { onClipsAdded?: () => void }) {
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [category, setCategory] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);

  const extractTitleFromUrl = (videoUrl: string): string => {
    try {
      const urlObj = new URL(videoUrl);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || '';
      const name = filename
        .replace(/\.(mp4|webm|mov|avi|mkv)$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ') || 'Untitled Clip';
    } catch {
      return 'Untitled Clip';
    }
  };

  const parseInput = (text: string): Array<{ url: string; title?: string; thumbnail?: string; resolution?: string; duration?: string }> => {
    const lines = text.split('\n').filter(line => line.trim());
    const clips: Array<{ url: string; title?: string; thumbnail?: string; resolution?: string; duration?: string }> = [];

    // Check if it's CSV format (has commas and headers)
    const firstLine = lines[0]?.toLowerCase() || '';
    const isCSV = firstLine.includes(',') && (firstLine.includes('url') || firstLine.includes('title'));

    if (isCSV) {
      // Parse as CSV
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const urlIndex = headers.findIndex(h => h.includes('url') || h.includes('link'));
      const titleIndex = headers.findIndex(h => h.includes('title') || h.includes('name'));
      const thumbnailIndex = headers.findIndex(h => h.includes('thumbnail') || h.includes('thumb') || h.includes('image'));
      const resolutionIndex = headers.findIndex(h => h.includes('resolution') || h.includes('quality'));
      const durationIndex = headers.findIndex(h => h.includes('duration') || h.includes('length'));

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const url = urlIndex >= 0 ? values[urlIndex] : '';
        
        if (url && url.match(/^https?:\/\/.+/)) {
          clips.push({
            url,
            title: titleIndex >= 0 ? values[titleIndex] : undefined,
            thumbnail: thumbnailIndex >= 0 ? values[thumbnailIndex] : undefined,
            resolution: resolutionIndex >= 0 ? values[resolutionIndex] : undefined,
            duration: durationIndex >= 0 ? values[durationIndex] : undefined,
          });
        }
      }
    } else {
      // Parse as plain URL list (one per line)
      for (const line of lines) {
        const url = line.trim();
        if (url.match(/^https?:\/\/.+/)) {
          clips.push({ url });
        }
      }
    }

    return clips;
  };

  const handleImport = async () => {
    if (!category) {
      toast({
        title: 'Select a category',
        description: 'Please select a category for the imported clips',
        variant: 'destructive',
      });
      return;
    }

    const clips = parseInput(inputText);
    
    if (clips.length === 0) {
      toast({
        title: 'No valid URLs found',
        description: 'Please enter valid video URLs (one per line or CSV format)',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setResults([]);

    const importResults: ImportResult[] = [];

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const title = clip.title || extractTitleFromUrl(clip.url);

      try {
        const { error } = await supabase.from('cached_clips').insert({
          title,
          video_url: clip.url,
          preview_url: clip.url,
          thumbnail: clip.thumbnail || null,
          resolution: clip.resolution || '4K',
          duration: clip.duration || 'Unknown',
          category: category,
          source_url: clip.url,
          external_id: `bulk-${Date.now()}-${i}`,
        });

        if (error) throw error;

        importResults.push({ url: clip.url, success: true, title });
      } catch (error) {
        console.error('Error importing clip:', error);
        importResults.push({ 
          url: clip.url, 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to import' 
        });
      }

      setProgress(((i + 1) / clips.length) * 100);
      setResults([...importResults]);
    }

    const successCount = importResults.filter(r => r.success).length;
    const failCount = importResults.filter(r => !r.success).length;

    toast({
      title: 'Import complete',
      description: `${successCount} clips imported${failCount > 0 ? `, ${failCount} failed` : ''}`,
      variant: failCount > 0 && successCount === 0 ? 'destructive' : 'default',
    });

    if (successCount > 0) {
      onClipsAdded?.();
    }

    setIsImporting(false);
  };

  const handleClear = () => {
    setInputText('');
    setResults([]);
    setProgress(0);
  };

  return (
    <div className="space-y-6 p-6 bg-card rounded-lg border border-border">
      <div className="space-y-2">
        <Label htmlFor="bulk-input" className="text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Paste URLs or CSV
        </Label>
        <Textarea
          id="bulk-input"
          placeholder={`Paste video URLs (one per line) or CSV format:

Option 1 - Simple list:
https://example.com/video1.mp4
https://example.com/video2.mp4

Option 2 - CSV with headers:
url,title,thumbnail,resolution,duration
https://example.com/video1.mp4,My Video,https://...,4K,0:30
https://example.com/video2.mp4,Another Video,,,1:00`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
          disabled={isImporting}
        />
        <p className="text-xs text-muted-foreground">
          Supports plain URL list or CSV with columns: url, title, thumbnail, resolution, duration
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bulk-category" className="text-foreground">Category</Label>
        <Select value={category} onValueChange={setCategory} disabled={isImporting}>
          <SelectTrigger>
            <SelectValue placeholder="Select category for all clips..." />
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

      {isImporting && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Importing clips...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {results.length > 0 && !isImporting && (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          <Label className="text-foreground">Import Results</Label>
          <div className="space-y-1">
            {results.map((result, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-2 text-xs p-2 rounded ${
                  result.success ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 flex-shrink-0" />
                )}
                <span className="truncate">
                  {result.success ? result.title : `${result.url.slice(0, 50)}... - ${result.error}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleImport}
          disabled={!inputText.trim() || !category || isImporting}
          className="flex-1"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Import Clips
            </>
          )}
        </Button>
        {results.length > 0 && !isImporting && (
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
