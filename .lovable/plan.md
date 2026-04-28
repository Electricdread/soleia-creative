# Fix Orphan Migration OOM Crashes

## Problem
Edge function `migrate-clips-to-drive` is killed with **"Memory limit exceeded"** every run. Files in the `clips` bucket are up to **270 MB each**, but the current uploader buffers the whole file (`blob.arrayBuffer()` + concatenated `Uint8Array`) → ~540 MB peak RAM, well over the ~256 MB edge function cap.

## Fix

### 1. Edge function: `supabase/functions/migrate-clips-to-drive/index.ts`

**a. New streamed uploader using Drive's resumable upload protocol**
- `POST /upload/drive/v3/files?uploadType=resumable` with metadata only → Drive returns a session URL in the `Location` header.
- `PUT` the body to that session URL using `blob.stream()` directly (Deno fetch supports `ReadableStream` bodies → flat memory).
- Fallback path if the gateway strips the `Location` header: stream `uploadType=media`, then PATCH the file metadata to set name/parents.

**b. Per-file size guard**
- Before downloading, read `file.metadata.size`. If `> 200 MB`, push to `failed[]` with reason `"too large for edge function — download manually from bucket and upload to Drive"` and continue.

**c. Smaller default batch + sequential**
- Default `batchSize` for `orphans` mode: **2** (was 5). Keeps wall-clock per invocation low and avoids CPU timeout.

**d. Better failure isolation**
- Already `try/catch` per file; verify partial successes are still committed when a later file errors.

### 2. UI: `src/components/admin/StoragePanel.tsx`

**a. Render `failed[]` inline** under the orphan section showing filename + reason (so the user sees which giants were skipped).

**b. Loop guard** — stop the "Migrate all orphans" loop when:
- `processed === 0`, OR
- `remaining` did not decrease vs previous iteration (prevents infinite loop on giants that always skip).

**c. Manual-download helper** — for each failed/oversized file, show a "Download from bucket" button that opens the public clips URL so the user can manually push it to Drive.

## Technical snippet
```ts
async function uploadStreamToDrive(blob, filename, mimeType, parentId, lovableKey, driveKey) {
  const init = await fetch(
    `${GATEWAY}/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': driveKey,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(blob.size),
      },
      body: JSON.stringify({ name: filename, parents: [parentId], mimeType }),
    },
  );
  const sessionUrl = init.headers.get('Location') ?? init.headers.get('location');
  if (!sessionUrl) throw new Error('No resumable session URL returned');

  const put = await fetch(sessionUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: blob.stream(),  // streamed — no full buffer in RAM
  });
  if (!put.ok) throw new Error(`Drive PUT failed [${put.status}]: ${await put.text()}`);
  return await put.json();
}

// Per-file guard
const sizeBytes = (file.metadata as any)?.size ?? 0;
if (sizeBytes > 200 * 1024 * 1024) {
  failed.push({ id: file.name, title: file.name, error: 'too large for edge function — download manually' });
  continue;
}
```

## Files modified
- `supabase/functions/migrate-clips-to-drive/index.ts`
- `src/components/admin/StoragePanel.tsx`

## After deploy
You'll be able to migrate files up to ~200 MB automatically (covers most of the bucket). The 8 giant 250–270 MB SKY-SPACE/WAVE files (~2 GB total) will appear in a "Skipped — too large" list with download links so you can move them to Drive by hand.
