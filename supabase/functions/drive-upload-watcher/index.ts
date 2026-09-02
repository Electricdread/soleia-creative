// Polls each client's Google Drive folder (and its subfolders) for new files,
// records them in drive_seen_files, and emails a retryable upload digest.
// First scan of a folder seeds existing files without firing webhooks (no backfill flood).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { slotForFolderName, FINAL_SLOTS } from '../_shared/finalSlots.ts';
import { driveAuthMode, driveFetch } from '../_shared/googleDrive.ts';
import { sendEach, adminRecipients, jobAssigneesFor } from '../_shared/notify.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_ORIGIN = 'https://soleiacreative.app';

const MAX_ATTEMPTS = 4;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function backoff(path: string, attempt: number, err: Error) {
  const wait = 500 * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
  console.warn(`Google Drive ${path} attempt ${attempt} failed, retrying in ${wait}ms: ${err.message}`);
  await sleep(wait);
}

// Retries transient gateway failures (5xx / 429 / network resets) with exponential backoff + jitter.
async function gw(path: string, _lovableKey: string, _driveKey: string) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await driveFetch(path);
    } catch (e) {
      // Network-level failure (connection reset, DNS, timeout) — retryable.
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < MAX_ATTEMPTS) await backoff(path, attempt, lastError);
      continue;
    }

    const text = await res.text();
    if (res.ok) return text ? JSON.parse(text) : null;

    lastError = new Error(`Google Drive ${path} [${res.status}]: ${text.slice(0, 400)}`);
    const retryable = res.status >= 500 || res.status === 429;
    if (!retryable) throw lastError;
    if (attempt < MAX_ATTEMPTS) await backoff(path, attempt, lastError);
  }

  throw lastError ?? new Error(`Google Drive ${path} failed after ${MAX_ATTEMPTS} attempts`);
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

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const lovableKey = Deno.env.get('LOVABLE_API_KEY') ?? '';
    const driveKey = Deno.env.get('GOOGLE_DRIVE_API_KEY') ?? '';
    const zapierUrl = Deno.env.get('ZAPIER_WEBHOOK_URL');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const authMode = driveAuthMode();
    if (!supabaseUrl || !serviceKey) throw new Error('Supabase credentials missing');

    const supabase = createClient(supabaseUrl, serviceKey);

    // Every folder we are responsible for watching. A job's assets can land in
    // the folder created from its proposal OR the one created from its packet —
    // historically only the proposal side was scanned, so uploads to a packet
    // folder were never seen and kickoff could not be detected.
    interface WatchTarget {
      proposal_id: string | null;
      job_id: string | null;
      client_name: string;
      event_name: string;
      event_date: string | null;
      drive_folder_id: string;
      drive_folder_url: string | null;
      source: 'proposal' | 'packet';
    }

    const { data: proposals, error } = await supabase
      .from('proposals')
      .select('id, token, job_id, client_name, event_name, event_date, drive_folder_id, drive_folder_url')
      .not('drive_folder_id', 'is', null);

    if (error) throw error;

    const { data: packets, error: packetErr } = await supabase
      .from('pre_call_packets')
      .select('id, job_id, client_name, title, event_date, drive_folder_id, drive_folder_url')
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
        job_id: (p as any).job_id ?? null,
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
        job_id: (pk as any).job_id ?? null,
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
      auth_mode: authMode,
      scanned_folders: 0,
      scanned_proposal_folders: 0,
      scanned_packet_folders: 0,
      new_files: 0,
      webhooks_sent: 0,
      webhook_failures: 0,
      seeded: 0,
      finals: 0,
      finals_emailed: 0,
      pending_notifications: 0,
      upload_notifications_delivered: 0,
      upload_notification_failures: 0,
      team_upload_copies: 0,
      team_finals_copies: 0,
      refiled: 0,
      marked_missing: 0,
      restored: 0,
    };

    const finals: {
      client: string; event: string; jobId: string | null; slot: string; fileName: string; link: string | null;
    }[] = [];

    const scanTarget = async (p: WatchTarget) => {
      const folderId = p.drive_folder_id;
      summary.scanned_folders++;
      if (p.source === 'proposal') summary.scanned_proposal_folders++;
      else summary.scanned_packet_folders++;

      let files: DriveFile[];
      try {
        files = await listAllFiles(folderId, lovableKey, driveKey);
      } catch (e) {
        console.error(`Failed to list folder ${folderId} (${p.source} ${p.client_name}):`, e);
        return;
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
              jobId: p.job_id,
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
      if (newFiles.length === 0) return;

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
            jobId: p.job_id,
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

        // Zapier remains an optional downstream automation. Internal upload
        // notification no longer depends on it; the direct email digest below
        // owns the `notified` flag and retries failed sends on the next run.
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

        if (zapierUrl) {
          try {
            const res = await fetch(zapierUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (res.ok) summary.webhooks_sent++;
            else {
              summary.webhook_failures++;
              console.error(`Zapier webhook failed [${res.status}] for file ${file.name}`);
            }
          } catch (e) {
            summary.webhook_failures++;
            console.error(`Zapier webhook error for file ${file.name}:`, e);
          }
        }

        await supabase.from('drive_seen_files').insert(row);
      }
    };

    // Folder listings are independent. Four workers cut the previous serial
    // scan time substantially without opening enough requests to trip Drive's
    // per-user rate limits.
    const targetQueue = Array.from(targets.values());
    let nextTarget = 0;
    const workerCount = Math.min(4, targetQueue.length);
    await Promise.all(Array.from({ length: workerCount }, async () => {
      while (true) {
        const index = nextTarget++;
        if (index >= targetQueue.length) return;
        await scanTarget(targetQueue[index]);
      }
    }));

    // Who is on each job, so the digests below can copy the assigned PMs on
    // their own clients' files — and only theirs. An admin already gets the
    // full digest, so an assignee who is also an admin is not sent a second copy.
    const teamByJob = new Map<string, { email: string; name: string | null }[]>();
    for (const member of await jobAssigneesFor(Array.from(targets.values()).map((t) => t.job_id))) {
      const list = teamByJob.get(member.job_id) ?? [];
      list.push({ email: member.email, name: member.name });
      teamByJob.set(member.job_id, list);
    }
    const adminSet = new Set(adminRecipients().map((a) => a.toLowerCase()));

    // Retry every recent row whose notification has not been delivered. This
    // includes files recorded during the Aug 28 outage: the database row is a
    // durable queue, so an email-provider or function failure cannot make an
    // upload disappear from notification forever.
    try {
      const retrySince = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: pending, error: pendingError } = await supabase
        .from('drive_seen_files')
        .select('id, drive_folder_id, file_name, web_view_link, seen_at')
        .eq('notified', false)
        .is('missing_since', null)
        .gte('seen_at', retrySince)
        .order('seen_at', { ascending: true })
        .limit(100);
      if (pendingError) throw pendingError;

      summary.pending_notifications = pending?.length ?? 0;
      if (pending?.length) {
        const rendered = pending.map((row: any) => {
          const owner = targets.get(row.drive_folder_id as string);
          const label = owner
            ? `${owner.client_name} — ${owner.event_name}`
            : 'Client upload';
          const fileName = escapeHtml(row.file_name || 'Untitled file');
          const linkedName = row.web_view_link
            ? `<a href="${row.web_view_link}" style="color:#B0700C;text-decoration:none;">${fileName}</a>`
            : fileName;
          return {
            jobId: owner?.job_id ?? null,
            fileName: (row.file_name as string | null) || 'Soleia upload',
            html: `<tr>
            <td style="padding:8px 14px 8px 0;color:#333;">${linkedName}</td>
            <td style="padding:8px 0;color:#777;">${escapeHtml(label)}</td>
          </tr>`,
          };
        });

        const uploadDigest = (count: number, rows: string) =>
          `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:640px;margin:0 auto;padding:24px;">
            <h1 style="font-size:20px;margin:0 0 6px;color:#111;">${count === 1 ? 'A client file has landed' : `${count} client files have landed`}</h1>
            <p style="margin:0 0 18px;color:#666;font-size:14px;">Soleia recorded these files in the client Drive folders.</p>
            <table style="border-collapse:collapse;font-size:14px;width:100%;">${rows}</table>
            <p style="margin:22px 0 0;font-size:13px;"><a href="${APP_ORIGIN}/admin/jobs" style="color:#B0700C;">Open jobs</a></p>
          </div>`;

        const report = await sendEach({
          to: adminRecipients(),
          subject: pending.length === 1
            ? `Client file received — ${pending[0].file_name || 'Soleia upload'}`
            : `${pending.length} client files received`,
          template: 'client-files-received',
          html: uploadDigest(pending.length, rendered.map((r) => r.html).join('')),
        });

        summary.upload_notifications_delivered = report.delivered.length;
        summary.upload_notification_failures = report.failed.length;

        // The assigned PMs hear about their own clients' files. Best-effort on
        // top of the admin digest, which alone owns the `notified` flag — a
        // failed PM copy is in email_send_log but does not re-queue the row.
        const uploadsByAssignee = new Map<string, { fileNames: string[]; rows: string[] }>();
        for (const r of rendered) {
          if (!r.jobId) continue;
          for (const member of teamByJob.get(r.jobId) ?? []) {
            if (adminSet.has(member.email.toLowerCase())) continue;
            const entry = uploadsByAssignee.get(member.email) ?? { fileNames: [], rows: [] };
            entry.fileNames.push(r.fileName);
            entry.rows.push(r.html);
            uploadsByAssignee.set(member.email, entry);
          }
        }
        for (const [email, entry] of uploadsByAssignee) {
          const copy = await sendEach({
            to: [email],
            subject: entry.rows.length === 1
              ? `Client file received — ${entry.fileNames[0]}`
              : `${entry.rows.length} client files received`,
            template: 'client-files-received',
            html: uploadDigest(entry.rows.length, entry.rows.join('')),
          });
          summary.team_upload_copies += copy.delivered.length;
          if (copy.failed.length) {
            console.error('Upload notification PM copy failed for:', JSON.stringify(copy.failed));
          }
        }
        if (report.delivered.length > 0) {
          const notifiedAt = new Date().toISOString();
          const { error: markError } = await supabase
            .from('drive_seen_files')
            .update({ notified: true, notified_at: notifiedAt })
            .in('id', pending.map((row: any) => row.id));
          if (markError) throw markError;
        }
        if (report.failed.length) {
          console.error('Upload notification failed for:', JSON.stringify(report.failed));
        }
      }
    } catch (notificationError) {
      summary.upload_notification_failures++;
      console.error(
        'Upload notification digest failed:',
        notificationError instanceof Error ? notificationError.message : notificationError,
      );
    }

    console.log('drive-upload-watcher summary:', summary);
    if (finals.length > 0) {
      const label = Object.fromEntries(FINAL_SLOTS.map((d) => [d.slot, d.label]));
      const renderedFinals = finals.map((f) => {
        const name = f.link
          ? `<a href="${f.link}" style="color:#B0700C;text-decoration:none;">${escapeHtml(f.fileName)}</a>`
          : escapeHtml(f.fileName);
        return {
          final: f,
          html: `<tr>
            <td style="padding:8px 14px 8px 0;color:#111;font-weight:600;white-space:nowrap;">${escapeHtml(label[f.slot] ?? f.slot)}</td>
            <td style="padding:8px 14px 8px 0;color:#333;">${name}</td>
            <td style="padding:8px 0;color:#777;">${escapeHtml(f.client)} — ${escapeHtml(f.event)}</td>
          </tr>`,
        };
      });

      const finalsDigest = (rows: string, count: number) =>
        `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:640px;margin:0 auto;padding:24px;">
            <h1 style="font-size:20px;margin:0 0 6px;color:#111;">${count === 1 ? 'A final file has landed' : `${count} final files have landed`}</h1>
            <p style="margin:0 0 18px;color:#666;font-size:14px;">Dropped into the client's 04_Finals folder.</p>
            <table style="border-collapse:collapse;font-size:14px;width:100%;">${rows}</table>
            <p style="margin:22px 0 0;font-size:13px;">
              <a href="${APP_ORIGIN}/admin/jobs" style="color:#B0700C;">Open jobs</a>
            </p>
          </div>`;
      const finalsSubject = (items: typeof finals) =>
        items.length === 1
          ? `Final received — ${label[items[0].slot] ?? items[0].slot}: ${items[0].client}`
          : `${items.length} finals received`;

      try {
        const report = await sendEach({
          to: adminRecipients(),
          subject: finalsSubject(finals),
          template: 'finals-received',
          html: finalsDigest(renderedFinals.map((r) => r.html).join(''), finals.length),
        });
        summary.finals_emailed = report.delivered.length;
        if (report.failed.length) {
          console.error('Finals email failed for:', JSON.stringify(report.failed));
        }

        // As with uploads: each assigned PM gets the finals for their jobs.
        const finalsByAssignee = new Map<string, { items: typeof finals; rows: string[] }>();
        for (const r of renderedFinals) {
          if (!r.final.jobId) continue;
          for (const member of teamByJob.get(r.final.jobId) ?? []) {
            if (adminSet.has(member.email.toLowerCase())) continue;
            const entry = finalsByAssignee.get(member.email) ?? { items: [], rows: [] };
            entry.items.push(r.final);
            entry.rows.push(r.html);
            finalsByAssignee.set(member.email, entry);
          }
        }
        for (const [email, entry] of finalsByAssignee) {
          const copy = await sendEach({
            to: [email],
            subject: finalsSubject(entry.items),
            template: 'finals-received',
            html: finalsDigest(entry.rows.join(''), entry.items.length),
          });
          summary.team_finals_copies += copy.delivered.length;
          if (copy.failed.length) {
            console.error('Finals PM copy failed for:', JSON.stringify(copy.failed));
          }
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
