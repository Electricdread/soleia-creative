import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Camera, Loader2, Play, Pause, Wand2 } from 'lucide-react';

interface FramePickerProps {
  videoUrl: string;
  currentThumbnail?: string;
  onFrameCaptured: (thumbnailBlob: Blob) => void;
  isCapturing?: boolean;
}

interface FrameCandidate {
  time: number;
  score: number;
  dataUrl: string;
}

// Calculate image quality score based on contrast and color variance
function calculateFrameScore(imageData: ImageData): number {
  const data = imageData.data;
  const pixelCount = data.length / 4;
  
  let totalBrightness = 0;
  let rSum = 0, gSum = 0, bSum = 0;
  let rSqSum = 0, gSqSum = 0, bSqSum = 0;
  
  // Calculate means and sums for variance
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;
    
    rSum += r;
    gSum += g;
    bSum += b;
    rSqSum += r * r;
    gSqSum += g * g;
    bSqSum += b * b;
  }
  
  const avgBrightness = totalBrightness / pixelCount;
  const rMean = rSum / pixelCount;
  const gMean = gSum / pixelCount;
  const bMean = bSum / pixelCount;
  
  // Calculate variance (contrast indicator)
  const rVariance = (rSqSum / pixelCount) - (rMean * rMean);
  const gVariance = (gSqSum / pixelCount) - (gMean * gMean);
  const bVariance = (bSqSum / pixelCount) - (bMean * bMean);
  const totalVariance = rVariance + gVariance + bVariance;
  
  // Penalize very dark or very bright frames
  const brightnessPenalty = Math.abs(avgBrightness - 128) / 128;
  
  // Penalize low contrast frames
  const contrastScore = Math.sqrt(totalVariance) / 255;
  
  // Calculate color diversity (avoid monochrome frames)
  const colorDiversity = Math.abs(rMean - gMean) + Math.abs(gMean - bMean) + Math.abs(bMean - rMean);
  const colorScore = colorDiversity / 255;
  
  // Combined score: high contrast + good brightness + color diversity
  const score = (contrastScore * 0.5) + ((1 - brightnessPenalty) * 0.3) + (colorScore * 0.2);
  
  return score;
}

export function FramePicker({ 
  videoUrl, 
  currentThumbnail, 
  onFrameCaptured,
  isCapturing = false 
}: FramePickerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [previewFrame, setPreviewFrame] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [autoGenProgress, setAutoGenProgress] = useState(0);

  // Update current time display while playing
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [isVideoLoaded]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      setIsVideoLoaded(true);
      setVideoError(false);
      // Seek to 1 second or 10% of video initially
      video.currentTime = Math.min(1, video.duration * 0.1);
    }
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (video && isVideoLoaded) {
      video.currentTime = value[0];
      setCurrentTime(value[0]);
      capturePreviewFrame();
    }
  }, [isVideoLoaded]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  }, []);

  const capturePreviewFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get preview data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewFrame(dataUrl);
  }, []);

  const handleCaptureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pause video if playing
    video.pause();

    // Set canvas to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and callback
    canvas.toBlob((blob) => {
      if (blob) {
        onFrameCaptured(blob);
      }
    }, 'image/jpeg', 0.9);
  }, [onFrameCaptured]);

  const autoGenerateThumbnail = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isVideoLoaded) return;

    setIsAutoGenerating(true);
    setAutoGenProgress(0);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsAutoGenerating(false);
      return;
    }

    // Pause video
    video.pause();

    // Sample 20 frames throughout the video (skip first and last 5%)
    const sampleCount = 20;
    const startTime = duration * 0.05;
    const endTime = duration * 0.95;
    const interval = (endTime - startTime) / sampleCount;

    const candidates: FrameCandidate[] = [];

    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    for (let i = 0; i < sampleCount; i++) {
      const sampleTime = startTime + (i * interval);
      
      // Seek to frame
      video.currentTime = sampleTime;
      
      // Wait for seek to complete
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
      });

      // Small delay for frame to render
      await new Promise(r => setTimeout(r, 50));

      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const score = calculateFrameScore(imageData);

      // Store candidate
      candidates.push({
        time: sampleTime,
        score,
        dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      });

      setAutoGenProgress(((i + 1) / sampleCount) * 100);
    }

    // Find best frame
    const bestFrame = candidates.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    // Seek to best frame and capture
    video.currentTime = bestFrame.time;
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
    });

    setCurrentTime(bestFrame.time);
    setPreviewFrame(bestFrame.dataUrl);

    // Convert best frame to blob
    canvas.toBlob((blob) => {
      if (blob) {
        onFrameCaptured(blob);
      }
      setIsAutoGenerating(false);
      setAutoGenProgress(0);
    }, 'image/jpeg', 0.9);

  }, [duration, isVideoLoaded, onFrameCaptured]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  if (!videoUrl) {
    return (
      <div className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded-lg text-center">
        No video URL available to pick frame from
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-foreground">Pick Thumbnail Frame</div>
      
      {/* Video Player */}
      <div className="relative bg-muted rounded-lg overflow-hidden">
        {videoError ? (
          <div className="aspect-video flex items-center justify-center text-muted-foreground text-sm">
            Failed to load video
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full aspect-video object-contain bg-black"
            onLoadedMetadata={handleLoadedMetadata}
            onSeeked={capturePreviewFrame}
            onError={() => setVideoError(true)}
            playsInline
            muted
            crossOrigin="anonymous"
          />
        )}
        
        {!isVideoLoaded && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Timeline Scrubber */}
      {isVideoLoaded && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              className="h-8 w-8"
              disabled={isAutoGenerating}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <Slider
              value={[currentTime]}
              min={0}
              max={duration}
              step={0.01}
              onValueChange={handleSeek}
              className="flex-1"
              disabled={isAutoGenerating}
            />
            
            <span className="text-xs text-muted-foreground font-mono min-w-[70px]">
              {formatTime(currentTime)}
            </span>
          </div>

          {/* Auto-generate progress */}
          {isAutoGenerating && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Analyzing frames...</span>
                <span>{Math.round(autoGenProgress)}%</span>
              </div>
              <Progress value={autoGenProgress} className="h-1" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={autoGenerateThumbnail}
              disabled={isCapturing || isAutoGenerating}
              variant="default"
            >
              {isAutoGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Finding best...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Auto Pick Best
                </>
              )}
            </Button>
            
            <Button
              onClick={handleCaptureFrame}
              disabled={isCapturing || isAutoGenerating}
              variant="secondary"
            >
              {isCapturing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Frame
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Preview Comparison */}
      {(previewFrame || currentThumbnail) && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Current Thumbnail</div>
            {currentThumbnail ? (
              <img 
                src={currentThumbnail} 
                alt="Current thumbnail"
                className="w-full aspect-video object-cover rounded border border-border"
              />
            ) : (
              <div className="w-full aspect-video bg-muted rounded border border-border flex items-center justify-center text-xs text-muted-foreground">
                None
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Selected Frame</div>
            {previewFrame ? (
              <img 
                src={previewFrame} 
                alt="Selected frame preview"
                className="w-full aspect-video object-cover rounded border border-primary/50"
              />
            ) : (
              <div className="w-full aspect-video bg-muted rounded border border-border flex items-center justify-center text-xs text-muted-foreground">
                Scrub to preview
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
