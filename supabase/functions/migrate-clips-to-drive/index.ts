// One-shot batch migrator: pulls original clips from Supabase `clips` bucket,
// uploads them to Google Drive (resumable, streamed), updates cached_clips row,
// and deletes the Supabase original to free the 8 GB quota.
//
// Body (optional): { batchSize?: number, mode?: 'cached' | 'orphans' | 'count' }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/google_drive';

// Edge functions cap around 256 MB RAM. Even with streaming we stay safe by
// skipping anything bigger than this — those files must be moved manually.
const MAX_FILE_BYTES = 200 * 1024 * 1024; // 200 MB

function quarterFolderName(d = new Date()) {
  const year = d.getUTCFullYear();
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `${year}-Q${q}`;
}

async function gatewayJson(path: string, init: RequestInit, lovableKey: string, driveKey: string) {
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': driveKey,
    },
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) throw new Error(`Drive gateway ${path} [${res.status}]: ${text.slice(0, 400)}`);
  return json;
}

async function findOrCreateFolder(name: string, parentId: string | null, lovableKey: string, driveKey: string) {
  const parentClause = parentId ? ` and '${parentId}' in parents` : '';
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and trashed=false${parentClause}`,
  );
  const list = await gatewayJson(
    `/drive/v3/files?q=${q}&fields=files(id)&pageSize=1`,
    { method: 'GET' }, lovableKey, driveKey,
  );
  if (list?.files?.length) return list.files[0].id as string;

  const body: Record<string, unknown> = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) body.parents = [parentId];
  const created = await gatewayJson(
    '/drive/v3/files?fields=id',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    lovableKey, driveKey,
  );
  return created.id as string;
}

/**
 * Stream a Blob to Google Drive using the resumable upload protocol.
 * Memory stays flat because Deno's fetch supports ReadableStream bodies —
 * we never materialise the whole file in RAM.
 *
 * Falls back to single-shot streamed `uploadType=media` + PATCH metadata
 * if the gateway strips the `Location` header from the resumable init.
 */
async function uploadStreamToDrive(
  blob: Blob, filename: string, mimeType: string, parentId: string,
  lovableKey: string, driveKey: string,
): Promise<{ id: string; webViewLink?: string }> {
  // ---- Try resumable upload first ----
  const initRes = await fetch(
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

  const sessionUrl =
    initRes.headers.get('Location') ||
    initRes.headers.get('location') ||
    initRes.headers.get('X-Goog-Upload-URL');

  if (initRes.ok && sessionUrl) {
    const put = await fetch(sessionUrl, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
      body: blob.stream(),
      // @ts-ignore — Deno requires duplex for streaming bodies
      duplex: 'half',
    });
    const text = await put.text();
    if (!put.ok) throw new Error(`Drive resumable PUT failed [${put.status}]: ${text.slice(0, 400)}`);
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Drive resumable PUT returned non-JSON: ${text.slice(0, 200)}`);
    }
  }

  // ---- Fallback: streamed single-shot, then PATCH metadata ----
  console.warn(
    `Resumable init failed (status=${initRes.status}, hasLocation=${!!sessionUrl}). Falling back to media upload.`,
  );

  const mediaRes = await fetch(
    `${GATEWAY}/upload/drive/v3/files?uploadType=media&fields=id,webViewLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': driveKey,
        'Content-Type': mimeType,
      },
      body: blob.stream(),
      // @ts-ignore
      duplex: 'half',
    },
  );
  const mediaText = await mediaRes.text();
  if (!mediaRes.ok) {
    throw new Error(`Drive media upload failed [${mediaRes.status}]: ${mediaText.slice(0, 400)}`);
  }
  const created = JSON.parse(mediaText);

  // Set name + parents via PATCH (metadata-only)
  const patched = await gatewayJson(
    `/drive/v3/files/${created.id}?addParents=${parentId}&fields=id,webViewLink`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: filename }),
    },
    lovableKey, driveKey,
  );
  return { id: created.id, webViewLink: patched?.webViewLink };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const driveKey = Deno.env.get('GOOGLE_DRIVE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!lovableKey) throw new Error('LOVABLE_API_KEY is not configured');
    if (!driveKey) throw new Error('GOOGLE_DRIVE_API_KEY is not configured');
    if (!supabaseUrl || !serviceKey) throw new Error('Supabase env not configured');

    const { batchSize, mode = 'cached' } = await req.json().catch(() => ({}));
    // Smaller default for orphan mode (large videos), larger for cached (small files)
    const defaultBatch = mode === 'orphans' ? 2 : 5;
    const limit = Math.max(1, Math.min(20, Number(batchSize ?? defaultBatch)));

    const admin = createClient(supabaseUrl, serviceKey);

    // ===== COUNT mode =====
    if (mode === 'count') {
      let total = 0;
      let totalBytes = 0;
      let offset = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await admin.storage.from('clips').list('', {
          limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' },
        });
        if (error) throw error;
        if (!data || data.length === 0) break;
        for (const f of data) {
          if (f.id) {
            total += 1;
            const sz = (f.metadata as Record<string, unknown> | null)?.size;
            if (typeof sz === 'number') totalBytes += sz;
          }
        }
        if (data.length < pageSize) break;
        offset += pageSize;
      }
      return new Response(
        JSON.stringify({ totalOrphans: total, totalBytes }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const rootId = await findOrCreateFolder('Soleia Originals', null, lovableKey, driveKey);
    const quarterId = await findOrCreateFolder(quarterFolderName(), rootId, lovableKey, driveKey);

    // ===== ORPHANS mode =====
    if (mode === 'orphans') {
      // Pull a slightly bigger window so we can skip oversize files and still
      // process `limit` reasonable ones in a single invocation.
      const window = Math.max(limit * 4, 10);
      const { data: files, error: listErr } = await admin.storage.from('clips').list('', {
        limit: window, sortBy: { column: 'name', order: 'asc' },
      });
      if (listErr) throw listErr;

      const succeeded: Array<Record<string, unknown>> = [];
      const failed: Array<Record<string, unknown>> = [];
      let processedReal = 0;

      for (const file of files ?? []) {
        if (!file.id) continue;
        if (processedReal >= limit) break;

        const sizeBytes = Number((file.metadata as Record<string, unknown> | null)?.size ?? 0);

        // Skip giants — they OOM the function. User must move these manually.
        if (sizeBytes > MAX_FILE_BYTES) {
          failed.push({
            id: file.name,
            title: file.name,
            error: `too large (${(sizeBytes / 1024 / 1024).toFixed(0)} MB) — download from bucket and upload to Drive manually`,
            sizeBytes,
            skipped: true,
          });
          continue;
        }

        processedReal += 1;
        try {
          const dl = await admin.storage.from('clips').download(file.name);
          if (dl.error || !dl.data) {
            failed.push({ id: file.name, title: file.name, error: dl.error?.message || 'download failed' });
            continue;
          }
          const mimeType = (dl.data as Blob).type || 'video/mp4';
          const uploaded = await uploadStreamToDrive(
            dl.data as Blob, file.name, mimeType, quarterId, lovableKey, driveKey,
          );
          const rm = await admin.storage.from('clips').remove([file.name]);
          if (rm.error) console.warn('Supabase remove warning:', rm.error.message);
          succeeded.push({
            id: file.name,
            title: file.name,
            driveFileId: uploaded.id,
            driveWebViewLink: uploaded.webViewLink ?? null,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`Orphan migration failed for ${file.name}:`, msg);
          failed.push({ id: file.name, title: file.name, error: msg });
        }
      }

      // Quick recount (cap at one page — UI will refresh full count separately)
      let remaining = 0;
      const { data: remData } = await admin.storage.from('clips').list('', {
        limit: 1000, sortBy: { column: 'name', order: 'asc' },
      });
      remaining = (remData ?? []).filter((f) => f.id).length;

      // `processed` counts files we attempted (succeeded + failed including skips).
      // `migratable` tells the client whether any non-skipped work was done — used
      // to break the auto-loop when only oversized files remain.
      const migratable = succeeded.length + failed.filter((f) => !f.skipped).length;

      return new Response(
        JSON.stringify({
          processed: succeeded.length + failed.length,
          migratable,
          succeeded, failed, remaining,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ===== CACHED mode (db-tracked clips) =====
    const { data: clips, error: queryErr } = await admin
      .from('cached_clips')
      .select('id, title, video_url, original_storage')
      .eq('original_storage', 'supabase')
      .not('video_url', 'is', null)
      .like('video_url', '%/storage/v1/object/public/clips/%')
      .limit(limit);
    if (queryErr) throw queryErr;

    const { count: remainingBefore } = await admin
      .from('cached_clips')
      .select('id', { count: 'exact', head: true })
      .eq('original_storage', 'supabase')
      .not('video_url', 'is', null)
      .like('video_url', '%/storage/v1/object/public/clips/%');

    const succeeded: Array<Record<string, unknown>> = [];
    const failed: Array<Record<string, unknown>> = [];

    for (const clip of clips ?? []) {
      try {
        const url: string = clip.video_url;
        const marker = '/storage/v1/object/public/clips/';
        const idx = url.indexOf(marker);
        if (idx === -1) {
          failed.push({ id: clip.id, title: clip.title, error: 'unrecognized URL' });
          continue;
        }
        const objectPath = decodeURIComponent(url.slice(idx + marker.length));

        const dl = await admin.storage.from('clips').download(objectPath);
        if (dl.error || !dl.data) {
          failed.push({ id: clip.id, title: clip.title, error: dl.error?.message || 'download failed' });
          continue;
        }

        const blob = dl.data as Blob;
        if (blob.size > MAX_FILE_BYTES) {
          failed.push({
            id: clip.id,
            title: clip.title,
            error: `too large (${(blob.size / 1024 / 1024).toFixed(0)} MB) — migrate manually`,
            skipped: true,
          });
          continue;
        }

        const filename = `${clip.id}-${objectPath.split('/').pop() ?? 'clip.bin'}`;
        const mimeType = blob.type || 'video/mp4';

        const uploaded = await uploadStreamToDrive(
          blob, filename, mimeType, quarterId, lovableKey, driveKey,
        );

        const { error: updErr } = await admin
          .from('cached_clips')
          .update({
            drive_file_id: uploaded.id,
            drive_web_view_link: uploaded.webViewLink ?? null,
            original_storage: 'drive',
            video_url: null,
          })
          .eq('id', clip.id);
        if (updErr) throw updErr;

        const rm = await admin.storage.from('clips').remove([objectPath]);
        if (rm.error) console.warn('Supabase remove warning:', rm.error.message);

        succeeded.push({
          id: clip.id,
          title: clip.title,
          driveFileId: uploaded.id,
          driveWebViewLink: uploaded.webViewLink ?? null,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Migration failed for ${clip.id}:`, msg);
        failed.push({ id: clip.id, title: clip.title, error: msg });
      }
    }

    const remaining = Math.max(0, (remainingBefore ?? 0) - succeeded.length);
    const migratable = succeeded.length + failed.filter((f) => !f.skipped).length;

    return new Response(
      JSON.stringify({
        processed: succeeded.length + failed.length,
        migratable,
        succeeded,
        failed,
        remaining,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('migrate-clips-to-drive error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
