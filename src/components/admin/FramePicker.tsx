import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Camera, Loader2, Play, Pause } from 'lucide-react';

interface FramePickerProps {
  videoUrl: string;
  currentThumbnail?: string;
  onFrameCaptured: (thumbnailBlob: Blob) => void;
  isCapturing?: boolean;
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
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              className="h-8 w-8"
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
            />
            
            <span className="text-xs text-muted-foreground font-mono min-w-[70px]">
              {formatTime(currentTime)}
            </span>
          </div>

          {/* Capture Button */}
          <Button
            onClick={handleCaptureFrame}
            disabled={isCapturing}
            className="w-full"
            variant="secondary"
          >
            {isCapturing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving thumbnail...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Capture This Frame
              </>
            )}
          </Button>
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
