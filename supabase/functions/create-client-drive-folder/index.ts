// Create a per-client Google Drive folder when a proposal is signed.
// Folder layout:
//   Soleia Clients/
//     <Client Name> — <Event Name>/
//       01_Soleia Creative Guide/
//       02_Pixel Map/
//       03_Client Asset Collect/
// Permissions: parent folder set to anyone-with-link → writer.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/google_drive';

async function gw(path: string, init: RequestInit, lovableKey: string, driveKey: string) {
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
  if (!res.ok) {
    throw new Error(`Drive gateway ${path} failed [${res.status}]: ${text.slice(0, 500)}`);
  }
  return json;
}

async function findOrCreateFolder(
  name: string,
  parentId: string | null,
  lovableKey: string,
  driveKey: string,
): Promise<string> {
  const parentClause = parentId ? ` and '${parentId}' in parents` : '';
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and trashed=false${parentClause}`,
  );
  const list = await gw(
    `/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`,
    { method: 'GET' },
    lovableKey,
    driveKey,
  );
  if (list?.files?.length) return list.files[0].id;

  const body: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) body.parents = [parentId];

  const created = await gw(
    '/drive/v3/files?fields=id',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    lovableKey,
    driveKey,
  );
  return created.id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const driveKey = Deno.env.get('GOOGLE_DRIVE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!lovableKey) throw new Error('LOVABLE_API_KEY is not configured');
    if (!driveKey) throw new Error('GOOGLE_DRIVE_API_KEY is not configured');
    if (!supabaseUrl || !serviceKey) throw new Error('Supabase env not configured');

    const { proposal_id } = await req.json();
    if (!proposal_id || typeof proposal_id !== 'string') {
      return new Response(JSON.stringify({ error: 'proposal_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: proposal, error: fetchErr } = await supabase
      .from('proposals')
      .select('id, event_name, client_name, drive_folder_url, drive_folder_id')
      .eq('id', proposal_id)
      .maybeSingle();

    if (fetchErr) throw new Error(`Fetch proposal failed: ${fetchErr.message}`);
    if (!proposal) throw new Error('Proposal not found');

    // Idempotent: return existing if already created
    if (proposal.drive_folder_url && proposal.drive_folder_id) {
      return new Response(
        JSON.stringify({
          folderUrl: proposal.drive_folder_url,
          folderId: proposal.drive_folder_id,
          existing: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, '-').trim();
    const rootId = await findOrCreateFolder('Soleia Clients', null, lovableKey, driveKey);
    const clientFolderName = `${safe(proposal.client_name)} — ${safe(proposal.event_name)}`;
    const clientFolderId = await findOrCreateFolder(clientFolderName, rootId, lovableKey, driveKey);

    // 3 subfolders
    const [creativeGuideFolderId, pixelMapFolderId, _assetCollectFolderId] = await Promise.all([
      findOrCreateFolder('01_Soleia Creative Guide', clientFolderId, lovableKey, driveKey),
      findOrCreateFolder('02_Pixel Map', clientFolderId, lovableKey, driveKey),
      findOrCreateFolder('03_Client Asset Collect', clientFolderId, lovableKey, driveKey),
    ]);

    // Upload the master Creative Guide Project zip into 01_Soleia Creative Guide
    // (idempotent: skip if a file with the same name already exists in that folder)
    try {
      const zipName = 'SOLEIA - Creative Guide Project.zip';
      const { data: settingRow } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'creative_guide_template_url')
        .maybeSingle();
      const zipUrl = (settingRow?.value && settingRow.value.trim().length > 0)
        ? settingRow.value.trim()
        : `${supabaseUrl}/storage/v1/object/public/creative-guide-template/${encodeURIComponent(zipName)}`;

      const existsQ = encodeURIComponent(
        `name='${zipName.replace(/'/g, "\\'")}' and '${creativeGuideFolderId}' in parents and trashed=false`,
      );
      const existing = await gw(
        `/drive/v3/files?q=${existsQ}&fields=files(id)&pageSize=1`,
        { method: 'GET' },
        lovableKey,
        driveKey,
      );

      if (!existing?.files?.length) {
        const zipRes = await fetch(zipUrl);
        if (!zipRes.ok) throw new Error(`Fetch template zip failed [${zipRes.status}]`);
        const zipBytes = new Uint8Array(await zipRes.arrayBuffer());

        const boundary = '----soleia-' + crypto.randomUUID();
        const metadata = {
          name: zipName,
          parents: [creativeGuideFolderId],
          mimeType: 'application/zip',
        };
        const enc = new TextEncoder();
        const head = enc.encode(
          `--${boundary}\r\n` +
          `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
          JSON.stringify(metadata) + `\r\n` +
          `--${boundary}\r\n` +
          `Content-Type: application/zip\r\n\r\n`,
        );
        const tail = enc.encode(`\r\n--${boundary}--`);
        const body = new Uint8Array(head.length + zipBytes.length + tail.length);
        body.set(head, 0);
        body.set(zipBytes, head.length);
        body.set(tail, head.length + zipBytes.length);

        await fetch(`${GATEWAY}/upload/drive/v3/files?uploadType=multipart&fields=id`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            'X-Connection-Api-Key': driveKey,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body,
        }).then(async (r) => {
          if (!r.ok) throw new Error(`Drive upload zip failed [${r.status}]: ${(await r.text()).slice(0, 300)}`);
        });
      }
    } catch (zipErr) {
      // Non-fatal: log and continue so the folder is still returned
      console.error('Creative Guide zip upload failed:', zipErr instanceof Error ? zipErr.message : zipErr);
    }

    // Upload the master Pixel Map PNG into 02_Pixel Map (idempotent by name)
    try {
      const pixmapName = 'SOLEIA-Pixel-Map.png';
      const { data: pmRow } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'pixel_map_url')
        .maybeSingle();
      const pixmapUrl = (pmRow?.value && pmRow.value.trim().length > 0)
        ? pmRow.value.trim()
        : `${supabaseUrl}/storage/v1/object/public/creative-guide-template/${encodeURIComponent(pixmapName)}`;

      const existsQ = encodeURIComponent(
        `name='${pixmapName.replace(/'/g, "\\'")}' and '${pixelMapFolderId}' in parents and trashed=false`,
      );
      const existing = await gw(
        `/drive/v3/files?q=${existsQ}&fields=files(id)&pageSize=1`,
        { method: 'GET' },
        lovableKey,
        driveKey,
      );

      if (!existing?.files?.length) {
        const imgRes = await fetch(pixmapUrl);
        if (!imgRes.ok) throw new Error(`Fetch pixel map failed [${imgRes.status}]`);
        const imgBytes = new Uint8Array(await imgRes.arrayBuffer());

        const boundary = '----soleia-' + crypto.randomUUID();
        const metadata = {
          name: pixmapName,
          parents: [pixelMapFolderId],
          mimeType: 'image/png',
        };
        const enc = new TextEncoder();
        const head = enc.encode(
          `--${boundary}\r\n` +
          `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
          JSON.stringify(metadata) + `\r\n` +
          `--${boundary}\r\n` +
          `Content-Type: image/png\r\n\r\n`,
        );
        const tail = enc.encode(`\r\n--${boundary}--`);
        const body = new Uint8Array(head.length + imgBytes.length + tail.length);
        body.set(head, 0);
        body.set(imgBytes, head.length);
        body.set(tail, head.length + imgBytes.length);

        const r = await fetch(`${GATEWAY}/upload/drive/v3/files?uploadType=multipart&fields=id`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            'X-Connection-Api-Key': driveKey,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body,
        });
        if (!r.ok) throw new Error(`Drive upload pixel map failed [${r.status}]: ${(await r.text()).slice(0, 300)}`);
      }
    } catch (pmErr) {
      console.error('Pixel Map upload failed:', pmErr instanceof Error ? pmErr.message : pmErr);
    }

    // anyone-with-link → writer (idempotent: Drive accepts duplicate "anyone" permission)
    await gw(
      `/drive/v3/files/${clientFolderId}/permissions?fields=id`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'writer', type: 'anyone' }),
      },
      lovableKey,
      driveKey,
    );

    const meta = await gw(
      `/drive/v3/files/${clientFolderId}?fields=id,webViewLink`,
      { method: 'GET' },
      lovableKey,
      driveKey,
    );

    const folderUrl: string = meta.webViewLink;
    const folderId: string = meta.id;

    const { error: updErr } = await supabase
      .from('proposals')
      .update({ drive_folder_url: folderUrl, drive_folder_id: folderId })
      .eq('id', proposal_id);
    if (updErr) throw new Error(`Update proposal failed: ${updErr.message}`);

    return new Response(
      JSON.stringify({ folderUrl, folderId, existing: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('create-client-drive-folder error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
