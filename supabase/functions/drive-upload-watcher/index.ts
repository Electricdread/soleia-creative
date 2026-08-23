// Polls each client's Google Drive folder (and its subfolders) for new files,
// records them in drive_seen_files, and POSTs new uploads to a Zapier webhook.
// First scan of a folder seeds existing files without firing webhooks (no backfill flood).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { slotForFolderName, FINAL_SLOTS } from '../_shared/finalSlots.ts';
import { sendEach, adminRecipients } from '../_shared/notify.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/google_drive';
const APP_ORIGIN = 'https://soleiacreative.app';

const MAX_ATTEMPTS = 4;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function backoff(path: string, attempt: number, err: Error) {
  const wait = 500 * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
  console.warn(`Drive gateway ${path} attempt ${attempt} failed, retrying in ${wait}ms: ${err.message}`);
  await sleep(wait);
}

// Retries transient gateway failures (5xx / 429 / network resets) with exponential backoff + jitter.
async function gw(path: string, lovableKey: string, driveKey: string) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${GATEWAY}${path}`, {
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          'X-Connection-Api-Key': driveKey,
        },
      });
    } catch (e) {
      // Network-level failure (connection reset, DNS, timeout) — retryable.
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < MAX_ATTEMPTS) await backoff(path, attempt, lastError);
      continue;
    }

    const text = await res.text();
    if (res.ok) return text ? JSON.parse(text) : null;

    lastError = new Error(`Drive gateway ${path} [${res.status}]: ${text.slice(0, 400)}`);
    const retryable = res.status >= 500 || res.status === 429;
    if (!retryable) throw lastError;
    if (attempt < MAX_ATTEMPTS) await backoff(path, attempt, lastError);
  }

  throw lastError ?? new Error(`Drive gateway ${path} failed after ${MAX_ATTEMPTS} attempts`);
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  /** The folder the file actually sits in — not the folder the scan started at. */
  parentFolderId?: string;
  parentFolderName?: string;
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
  parentName = '',
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
      const nested = await listAllFiles(item.id, lovableKey, driveKey, depth + 1, item.name);
      files.push(...nested);
    } else {
      // Stamp the folder this file is really in, so a delivered final can be
      // matched to the surface its folder names.
      files.push({ ...item, parentFolderId: rootFolderId, parentFolderName: parentName });
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

    // Every folder we are responsible for watching. A job's assets can land in
    // the folder created from its proposal OR the one created from its packet —
    // historically only the proposal side was scanned, so uploads to a packet
    // folder were never seen and kickoff could not be detected.
    interface WatchTarget {
      proposal_id: string | null;
      client_name: string;
      event_name: string;
      event_date: string | null;
      drive_folder_id: string;
      drive_folder_url: string | null;
      source: 'proposal' | 'packet';
    }

    const { data: proposals, error } = await supabase
      .from('proposals')
      .select('id, token, client_name, event_name, event_date, drive_folder_id, drive_folder_url')
      .not('drive_folder_id', 'is', null);

    if (error) throw error;

    const { data: packets, error: packetErr } = await supabase
      .from('pre_call_packets')
      .select('id, client_name, title, event_date, drive_folder_id, drive_folder_url')
      .not('drive_folder_id', 'is', null);

    if (packetErr) throw packetErr;

    // Proposals are added first so that when a packet and a proposal share a
    // folder the row is attributed to the proposal, which is what the dashboard
    // and the signed-proposal flow read.
    const targets = new Map<string, WatchTarget>();

    for (const p of proposals ?? []) {
      const folderId = (p as any).drive_folder_id as string | null;
      if (!folderId) continue;
      targets.set(folderId, {
        proposal_id: (p as any).id,
        client_name: (p as any).client_name,
        event_name: (p as any).event_name,
        event_date: (p as any).event_date ?? null,
        drive_folder_id: folderId,
        drive_folder_url: (p as any).drive_folder_url ?? null,
        source: 'proposal',
      });
    }

    for (const pk of packets ?? []) {
      const folderId = (pk as any).drive_folder_id as string | null;
      if (!folderId || targets.has(folderId)) continue;
      targets.set(folderId, {
        proposal_id: null,
        client_name: (pk as any).client_name ?? 'Client',
        event_name: (pk as any).title ?? 'Pre-Call Packet',
        event_date: (pk as any).event_date ?? null,
        drive_folder_id: folderId,
        drive_folder_url: (pk as any).drive_folder_url ?? null,
        source: 'packet',
      });
    }

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
      scanned_proposal_folders: 0,
      scanned_packet_folders: 0,
      new_files: 0,
      webhooks_sent: 0,
      webhook_failures: 0,
      seeded: 0,
      finals: 0,
      finals_emailed: 0,
      refiled: 0,
      marked_missing: 0,
      restored: 0,
    };

    const finals: {
      client: string; event: string; slot: string; fileName: string; link: string | null;
    }[] = [];

    for (const p of targets.values()) {
      const folderId = p.drive_folder_id;
      summary.scanned_folders++;
      if (p.source === 'proposal') summary.scanned_proposal_folders++;
      else summary.scanned_packet_folders++;

      let files: DriveFile[];
      try {
        files = await listAllFiles(folderId, lovableKey, driveKey);
      } catch (e) {
        console.error(`Failed to list folder ${folderId} (${p.source} ${p.client_name}):`, e);
        continue;
      }

      // Check which files we've already seen for this folder
      const { data: existing } = await supabase
        .from('drive_seen_files')
        .select('drive_file_id, parent_folder_id, final_slot, missing_since')
        .eq('drive_folder_id', folderId);
      const seenRows = new Map(
        (existing ?? []).map((r: any) => [r.drive_file_id as string, r]),
      );
      const isFirstScan = (existing?.length ?? 0) === 0;

      // A file the client drags into the right subfolder keeps its Drive id, so
      // it is never "new" again. Without this it would sit unfiled forever —
      // and filing a final that is already uploaded is the common case, not the
      // exception. Re-stamp anything whose parent has changed, and treat a file
      // that has just gained a slot as a final landing.
      if (!isFirstScan) {
        for (const f of files) {
          const prior = seenRows.get(f.id);
          if (!prior) continue;
          const parentId = f.parentFolderId ?? null;
          if (prior.parent_folder_id === parentId) continue;

          const slot = slotForFolderName(f.parentFolderName);
          await supabase
            .from('drive_seen_files')
            .update({
              parent_folder_id: parentId,
              parent_folder_name: f.parentFolderName ?? null,
              final_slot: slot,
            })
            .eq('drive_folder_id', folderId)
            .eq('drive_file_id', f.id);
          summary.refiled++;

          if (slot && slot !== prior.final_slot) {
            summary.finals++;
            finals.push({
              client: p.client_name,
              event: p.event_name,
              slot,
              fileName: f.name,
              link: f.webViewLink ?? p.drive_folder_url ?? null,
            });
          }
        }
      }

      // What the folder holds now is the authority on what still exists. A
      // file deleted in Drive kept appearing on the dashboard and kept counting
      // towards the job's assets, because nothing ever contradicted the row
      // that recorded its arrival.
      //
      // Only reached when the listing succeeded — a failed list `continue`s
      // above — so an outage cannot mark a whole folder gone.
      const present = new Set(files.map((f) => f.id));
      for (const row of existing ?? []) {
        const stillThere = present.has(row.drive_file_id as string);
        const markedGone = Boolean((row as { missing_since?: string | null }).missing_since);

        if (!stillThere && !markedGone) {
          await supabase
            .from('drive_seen_files')
            .update({ missing_since: new Date().toISOString() })
            .eq('drive_folder_id', folderId)
            .eq('drive_file_id', row.drive_file_id);
          summary.marked_missing++;
        } else if (stillThere && markedGone) {
          // Restored from the bin, or the sweep that marked it was wrong.
          await supabase
            .from('drive_seen_files')
            .update({ missing_since: null })
            .eq('drive_folder_id', folderId)
            .eq('drive_file_id', row.drive_file_id);
          summary.restored++;
        }
      }

      const newFiles = files.filter((f) => !seenRows.has(f.id));
      if (newFiles.length === 0) continue;

      const lookupKey = `${p.client_name}||${p.event_name}`.toLowerCase();
      const sessionToken = linkLookup.get(lookupKey);
      const sessionUrl = sessionToken
        ? `${APP_ORIGIN}/session/${sessionToken}`
        : `${APP_ORIGIN}/admin/proposals`;

      for (const file of newFiles) {
        summary.new_files++;
        const finalSlot = slotForFolderName(file.parentFolderName);
        const row = {
          proposal_id: p.proposal_id,
          drive_folder_id: folderId,
          drive_file_id: file.id,
          file_name: file.name,
          mime_type: file.mimeType,
          file_size: formatBytes(file.size),
          web_view_link: file.webViewLink ?? null,
          parent_folder_id: file.parentFolderId ?? null,
          parent_folder_name: file.parentFolderName ?? null,
          final_slot: finalSlot,
          notified: false,
          notified_at: null as string | null,
        };

        // A finished file for a named surface. Collected here and mailed once at
        // the end of the run rather than per file — a client dropping four
        // deliverables at once should be one message, not four.
        if (finalSlot && !isFirstScan) {
          summary.finals++;
          finals.push({
            client: p.client_name,
            event: p.event_name,
            slot: finalSlot,
            fileName: file.name,
            link: file.webViewLink ?? p.drive_folder_url ?? null,
          });
        }

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
    if (finals.length > 0) {
      const label = Object.fromEntries(FINAL_SLOTS.map((d) => [d.slot, d.label]));
      const esc = (t: string) =>
        t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const rows = finals
        .map((f) => {
          const name = f.link
            ? `<a href="${f.link}" style="color:#B0700C;text-decoration:none;">${esc(f.fileName)}</a>`
            : esc(f.fileName);
          return `<tr>
            <td style="padding:8px 14px 8px 0;color:#111;font-weight:600;white-space:nowrap;">${esc(label[f.slot] ?? f.slot)}</td>
            <td style="padding:8px 14px 8px 0;color:#333;">${name}</td>
            <td style="padding:8px 0;color:#777;">${esc(f.client)} — ${esc(f.event)}</td>
          </tr>`;
        })
        .join('');
      const heading = finals.length === 1 ? 'A final file has landed' : `${finals.length} final files have landed`;

      try {
        const report = await sendEach({
          to: adminRecipients(),
          subject:
            finals.length === 1
              ? `Final received — ${label[finals[0].slot] ?? finals[0].slot}: ${finals[0].client}`
              : `${finals.length} finals received`,
          template: 'finals-received',
          html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:640px;margin:0 auto;padding:24px;">
            <h1 style="font-size:20px;margin:0 0 6px;color:#111;">${heading}</h1>
            <p style="margin:0 0 18px;color:#666;font-size:14px;">Dropped into the client's 04_Finals folder.</p>
            <table style="border-collapse:collapse;font-size:14px;width:100%;">${rows}</table>
            <p style="margin:22px 0 0;font-size:13px;">
              <a href="${APP_ORIGIN}/admin/jobs" style="color:#B0700C;">Open jobs</a>
            </p>
          </div>`,
        });
        summary.finals_emailed = report.delivered.length;
        if (report.failed.length) {
          console.error('Finals email failed for:', JSON.stringify(report.failed));
        }
      } catch (mailErr) {
        // Never let a mail failure lose the scan — the rows are already written.
        console.error('Finals email threw:', mailErr instanceof Error ? mailErr.message : mailErr);
      }
    }

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
