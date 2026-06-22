const durationCache = new Map<string, Promise<number>>();

function usableDuration(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function getMediaDuration(url: string): Promise<number> {
  if (!url) return Promise.resolve(0);
  const cached = durationCache.get(url);
  if (cached) return cached;

  const promise = new Promise<number>((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };
    const done = (duration: number) => {
      cleanup();
      resolve(usableDuration(duration) ? duration : 0);
    };

    video.onerror = () => done(0);
    video.onloadedmetadata = () => {
      if (usableDuration(video.duration)) {
        done(video.duration);
        return;
      }

      // MediaRecorder WebM files can report Infinity/0 until forced to seek.
      // Probe on a detached element so the visible previz playback is not moved.
      video.ontimeupdate = () => {
        video.ontimeupdate = null;
        video.onseeked = null;
        done(video.duration);
      };
      video.onseeked = () => done(video.duration);
      try {
        video.currentTime = Number.MAX_SAFE_INTEGER;
      } catch {
        done(0);
      }
    };

    video.src = url;
  });

  durationCache.set(url, promise);
  return promise;
}

export function isUsableDuration(value: number): boolean {
  return usableDuration(value);
}