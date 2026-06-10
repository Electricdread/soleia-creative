// Polls each client's Google Drive folder (and its subfolders) for new files,
// records them in drive_seen_files, and POSTs new uploads to a Zapier webhook.
// First scan of a folder seeds existing files without firing webhooks (no backfill flood).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/google_drive';
const APP_ORIGIN = 'https://soleiacreative.app';

async function gw(path: string, lovableKey: string, driveKey: string) {
  const res = await fetch(`${GATEWAY}${path}`, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': driveKey,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Drive gateway ${path} [${res.status}]: ${text.slice(0, 400)}`);
  }
  return text ? JSON.parse(text) : null;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  createdTime?: string;
}

// Recursively list every non-folder file under `rootFolderId` (one level of folder recursion enough,
// but we go deep just in case the client creates nested folders).
async function listAllFiles(
  rootFolderId: string,
  lovableKey: string,
  driveKey: string,
  depth = 0,
): Promise<DriveFile[]> {
  if (depth > 4) return [];
  const q = encodeURIComponent(`'${rootFolderId}' in parents and trashed=false`);
  const fields = encodeURIComponent('files(id,name,mimeType,size,webViewLink,createdTime)');
  const result = await gw(
    `/drive/v3/files?q=${q}&fields=${fields}&pageSize=1000`,
    lovableKey,
    driveKey,
  );
  const items: DriveFile[] = result?.files ?? [];
  const files: DriveFile[] = [];
  for (const item of items) {
    if (item.mimeType === 'application/vnd.google-apps.folder') {
      const nested = await listAllFiles(item.id, lovableKey, driveKey, depth + 1);
      files.push(...nested);
    } else {
      files.push(item);
    }
  }
  return files;
}

function formatBytes(size?: string) {
  if (!size) return null;
  const n = Number(size);
  if (!isFinite(n)) return null;
  return n;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const driveKey = Deno.env.get('GOOGLE_DRIVE_API_KEY');
    const zapierUrl = Deno.env.get('ZAPIER_WEBHOOK_URL');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!lovableKey || !driveKey) throw new Error('Drive gateway keys missing');
    if (!supabaseUrl || !serviceKey) throw new Error('Supabase credentials missing');
    if (!zapierUrl) throw new Error('ZAPIER_WEBHOOK_URL not configured');

    const supabase = createClient(supabaseUrl, serviceKey);

    // Find every proposal that has a drive folder linked
    const { data: proposals, error } = await supabase
      .from('proposals')
      .select('id, token, client_name, event_name, event_date, drive_folder_id, drive_folder_url')
      .not('drive_folder_id', 'is', null);

    if (error) throw error;

    // Best-effort: match a client_link by client + event for a session URL
    const { data: links } = await supabase
      .from('client_links')
      .select('token, client_name, event_name');
    const linkLookup = new Map<string, string>();
    for (const l of links ?? []) {
      const key = `${(l as any).client_name}||${(l as any).event_name}`.toLowerCase();
      linkLookup.set(key, (l as any).token);
    }

    const summary = {
      scanned_folders: 0,
      new_files: 0,
      webhooks_sent: 0,
      webhook_failures: 0,
      seeded: 0,
    };

    for (const p of proposals ?? []) {
      const folderId = p.drive_folder_id as string;
      if (!folderId) continue;
      summary.scanned_folders++;

      let files: DriveFile[];
      try {
        files = await listAllFiles(folderId, lovableKey, driveKey);
      } catch (e) {
        console.error(`Failed to list folder ${folderId} for proposal ${p.id}:`, e);
        continue;
      }

      // Check which files we've already seen for this folder
      const { data: existing } = await supabase
        .from('drive_seen_files')
        .select('drive_file_id')
        .eq('drive_folder_id', folderId);
      const seen = new Set((existing ?? []).map((r: any) => r.drive_file_id));
      const isFirstScan = (existing?.length ?? 0) === 0;

      const newFiles = files.filter((f) => !seen.has(f.id));
      if (newFiles.length === 0) continue;

      const sessionToken = p.link_id ? tokenMap.get(p.link_id) : undefined;
      const sessionUrl = sessionToken
        ? `${APP_ORIGIN}/session/${sessionToken}`
        : `${APP_ORIGIN}/admin/proposals`;

      for (const file of newFiles) {
        summary.new_files++;
        const row = {
          proposal_id: p.id,
          drive_folder_id: folderId,
          drive_file_id: file.id,
          file_name: file.name,
          mime_type: file.mimeType,
          file_size: formatBytes(file.size),
          web_view_link: file.webViewLink ?? null,
          notified: false,
          notified_at: null as string | null,
        };

        if (isFirstScan) {
          // Seed only — no webhook
          row.notified = true;
          row.notified_at = new Date().toISOString();
          summary.seeded++;
          await supabase.from('drive_seen_files').insert(row);
          continue;
        }

        // Send Zapier webhook
        const payload = {
          client_name: p.client_name,
          event_name: p.event_name,
          event_date: p.event_date,
          file_name: file.name,
          file_type: file.mimeType,
          file_size: formatBytes(file.size),
          file_url: file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view`,
          drive_folder_url: p.drive_folder_url,
          session_link: sessionUrl,
          timestamp: new Date().toISOString(),
        };

        let success = false;
        try {
          const res = await fetch(zapierUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          success = res.ok;
          if (!res.ok) {
            console.error(`Zapier webhook failed [${res.status}] for file ${file.name}`);
          }
        } catch (e) {
          console.error(`Zapier webhook error for file ${file.name}:`, e);
        }

        if (success) {
          summary.webhooks_sent++;
          row.notified = true;
          row.notified_at = new Date().toISOString();
        } else {
          summary.webhook_failures++;
        }

        await supabase.from('drive_seen_files').insert(row);
      }
    }

    console.log('drive-upload-watcher summary:', summary);
    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('drive-upload-watcher error:', err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
