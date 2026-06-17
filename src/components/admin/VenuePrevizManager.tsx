import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2, FileVideo, X, Check, MonitorPlay, AlertTriangle } from 'lucide-react';

const PREVIZ_KEY = 'venue_previz_url';
// Workspace policy blocks new public buckets, so we reuse the existing public
// creative-guide-template bucket and namespace previz uploads under previz/.
const BUCKET = 'creative-guide-template';
const PATH_PREFIX = 'previz/';
const MAX_BYTES = 524288000; // 500MB

/**
 * Admin uploader for the Video Mapping previz movie. Uploads a browser-playable
 * .mp4 to the venue-previz bucket and points the venue_previz_url setting at it.
 * The /creative-guide/video-mapping page reads that URL (falls back to the
 * bundled movie when empty).
 */
export function VenuePrevizManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', PREVIZ_KEY)
      .maybeSingle()
      .then(({ data }) => {
        setCurrentUrl(data?.value && data.value.trim() ? data.value.trim() : null);
        setLoading(false);
      });
  }, []);

  const probePlayable = (f: File): Promise<boolean> =>
    new Promise((resolve) => {
      const url = URL.createObjectURL(f);
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.muted = true;
      const cleanup = () => URL.revokeObjectURL(url);
      v.onloadedmetadata = () => { cleanup(); resolve(v.videoWidth > 0); };
      v.onerror = () => { cleanup(); resolve(false); };
      v.src = url;
    });

  const pickFile = useCallback(async (selected: File | undefined) => {
    if (!selected) return;
    const name = selected.name.toLowerCase();
    const isMov = name.endsWith('.mov');
    const okType = selected.type === 'video/mp4' || selected.type === 'video/webm' || name.endsWith('.mp4') || name.endsWith('.webm');
    if (isMov || !okType) {
      toast.error('Browsers can only play .mp4 (H.264) or .webm — re-export from AME, not Resolume DXV.');
      return;
    }
    if (selected.size > MAX_BYTES) {
      toast.error('File too large — maximum is 500MB');
      return;
    }
    const playable = await probePlayable(selected);
    if (!playable) {
      toast.error('This file can\'t be decoded by the browser. Re-export as H.264 .mp4 from Adobe Media Encoder.');
      return;
    }
    setFile(selected);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      pickFile(e.dataTransfer.files[0]);
    },
    [pickFile],
  );

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(10);
    try {
      const timestamp = Date.now();
      const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `${PATH_PREFIX}${timestamp}-${sanitized}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      setProgress(75);

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const { error: settingError } = await supabase
        .from('site_settings')
        .upsert({ key: PREVIZ_KEY, value: publicUrl, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (settingError) throw settingError;

      setProgress(100);
      setCurrentUrl(publicUrl);
      clearFile();
      toast.success('Previz movie updated — live on the Video Mapping page');
    } catch (err) {
      console.error('Previz upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleReset = async () => {
    setUploading(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: PREVIZ_KEY, value: '', updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
      setCurrentUrl(null);
      toast.success('Reset to the bundled default movie');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Format guidance */}
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="text-foreground font-medium">Before you upload</p>
          <p>
            Use a browser-playable <span className="text-foreground">.mp4 (H.264)</span> — an AME export, not a Resolume
            DXV .mov (browsers can't decode DXV).
          </p>
          <p>
            It must be rendered against the standard <span className="text-foreground">3840×2160 SOLEIA pixel map</span>,
            or the screens will sample the wrong regions.
          </p>
        </div>
      </div>

      {/* Current active movie */}
      <div className="rounded-lg border border-border bg-card/80 p-5">
        <div className="mb-3 flex items-center gap-2">
          <MonitorPlay className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Active Previz</h3>
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : currentUrl ? (
          <div className="space-y-3">
            <video
              src={currentUrl}
              controls
              muted
              playsInline
              className="w-full max-w-md rounded-md border border-border bg-black"
            />
            <p className="break-all text-xs text-muted-foreground">{currentUrl}</p>
            <Button variant="outline" size="sm" onClick={handleReset} disabled={uploading}>
              Reset to bundled default
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No custom movie set — the page uses the bundled default (Vanderpump previz).
          </p>
        )}
      </div>

      {/* Uploader */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,.mp4,.webm"
          onChange={(e) => pickFile(e.target.files?.[0])}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          disabled={uploading}
        />
        {!file ? (
          <div className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Drop the previz .mp4 here or click to browse</p>
              <p className="mt-1 text-xs text-muted-foreground">MP4 (H.264) up to 500MB</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-16 w-24 items-center justify-center rounded bg-muted">
              <FileVideo className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="max-w-[220px] truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
            <Button variant="ghost" size="icon" onClick={clearFile} disabled={uploading}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uploading…</span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
        {uploading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</>
        ) : (
          <><Check className="mr-2 h-4 w-4" /> Set as active previz</>
        )}
      </Button>
    </div>
  );
}
