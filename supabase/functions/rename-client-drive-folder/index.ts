/**
 * Keep a job's Drive folder named the way the booking reads (owner, 2026-09-14: "soleia client google job
 * folders also need to be relabeled with new name format", and they chose "New folders and job renames").
 *
 * Called after a job's identity is synced (src/lib/jobTitle.ts, on every packet, proposal and session
 * save). It renames each folder the job, its packets and its proposals point at to
 * `jobFolderName(job.title, job.event_date)` -- but only a folder that sits directly in "Soleia Clients"
 * or in its Archive (where organize-client-drive-folders puts a past show), never a subfolder such as
 * 03_Client Asset Collect (a job can point at one), and only when the name differs. A rename keeps the
 * folder's id, contents and share links, so nothing that finds it breaks.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { driveJson } from '../_shared/googleDrive.ts';
import { archiveFolderId, soleiaClientsRoot } from '../_shared/clientFolders.ts';
import { jobFolderName } from '../_shared/jobFolderName.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const FOLDER = 'application/vnd.google-apps.folder';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const jobId = typeof body?.job_id === 'string' ? body.job_id : '';
    if (!jobId) return json({ error: 'job_id required' }, 400);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: job, error } = await supabase.from('jobs').select('id, title, event_date, drive_folder_id').eq('id', jobId).maybeSingle();
    if (error) throw new Error(`jobs: ${error.message}`);
    if (!job?.title) return json({ jobId, renamed: [], reason: 'The job has no title yet.' });

    const [packets, proposals] = await Promise.all([
      supabase.from('pre_call_packets').select('drive_folder_id').eq('job_id', jobId).not('drive_folder_id', 'is', null),
      supabase.from('proposals').select('drive_folder_id').eq('job_id', jobId).not('drive_folder_id', 'is', null),
    ]);
    // A Drive folder id is 28+ characters; a few old job rows hold ids cut to 5, which are not folders.
    const ids = [...new Set([
      job.drive_folder_id,
      ...((packets.data ?? []) as { drive_folder_id: string }[]).map((row) => row.drive_folder_id),
      ...((proposals.data ?? []) as { drive_folder_id: string }[]).map((row) => row.drive_folder_id),
    ].filter((id): id is string => typeof id === 'string' && id.length >= 20))];

    const name = jobFolderName(job.title, job.event_date);
    const root = await soleiaClientsRoot(supabase);
    // A past show's folder sits in Soleia Clients / Archive and is still the job's, so it is named the same.
    const archive = root ? await archiveFolderId(root) : null;
    const homes = [root, archive].filter((home): home is string => Boolean(home));
    const renamed: { id: string; from: string; to: string }[] = [];
    const kept: string[] = [];
    const skipped: { id: string; reason: string }[] = [];
    for (const id of ids) {
      const meta = await driveJson(`/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,parents,trashed,mimeType`, { method: 'GET' }).catch(() => null);
      if (!meta) { skipped.push({ id, reason: 'not readable' }); continue; }
      if (meta.trashed || meta.mimeType !== FOLDER) { skipped.push({ id, reason: 'not a live folder' }); continue; }
      if (!(meta.parents ?? []).some((parent: string) => homes.includes(parent))) {
        skipped.push({ id, reason: 'not directly in Soleia Clients or its Archive' });
        continue;
      }
      if (meta.name === name) { kept.push(id); continue; }
      await driveJson(`/drive/v3/files/${encodeURIComponent(id)}?fields=id,name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      renamed.push({ id, from: meta.name, to: name });
    }
    return json({ jobId, name, renamed, kept, skipped });
  } catch (error) {
    console.error('rename-client-drive-folder:', (error as Error).message);
    return json({ error: (error as Error).message }, 500);
  }
});
