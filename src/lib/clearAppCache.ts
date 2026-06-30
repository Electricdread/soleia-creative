/**
 * Unregisters all service workers and deletes all Cache Storage entries.
 * Resolves when cleanup is complete (or when nothing is registered).
 */
export async function clearAppCache(): Promise<void> {
  // 1. Unregister every service worker
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }

  // 2. Delete every cache bucket
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  }
}
