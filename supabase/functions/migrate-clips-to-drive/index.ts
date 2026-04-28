// One-shot batch migrator: pulls original clips from Supabase `clips` bucket,
// uploads them to Google Drive, updates cached_clips row, and deletes the
// Supabase original to free the 8 GB quota.
//
// Body (optional): { batchSize?: number }  default 5

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/google_drive';

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

async function uploadBlobToDrive(
  blob: Blob, filename: string, mimeType: string, parentId: string,
  lovableKey: string, driveKey: string,
) {
  const boundary = '----soleia-' + crypto.randomUUID();
  const metadata = { name: filename, parents: [parentId], mimeType };
  const fileBuf = new Uint8Array(await blob.arrayBuffer());
  const enc = new TextEncoder();
  const head = enc.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) + `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  );
  const tail = enc.encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(head.length + fileBuf.length + tail.length);
  body.set(head, 0); body.set(fileBuf, head.length); body.set(tail, head.length + fileBuf.length);

  return await gatewayJson(
    '/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body },
    lovableKey, driveKey,
  );
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

    const { batchSize = 5, mode = 'cached' } = await req.json().catch(() => ({}));
    const limit = Math.max(1, Math.min(20, Number(batchSize)));

    const admin = createClient(supabaseUrl, serviceKey);

    // ===== COUNT mode: just return orphan stats from clips bucket =====
    if (mode === 'count') {
      let total = 0;
      let totalBytes = 0;
      let offset = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await admin.storage.from('clips').list('', {
          limit: pageSize,
          offset,
          sortBy: { column: 'name', order: 'asc' },
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

    // Ensure root + quarter folders (used by both cached + orphans modes)
    const rootId = await findOrCreateFolder('Soleia Originals', null, lovableKey, driveKey);
    const quarterId = await findOrCreateFolder(quarterFolderName(), rootId, lovableKey, driveKey);

    // ===== ORPHANS mode: migrate raw bucket files not tracked in cached_clips =====
    if (mode === 'orphans') {
      const { data: files, error: listErr } = await admin.storage.from('clips').list('', {
        limit,
        sortBy: { column: 'name', order: 'asc' },
      });
      if (listErr) throw listErr;

      const succeeded: Array<Record<string, unknown>> = [];
      const failed: Array<Record<string, unknown>> = [];

      for (const file of files ?? []) {
        if (!file.id) continue;
        try {
          const dl = await admin.storage.from('clips').download(file.name);
          if (dl.error || !dl.data) {
            failed.push({ id: file.name, title: file.name, error: dl.error?.message || 'download failed' });
            continue;
          }
          const mimeType = (dl.data as Blob).type || 'video/mp4';
          const uploaded = await uploadBlobToDrive(
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

      // Recount remaining
      let remaining = 0;
      let offset = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await admin.storage.from('clips').list('', {
          limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' },
        });
        if (error) break;
        if (!data || data.length === 0) break;
        remaining += data.filter((f) => f.id).length;
        if (data.length < pageSize) break;
        offset += pageSize;
      }

      return new Response(
        JSON.stringify({
          processed: succeeded.length + failed.length,
          succeeded, failed, remaining,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Find candidates: clips not yet on Drive that have a Supabase video_url
    const { data: clips, error: queryErr } = await admin
      .from('cached_clips')
      .select('id, title, video_url, original_storage')
      .eq('original_storage', 'supabase')
      .not('video_url', 'is', null)
      .like('video_url', '%/storage/v1/object/public/clips/%')
      .limit(limit);

    if (queryErr) throw queryErr;

    // Total remaining count (for UI progress)
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

        // Download from Supabase
        const dl = await admin.storage.from('clips').download(objectPath);
        if (dl.error || !dl.data) {
          failed.push({ id: clip.id, title: clip.title, error: dl.error?.message || 'download failed' });
          continue;
        }

        const filename = `${clip.id}-${objectPath.split('/').pop() ?? 'clip.bin'}`;
        const mimeType = (dl.data as Blob).type || 'video/mp4';

        const uploaded = await uploadBlobToDrive(
          dl.data as Blob, filename, mimeType, quarterId, lovableKey, driveKey,
        );

        // Update DB
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

        // Delete from Supabase
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

    return new Response(
      JSON.stringify({
        processed: succeeded.length + failed.length,
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
