// One-shot batch migrator: pulls original clips from Supabase `clips` bucket,
// uploads them to Google Drive (resumable, fully streamed), updates the
// cached_clips row, and deletes the Supabase original to free quota.
//
// Critical: we NEVER buffer the file in the edge function. We create a
// short-lived signed URL, fetch it, and pipe the response body straight to
// Drive's resumable upload session. Memory stays flat regardless of size.
//
// Body (optional): { batchSize?: number, mode?: 'cached' | 'orphans' | 'count' }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/google_drive';

// Streaming uses near-zero RAM, so we can comfortably handle large files.
// Anything bigger than this is migrated manually via "Download from bucket".
const MAX_FILE_BYTES = 500 * 1024 * 1024; // 500 MB
const SIGNED_URL_TTL = 60 * 10; // 10 minutes

function quarterFolderName(d = new Date()) {
  const year = d.getUTCFullYear();
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `${year}-Q${q}`;
}

function mimeFromName(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mkv')) return 'video/x-matroska';
  return 'application/octet-stream';
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
 * Stream a ReadableStream straight to Google Drive via the resumable upload
 * protocol. The body is never buffered in the edge function.
 */
async function uploadStreamToDrive(
  stream: ReadableStream<Uint8Array>,
  sizeBytes: number,
  filename: string,
  mimeType: string,
  parentId: string,
  lovableKey: string,
  driveKey: string,
): Promise<{ id: string; webViewLink?: string }> {
  const initRes = await fetch(
    `${GATEWAY}/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': driveKey,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(sizeBytes),
      },
      body: JSON.stringify({ name: filename, parents: [parentId], mimeType }),
    },
  );

  const sessionUrl =
    initRes.headers.get('Location') ||
    initRes.headers.get('location') ||
    initRes.headers.get('X-Goog-Upload-URL');

  if (!initRes.ok || !sessionUrl) {
    const t = await initRes.text().catch(() => '');
    throw new Error(
      `Drive resumable init failed [${initRes.status}, hasLocation=${!!sessionUrl}]: ${t.slice(0, 300)}`,
    );
  }

  const put = await fetch(sessionUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType, 'Content-Length': String(sizeBytes) },
    body: stream,
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

/**
 * Open a streaming download for a Supabase storage object using a signed URL.
 * Returns the response body stream + the resolved size + content-type.
 */
async function openStorageStream(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  path: string,
  fallbackSize: number,
  fallbackMime: string,
): Promise<{ stream: ReadableStream<Uint8Array>; size: number; mimeType: string }> {
  const signed = await admin.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL);
  if (signed.error || !signed.data?.signedUrl) {
    throw new Error(`signed URL failed: ${signed.error?.message ?? 'no url'}`);
  }
  const res = await fetch(signed.data.signedUrl);
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => '');
    throw new Error(`storage fetch failed [${res.status}]: ${t.slice(0, 200)}`);
  }
  const cl = Number(res.headers.get('content-length') ?? '0');
  const size = cl > 0 ? cl : fallbackSize;
  const mimeType = res.headers.get('content-type') || fallbackMime;
  return { stream: res.body, size, mimeType };
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
    const defaultBatch = mode === 'orphans' ? 1 : 5;
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
      // Pull a full page so we can sort by size and prefer smaller files
      // first — avoids burning the batch on 250 MB giants.
      const { data: files, error: listErr } = await admin.storage.from('clips').list('', {
        limit: 1000, sortBy: { column: 'name', order: 'asc' },
      });
      if (listErr) throw listErr;

      const indexed = (files ?? [])
        .filter((f) => f.id)
        .map((f) => ({
          name: f.name,
          size: Number((f.metadata as Record<string, unknown> | null)?.size ?? 0),
        }))
        .sort((a, b) => a.size - b.size);

      const succeeded: Array<Record<string, unknown>> = [];
      const failed: Array<Record<string, unknown>> = [];
      let processedReal = 0;

      for (const file of indexed) {
        if (processedReal >= limit) break;

        if (file.size > MAX_FILE_BYTES) {
          // Files are size-sorted ascending — once we hit one too big, the
          // rest of this list is also too big. Push them all as skipped so
          // the UI can show download links.
          for (const giant of indexed.slice(indexed.indexOf(file))) {
            failed.push({
              id: giant.name,
              title: giant.name,
              error: `too large (${(giant.size / 1024 / 1024).toFixed(0)} MB) — download from bucket and upload to Drive manually`,
              sizeBytes: giant.size,
              skipped: true,
            });
          }
          break;
        }

        processedReal += 1;
        try {
          const { stream, size, mimeType } = await openStorageStream(
            admin, 'clips', file.name, file.size, mimeFromName(file.name),
          );
          const uploaded = await uploadStreamToDrive(
            stream, size, file.name, mimeType, quarterId, lovableKey, driveKey,
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

      const remaining = indexed.length - succeeded.length;
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

        // Peek at size before streaming so we can skip oversized files cleanly
        const head = await admin.storage.from('clips').list('', {
          limit: 1, search: objectPath.split('/').pop() ?? '',
        });
        const sizeHint = Number(
          (head.data?.[0]?.metadata as Record<string, unknown> | null)?.size ?? 0,
        );
        if (sizeHint > MAX_FILE_BYTES) {
          failed.push({
            id: clip.id,
            title: clip.title,
            error: `too large (${(sizeHint / 1024 / 1024).toFixed(0)} MB) — migrate manually`,
            skipped: true,
          });
          continue;
        }

        const { stream, size, mimeType } = await openStorageStream(
          admin, 'clips', objectPath, sizeHint, mimeFromName(objectPath),
        );
        if (size > MAX_FILE_BYTES) {
          // cancel the stream we opened
          try { await stream.cancel(); } catch { /* ignore */ }
          failed.push({
            id: clip.id,
            title: clip.title,
            error: `too large (${(size / 1024 / 1024).toFixed(0)} MB) — migrate manually`,
            skipped: true,
          });
          continue;
        }

        const filename = `${clip.id}-${objectPath.split('/').pop() ?? 'clip.bin'}`;
        const uploaded = await uploadStreamToDrive(
          stream, size, filename, mimeType, quarterId, lovableKey, driveKey,
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
