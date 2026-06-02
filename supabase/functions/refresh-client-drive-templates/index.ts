// Backfills every existing client Drive folder with the latest
// "SOLEIA - Creative Guide Project.zip" from Supabase storage.
// Idempotent: deletes any existing file with that name in the
// 01_Soleia Creative Guide subfolder, then uploads the fresh copy.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/google_drive';
const ZIP_NAME = 'SOLEIA - Creative Guide Project.zip';
const SUBFOLDER_NAME = '01_Soleia Creative Guide';

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

async function findChildFolder(parentId: string, name: string, lovableKey: string, driveKey: string) {
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`,
  );
  const list = await gw(`/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`, { method: 'GET' }, lovableKey, driveKey);
  return list?.files?.[0]?.id ?? null;
}

async function findFiles(parentId: string, name: string, lovableKey: string, driveKey: string) {
  const q = encodeURIComponent(
    `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`,
  );
  const list = await gw(`/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=10`, { method: 'GET' }, lovableKey, driveKey);
  return (list?.files ?? []) as Array<{ id: string; name: string }>;
}

async function deleteFile(fileId: string, lovableKey: string, driveKey: string) {
  // Trash the file (safer than permanent delete).
  await gw(`/drive/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trashed: true }),
  }, lovableKey, driveKey);
}

async function uploadZip(parentId: string, zipBytes: Uint8Array, lovableKey: string, driveKey: string) {
  const boundary = '----soleia-' + crypto.randomUUID();
  const metadata = { name: ZIP_NAME, parents: [parentId], mimeType: 'application/zip' };
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

  const r = await fetch(`${GATEWAY}/upload/drive/v3/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': driveKey,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!r.ok) throw new Error(`Drive upload zip failed [${r.status}]: ${(await r.text()).slice(0, 300)}`);
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

    const supabase = createClient(supabaseUrl, serviceKey);

    // Resolve the source zip URL from site_settings (falls back to canonical path).
    const { data: settingRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'creative_guide_template_url')
      .maybeSingle();
    const zipUrl = (settingRow?.value && settingRow.value.trim().length > 0)
      ? settingRow.value.trim()
      : `${supabaseUrl}/storage/v1/object/public/creative-guide-template/${encodeURIComponent(ZIP_NAME)}`;

    const zipRes = await fetch(zipUrl);
    if (!zipRes.ok) throw new Error(`Fetch template zip failed [${zipRes.status}]`);
    const zipBytes = new Uint8Array(await zipRes.arrayBuffer());

    // List every proposal that has a Drive folder.
    const { data: proposals, error: pErr } = await supabase
      .from('proposals')
      .select('id, client_name, event_name, drive_folder_id')
      .not('drive_folder_id', 'is', null);
    if (pErr) throw new Error(`List proposals failed: ${pErr.message}`);

    const summary = {
      processed: 0,
      updated: 0,
      skipped_no_subfolder: 0,
      errors: [] as Array<{ proposal_id: string; client: string; event: string; error: string }>,
    };

    for (const p of proposals ?? []) {
      summary.processed += 1;
      const label = `${p.client_name} — ${p.event_name}`;
      try {
        const subfolderId = await findChildFolder(p.drive_folder_id as string, SUBFOLDER_NAME, lovableKey, driveKey);
        if (!subfolderId) {
          summary.skipped_no_subfolder += 1;
          continue;
        }

        const existing = await findFiles(subfolderId, ZIP_NAME, lovableKey, driveKey);
        for (const f of existing) {
          await deleteFile(f.id, lovableKey, driveKey);
        }

        await uploadZip(subfolderId, zipBytes, lovableKey, driveKey);
        summary.updated += 1;
      } catch (e) {
        summary.errors.push({
          proposal_id: p.id as string,
          client: p.client_name as string,
          event: p.event_name as string,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return new Response(JSON.stringify(summary, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
