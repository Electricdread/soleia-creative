/**
 * Video compression utility for creating lower-quality preview versions
 * Uses MediaRecorder API to re-encode videos at lower bitrate
 */

export interface CompressionProgress {
  stage: 'loading' | 'processing' | 'encoding' | 'complete';
  progress: number;
}

export interface CompressionResult {
  previewBlob: Blob;
  thumbnailBlob: Blob;
  duration: string;
  resolution: string;
}

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

export async function compressVideo(
  file: File,
  onProgress?: (progress: CompressionProgress) => void
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    onProgress?.({ stage: 'loading', progress: 0 });

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = async () => {
      const originalWidth = video.videoWidth;
      const originalHeight = video.videoHeight;
      const duration = video.duration;

      // Calculate preview dimensions (max 720p, maintain aspect ratio)
      const maxWidth = 1280;
      const maxHeight = 720;
      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      if (originalWidth > maxWidth || originalHeight > maxHeight) {
        const scale = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
        targetWidth = Math.floor(originalWidth * scale);
        targetHeight = Math.floor(originalHeight * scale);
      }

      // Ensure even dimensions (required for video encoding)
      targetWidth = targetWidth - (targetWidth % 2);
      targetHeight = targetHeight - (targetHeight % 2);

      onProgress?.({ stage: 'processing', progress: 20 });

      // Create canvas for video processing
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d')!;

      // Capture thumbnail at 1 second or 25% of duration
      video.currentTime = Math.min(1, duration * 0.25);
      
      await new Promise<void>((res) => {
        video.onseeked = () => res();
      });

      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      const thumbnailBlob = await new Promise<Blob>((res) => {
        canvas.toBlob((blob) => res(blob!), 'image/jpeg', 0.85);
      });

      onProgress?.({ stage: 'encoding', progress: 40 });

      // Reset video for encoding
      video.currentTime = 0;
      await new Promise<void>((res) => {
        video.onseeked = () => res();
      });

      // Use MediaRecorder to create compressed preview
      const stream = canvas.captureStream(30); // 30fps
      
      // Try to get audio from video if available
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const destination = audioCtx.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioCtx.destination);
        destination.stream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      } catch (e) {
        // Video might not have audio, continue without it
        console.log('No audio track or audio context not supported');
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 4000000, // 4 Mbps for good preview quality
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const previewBlob = new Blob(chunks, { type: 'video/webm' });
        URL.revokeObjectURL(objectUrl);
        
        onProgress?.({ stage: 'complete', progress: 100 });
        
        resolve({
          previewBlob,
          thumbnailBlob,
          duration: formatDuration(duration),
          resolution: getResolutionLabel(originalWidth, originalHeight),
        });
      };

      recorder.onerror = (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Recording failed: ' + e));
      };

      // Start recording and playback
      recorder.start(100);
      video.play();

      // Draw frames to canvas
      const drawFrame = () => {
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          const progress = 40 + (video.currentTime / duration) * 55;
          onProgress?.({ stage: 'encoding', progress });
          requestAnimationFrame(drawFrame);
        }
      };
      drawFrame();

      // Stop when video ends
      video.onended = () => {
        recorder.stop();
      };
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video'));
    };
  });
}

/**
 * Simpler compression that just extracts thumbnail without re-encoding
 * Use this as fallback or for quick preview
 */
export async function extractVideoMetadata(
  file: File
): Promise<{ thumbnailBlob: Blob; duration: string; resolution: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = async () => {
      const originalWidth = video.videoWidth;
      const originalHeight = video.videoHeight;
      const duration = video.duration;

      // Seek to thumbnail position
      video.currentTime = Math.min(1, duration * 0.25);
      
      await new Promise<void>((res) => {
        video.onseeked = () => res();
      });

      // Create thumbnail
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(640, originalWidth);
      canvas.height = Math.floor(canvas.width * (originalHeight / originalWidth));
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const thumbnailBlob = await new Promise<Blob>((res) => {
        canvas.toBlob((blob) => res(blob!), 'image/jpeg', 0.85);
      });

      URL.revokeObjectURL(objectUrl);
      
      resolve({
        thumbnailBlob,
        duration: formatDuration(duration),
        resolution: getResolutionLabel(originalWidth, originalHeight),
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video'));
    };
  });
}
