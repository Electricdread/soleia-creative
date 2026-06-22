import fixWebmDuration from 'fix-webm-duration';

/**
 * Previz re-encoder.
 *
 * The 3D venue treats the previz movie as a 3840×2160 LED pixel-map, so we
 * MUST preserve the original frame dimensions — downscaling would scramble
 * the per-screen UV regions.
 *
 * What this does:
 *   1. Re-encodes the uploaded movie to a streaming-friendly WebM
 *      (VP9 if available, VP8 fallback) at a high but web-tunable bitrate.
 *   2. Keeps the audio track via the WebAudio capture path used by the
 *      existing look-book compressor.
 *   3. Reports progress so the upload UI can show a real bar.
 *
 * The output is a single Blob you can hand to Supabase storage directly.
 */

export interface PrevizEncodeProgress {
  stage: 'loading' | 'encoding' | 'finalizing' | 'complete';
  /** 0–100 */
  progress: number;
}

export interface PrevizEncodeResult {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  durationSeconds: number;
}

const PREVIZ_VIDEO_BITRATE = 22_000_000; // 22 Mbps — clean for 3840×2160 LED previz
const PREVIZ_AUDIO_BITRATE = 192_000;
const TARGET_FPS = 30;

/**
 * Pick the best WebM codec the current browser actually supports. VP9 first
 * (better quality at the same bitrate), then VP8, then bare WebM.
 */
function pickMimeType(): string {
  const candidates = [
    'video/mp4;codecs=avc1.640028,mp4a.40.2',
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) {
      return c;
    }
  }
  return 'video/webm';
}

/**
 * Re-encode a previz movie in the browser, preserving its original
 * resolution. Returns a new WebM blob plus playback metadata.
 */
export async function reencodePrevizForPlayback(
  file: File,
  onProgress?: (p: PrevizEncodeProgress) => void,
): Promise<PrevizEncodeResult> {
  return new Promise((resolve, reject) => {
    onProgress?.({ stage: 'loading', progress: 0 });

    const video = document.createElement('video');
    video.muted = false;
    video.volume = 1;
    video.playsInline = true;
    video.preload = 'auto';
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    video.onerror = () => {
      cleanup();
      reject(new Error('Could not decode the source movie for re-encoding.'));
    };

    video.onloadedmetadata = async () => {
      // Preserve LED pixel-map dimensions — must be even for the encoder.
      const w = Math.max(2, video.videoWidth - (video.videoWidth % 2));
      const h = Math.max(2, video.videoHeight - (video.videoHeight % 2));
      const duration = video.duration || 0;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        cleanup();
        reject(new Error('Canvas 2D not available for re-encoding.'));
        return;
      }

      const stream = (canvas as HTMLCanvasElement).captureStream(TARGET_FPS);

      // Pull audio from the source video so the encoder gets a real
      // MediaStreamTrack. Native capture is most reliable when available;
      // WebAudio is the fallback for browsers that expose no captureStream().
      let audioCtx: AudioContext | null = null;
      let audioTrackAdded = false;
      const captureStream =
        (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).captureStream ??
        (video as HTMLVideoElement & { mozCaptureStream?: () => MediaStream }).mozCaptureStream;
      try {
        captureStream?.call(video).getAudioTracks().forEach((t) => {
          stream.addTrack(t);
          audioTrackAdded = true;
        });
      } catch {
        audioTrackAdded = false;
      }
      try {
        if (audioTrackAdded) throw new Error('Audio track already captured');
        const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) throw new Error('AudioContext unavailable');
        audioCtx = new AudioContextClass();
        // Browsers create AudioContexts in 'suspended' state until a user
        // gesture resumes them. If we skip this, the MediaElementSource never
        // pumps samples into the MediaStreamDestination and the resulting
        // WebM ships with a silent (or missing) audio track.
        if (audioCtx.state === 'suspended') {
          try { await audioCtx.resume(); } catch { /* noop */ }
        }
        const srcNode = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        const silentOutput = audioCtx.createGain();
        silentOutput.gain.value = 0;
        srcNode.connect(dest);
        // Keep the media element's audio graph active without monitoring it
        // through the speakers during the encode pass.
        srcNode.connect(silentOutput);
        silentOutput.connect(audioCtx.destination);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      } catch {
        // Movie has no audio, or the browser blocks the capture. Encode video only.
      }

      const mimeType = pickMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: PREVIZ_VIDEO_BITRATE,
          audioBitsPerSecond: PREVIZ_AUDIO_BITRATE,
        });
      } catch (e) {
        cleanup();
        audioCtx?.close().catch(() => {});
        reject(e instanceof Error ? e : new Error('MediaRecorder failed to initialise.'));
        return;
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onerror = (e) => {
        cleanup();
        audioCtx?.close().catch(() => {});
        const eventError = (e as Event & { error?: unknown }).error;
        const message = eventError instanceof Error ? eventError.message : 'unknown recorder error';
        reject(new Error('Re-encoding failed: ' + message));
      };
      recorder.onstop = async () => {
        onProgress?.({ stage: 'finalizing', progress: 98 });
        const rawBlob = new Blob(chunks, { type: mimeType.split(';')[0] });
        let blob = rawBlob;
        try {
          // Browser MediaRecorder WebM output often omits duration metadata.
          // Without this, HTMLVideoElement reports duration as 0/Infinity, so
          // cue markers collapse to the left edge and seeking behaves badly.
          if (rawBlob.type.includes('webm')) {
            blob = await fixWebmDuration(rawBlob, Math.round(duration * 1000), { logger: false });
          }
        } catch {
          blob = rawBlob;
        }
        cleanup();
        audioCtx?.close().catch(() => {});
        onProgress?.({ stage: 'complete', progress: 100 });
        resolve({
          blob,
          mimeType: mimeType.split(';')[0],
          width: w,
          height: h,
          durationSeconds: duration,
        });
      };

      recorder.start(1000);

      let raf = 0;
      const draw = () => {
        if (video.paused || video.ended) return;
        ctx.drawImage(video, 0, 0, w, h);
        if (duration > 0) {
          const pct = Math.min(95, (video.currentTime / duration) * 95);
          onProgress?.({ stage: 'encoding', progress: pct });
        }
        raf = requestAnimationFrame(draw);
      };

      video.onended = () => {
        cancelAnimationFrame(raf);
        try {
          // Flush the final canvas frame so the trailing seconds aren't black.
          ctx.drawImage(video, 0, 0, w, h);
        } catch {
          /* noop */
        }
        if (recorder.state !== 'inactive') recorder.stop();
      };

      try {
        if (audioCtx?.state === 'suspended') {
          try { await audioCtx.resume(); } catch { /* noop */ }
        }
        await video.play();
      } catch (e) {
        cancelAnimationFrame(raf);
        if (recorder.state !== 'inactive') recorder.stop();
        cleanup();
        audioCtx?.close().catch(() => {});
        reject(
          new Error(
            'Browser blocked playback of the source movie. Try a different browser or upload as MP4/WebM.',
          ),
        );
        return;
      }
      draw();
    };
  });
}
