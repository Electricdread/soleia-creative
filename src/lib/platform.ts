/**
 * Which modifier this machine actually uses.
 *
 * The palette shipped labelled "⌘K" for everyone, which on Windows names a key
 * that is not on the keyboard.
 */
const detectMac = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const uaPlatform = (navigator as Navigator & { userAgentData?: { platform?: string } })
    .userAgentData?.platform;
  const platform = uaPlatform || navigator.platform || navigator.userAgent || '';
  return /mac|iphone|ipad|ipod/i.test(platform);
};

export const isMac = detectMac();

/** "⌘" on a Mac, "Ctrl" everywhere else. */
export const modKey = isMac ? '⌘' : 'Ctrl';

/** Renders a shortcut the way this machine's keyboard reads: ⌘K / Ctrl K. */
export const shortcut = (key: string) => (isMac ? `${modKey}${key}` : `${modKey} ${key}`);
