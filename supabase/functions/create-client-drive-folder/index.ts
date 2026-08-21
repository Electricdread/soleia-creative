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

/**
 * Normalise a folder name for comparison.
 *
 * The proposal branch names a job folder from `client_name — event_name`, the
 * packet branch from `client_name — title`. Drive only matches names exactly,
 * so two hand-typed strings that differ by a leading zero, a capital letter or
 * a trailing comma used to produce two sibling folders for one job — and only
 * one of them was ever watched for uploads.
 */
function normName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b0+(\d)/g, '$1')
    .trim()
    .replace(/\s+/g, ' ');
}

interface DriveFolder { id: string; name: string }

async function listChildFolders(
  parentId: string,
  lovableKey: string,
  driveKey: string,
): Promise<DriveFolder[]> {
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
  );
  const folders: DriveFolder[] = [];
  let pageToken = '';
  do {
    const page = await gw(
      `/drive/v3/files?q=${q}&fields=nextPageToken,files(id,name)&pageSize=200` +
        (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''),
      { method: 'GET' },
      lovableKey,
      driveKey,
    );
    folders.push(...((page?.files ?? []) as DriveFolder[]));
    pageToken = page?.nextPageToken ?? '';
  } while (pageToken);
  return folders;
}

async function createFolder(
  name: string,
  parentId: string | null,
  lovableKey: string,
  driveKey: string,
): Promise<string> {
  const body: Record<string, unknown> = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) body.parents = [parentId];
  const created = await gw(
    '/drive/v3/files?fields=id',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    lovableKey,
    driveKey,
  );
  return created.id;
}

/**
 * Find a child folder of `parentId` by normalised name, else create it.
 * `matches` lets a caller accept more than one spelling — the asset drop exists
 * as both "Client Asset Collect" and "03_Client Asset Collect" depending on
 * which folder mode created it first.
 */
async function findOrCreateFolder(
  name: string,
  parentId: string,
  lovableKey: string,
  driveKey: string,
  matches?: (normalised: string) => boolean,
): Promise<string> {
  const want = normName(name);
  const test = matches ?? ((n: string) => n === want);
  const children = await listChildFolders(parentId, lovableKey, driveKey);
  const hit = children.find((f) => test(normName(f.name)));
  if (hit) return hit.id;
  return createFolder(name, parentId, lovableKey, driveKey);
}

/**
 * Resolve the "Soleia Clients" root. Pinned to an explicit id when
 * `site_settings.drive_root_folder_id` is set; otherwise searched by name and
 * constrained to My Drive's root, so it cannot bind to a same-named folder
 * living in a shared drive.
 */
async function resolveRootFolder(
  supabase: ReturnType<typeof createClient>,
  lovableKey: string,
  driveKey: string,
): Promise<string> {
  const { data: pinned } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'drive_root_folder_id')
    .maybeSingle();
  const pinnedId = (pinned as { value?: string } | null)?.value?.trim();
  if (pinnedId) return pinnedId;

  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='Soleia Clients' and trashed=false and 'root' in parents`,
  );
  const list = await gw(
    `/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=2`,
    { method: 'GET' },
    lovableKey,
    driveKey,
  );
  if ((list?.files?.length ?? 0) > 1) {
    console.warn(
      'More than one "Soleia Clients" folder in My Drive root; using the first. ' +
      'Set site_settings.drive_root_folder_id to remove the ambiguity.',
    );
  }
  if (list?.files?.length) return list.files[0].id;
  return createFolder('Soleia Clients', null, lovableKey, driveKey);
}

/** True when a folder is the client asset drop, under either spelling. */
const isAssetCollect = (n: string) => n.endsWith('client asset collect');

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

    const body = await req.json().catch(() => ({}));
    const proposal_id: string | undefined = body?.proposal_id;
    const packet_id: string | undefined = body?.packet_id;
    const folder_mode: 'full' | 'asset_only' = body?.folder_mode === 'asset_only' ? 'asset_only' : 'full';

    if ((!proposal_id && !packet_id) || (proposal_id && typeof proposal_id !== 'string') || (packet_id && typeof packet_id !== 'string')) {
      return new Response(JSON.stringify({ error: 'proposal_id or packet_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Load the source row (proposal or packet) into a normalized shape
    let sourceTable: 'proposals' | 'pre_call_packets';
    let sourceId: string;
    let proposal: { id: string; event_name: string; client_name: string; event_date: string | null; drive_folder_url: string | null; drive_folder_id: string | null };

    if (proposal_id) {
      sourceTable = 'proposals';
      sourceId = proposal_id;
      const { data, error: fetchErr } = await supabase
        .from('proposals')
        .select('id, event_name, client_name, event_date, drive_folder_url, drive_folder_id')
        .eq('id', proposal_id)
        .maybeSingle();
      if (fetchErr) throw new Error(`Fetch proposal failed: ${fetchErr.message}`);
      if (!data) throw new Error('Proposal not found');
      proposal = data as typeof proposal;
    } else {
      sourceTable = 'pre_call_packets';
      sourceId = packet_id!;
      const { data, error: fetchErr } = await supabase
        .from('pre_call_packets')
        .select('id, title, client_name, event_date, drive_folder_url, drive_folder_id')
        .eq('id', packet_id!)
        .maybeSingle();
      if (fetchErr) throw new Error(`Fetch packet failed: ${fetchErr.message}`);
      if (!data) throw new Error('Packet not found');
      proposal = {
        id: data.id,
        event_name: data.title || 'Pre-Call Packet',
        client_name: data.client_name || 'Client',
        event_date: data.event_date ?? null,
        drive_folder_url: data.drive_folder_url,
        drive_folder_id: data.drive_folder_id,
      };
    }

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

    // A job's folder is shared by its packet and its proposal. Before making a
    // new one, reuse whatever the other side already created for this job — the
    // two branches name the folder from different fields, so relying on the
    // name alone split Whatnot and MOC&CO x ZAXBYS across two folders each.
    //
    // Matched on client *and* event date so a repeat client's second booking
    // gets its own folder. When the dates do not line up we fall through and
    // create one, which is the safe failure: a spare empty folder beats two
    // clients sharing an asset drop.
    const wantClient = normName(proposal.client_name);
    const siblingTable = sourceTable === 'proposals' ? 'pre_call_packets' : 'proposals';
    const { data: siblings } = await supabase
      .from(siblingTable)
      .select('client_name, event_date, drive_folder_id, drive_folder_url')
      .not('drive_folder_id', 'is', null);

    interface SiblingRow {
      client_name: string | null;
      event_date: string | null;
      drive_folder_id: string;
      drive_folder_url: string | null;
    }

    const reuse = ((siblings ?? []) as SiblingRow[]).find(
      (row) =>
        normName(row.client_name ?? '') === wantClient &&
        (row.event_date ?? null) === (proposal.event_date ?? null),
    );

    if (reuse?.drive_folder_id) {
      const { error: reuseErr } = await supabase
        .from(sourceTable)
        .update({ drive_folder_id: reuse.drive_folder_id, drive_folder_url: reuse.drive_folder_url })
        .eq('id', sourceId);
      if (reuseErr) throw new Error(`Update ${sourceTable} failed: ${reuseErr.message}`);
      console.log(`Reused the ${siblingTable} folder for "${proposal.client_name}"`);
      return new Response(
        JSON.stringify({
          folderUrl: reuse.drive_folder_url,
          folderId: reuse.drive_folder_id,
          existing: true,
          reused: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, '-').trim();
    const rootId = await resolveRootFolder(supabase, lovableKey, driveKey);
    const clientFolderName = `${safe(proposal.client_name)} — ${safe(proposal.event_name)}`;
    const clientFolderId = await findOrCreateFolder(clientFolderName, rootId, lovableKey, driveKey);

    // Subfolders depend on mode. The asset drop is matched under either
    // spelling so a job touched by both modes never ends up with two of them.
    let creativeGuideFolderId = '';
    let pixelMapFolderId = '';
    if (folder_mode === 'asset_only') {
      await findOrCreateFolder('03_Client Asset Collect', clientFolderId, lovableKey, driveKey, isAssetCollect);
    } else {
      const [cg, pm, _ac] = await Promise.all([
        findOrCreateFolder('01_Soleia Creative Guide', clientFolderId, lovableKey, driveKey),
        findOrCreateFolder('02_Pixel Map', clientFolderId, lovableKey, driveKey),
        findOrCreateFolder('03_Client Asset Collect', clientFolderId, lovableKey, driveKey, isAssetCollect),
      ]);
      creativeGuideFolderId = cg;
      pixelMapFolderId = pm;
    }

    // Upload the master Creative Guide Project zip into 01_Soleia Creative Guide
    // (idempotent: skip if a file with the same name already exists in that folder)
    if (folder_mode === 'full') try {
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
    if (folder_mode === 'full') try {
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

    // Upload the master Content Delivery Guide PDF into 02_Pixel Map (idempotent by name)
    if (folder_mode === 'full') try {
      const cdgName = 'SOLEIA-Content-Delivery-Guide.pdf';
      const { data: cdgRow } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'content_delivery_guide_url')
        .maybeSingle();
      const cdgUrl = (cdgRow?.value && cdgRow.value.trim().length > 0)
        ? cdgRow.value.trim()
        : `${supabaseUrl}/storage/v1/object/public/creative-guide-template/${encodeURIComponent(cdgName)}`;

      const existsQ = encodeURIComponent(
        `name='${cdgName.replace(/'/g, "\\'")}' and '${pixelMapFolderId}' in parents and trashed=false`,
      );
      const existing = await gw(
        `/drive/v3/files?q=${existsQ}&fields=files(id)&pageSize=1`,
        { method: 'GET' },
        lovableKey,
        driveKey,
      );

      if (!existing?.files?.length) {
        const pdfRes = await fetch(cdgUrl);
        if (!pdfRes.ok) throw new Error(`Fetch content delivery guide failed [${pdfRes.status}]`);
        const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());

        const boundary = '----soleia-' + crypto.randomUUID();
        const metadata = {
          name: cdgName,
          parents: [pixelMapFolderId],
          mimeType: 'application/pdf',
        };
        const enc = new TextEncoder();
        const head = enc.encode(
          `--${boundary}\r\n` +
          `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
          JSON.stringify(metadata) + `\r\n` +
          `--${boundary}\r\n` +
          `Content-Type: application/pdf\r\n\r\n`,
        );
        const tail = enc.encode(`\r\n--${boundary}--`);
        const body = new Uint8Array(head.length + pdfBytes.length + tail.length);
        body.set(head, 0);
        body.set(pdfBytes, head.length);
        body.set(tail, head.length + pdfBytes.length);

        const r = await fetch(`${GATEWAY}/upload/drive/v3/files?uploadType=multipart&fields=id`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            'X-Connection-Api-Key': driveKey,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body,
        });
        if (!r.ok) throw new Error(`Drive upload content delivery guide failed [${r.status}]: ${(await r.text()).slice(0, 300)}`);
      }
    } catch (cdgErr) {
      console.error('Content Delivery Guide upload failed:', cdgErr instanceof Error ? cdgErr.message : cdgErr);
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
      .from(sourceTable)
      .update({ drive_folder_url: folderUrl, drive_folder_id: folderId })
      .eq('id', sourceId);
    if (updErr) throw new Error(`Update ${sourceTable} failed: ${updErr.message}`);

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
