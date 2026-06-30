## Problem
Clients see stale errors on proposals after deployments because the Vite PWA service worker caches the old app shell. They don’t know how to hard-refresh or unregister the service worker.

## Solution
Add a one-click **Clear Cache & Reload** button to the client-facing proposal page. When clicked it:
1. Unregisters all service workers
2. Clears the browser’s Cache Storage (Workbox caches)
3. Reloads the page with `location.reload(true)` so the browser fetches the latest app version

## Implementation

### 1. Reusable utility — `src/lib/clearAppCache.ts`
Expose an async function that:
- Calls `navigator.serviceWorker.getRegistrations()` and `.unregister()` on each
- Calls `caches.keys()` and deletes every cache
- Returns a promise that resolves when cleanup is complete

### 2. Button component — `src/components/ClearCacheButton.tsx`
- Uses the utility above
- Shows a brief loading state while clearing
- Calls `window.location.reload()` on completion
- Styled as a small secondary button with a refresh icon (fits in the proposal header or error state)

### 3. Integrate into proposal page
Add the button in two places on `ClientProposal.tsx`:
- **Error state**: When the proposal returns “Not Found” or any error, render the clear-cache button alongside the error message with copy like *“If you’ve seen this before, clear cache and reload.”*
- **Normal view**: Place a subtle icon button in the top-right header (next to the Back / PDF buttons) so clients can trigger it at any time if the page feels stale.

### 4. Scope
- This only touches the client proposal page (`/proposal/:token`) because that’s the client-facing page the user is concerned about.
- No backend changes.
- No changes to the PWA config in `vite.config.ts`.

## Result
Clients see a single button. One tap clears the old PWA cache and reloads the page with the latest version — no need for them to learn browser developer tools.