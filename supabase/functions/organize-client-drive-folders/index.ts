/**
 * Client job folders, coloured by how close the show is and archived once it is over (owner, 2026-09-14:
 * "in google drive can there be a color coded for for next upcoming events? and archive event folders that
 * have past?"). The rules live in `_shared/driveFolderTiers.ts`:
 * - a show within 7 days is red, 8 to 30 days out is indiglo blue, anything later is left as it is;
 * - 7 days after the show the folder moves into "Soleia Clients / Archive". It moves back if the job is
 *   re-dated into the future.
 *
 * It only touches a folder that sits directly in "Soleia Clients" or its Archive and that a job, packet or
 * proposal points at. A moved folder keeps its id, contents and share links, so everything that finds folders
 * by id carries on: the watcher, the job's links, and DreamlinkX OS's mirror.
 *
 * It never clears a colour it did not set. It marks its own colour with private properties (`soleiaTier`, plus
 * `soleiaWas` for the colour the folder wore before) and only puts back what carries that mark.
 *
 * Runs every morning (pg_cron `soleia-drive-folder-tiers`). `?dry=1` reports what a run would do and writes
 * nothing, not even the Archive folder.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { driveJson } from '../_shared/googleDrive.ts';
import { FOLDER_MIME, soleiaClientsRoot } from '../_shared/clientFolders.ts';
import {
  ARCHIVE_FOLDER_NAME,
  PLAIN_FOLDER_COLOUR,
  TIER_COLOUR,
  colourToRestore,
  folderShowDate,
  folderTier,
  nearestColour,
  venueToday,
  type FolderTier,
} from '../_shared/driveFolderTiers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const TIER_KEY = 'soleiaTier';
const WAS_KEY = 'soleiaWas';

interface DriveFolder {
  id: string;
  name: string;
  folderColorRgb?: string;
  appProperties?: Record<string, string>;
}

async function childFolders(parentId: string): Promise<DriveFolder[]> {
  const folders: DriveFolder[] = [];
  let pageToken = '';
  do {
    const q = encodeURIComponent(`mimeType='${FOLDER_MIME}' and '${parentId}' in parents and trashed=false`);
    const fields = encodeURIComponent('nextPageToken,files(id,name,folderColorRgb,appProperties)');
    const page = await driveJson(
      `/drive/v3/files?q=${q}&fields=${fields}&pageSize=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`,
      { method: 'GET' },
    );
    folders.push(...(page?.files ?? []));
    pageToken = page?.nextPageToken ?? '';
  } while (pageToken);
  return folders;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const dry = new URL(req.url).searchParams.get('dry') === '1';
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const today = venueToday();

    const root = await soleiaClientsRoot(supabase);
    if (!root) return json({ error: 'No "Soleia Clients" folder was found.' }, 500);

    // The show date behind every folder a record points at. A packet or proposal on a job answers to the job's
    // date, which is the show day; one without a job answers to its own.
    const [jobs, packets, proposals] = await Promise.all([
      supabase.from('jobs').select('id, event_date, drive_folder_id'),
      supabase.from('pre_call_packets').select('job_id, event_date, drive_folder_id').not('drive_folder_id', 'is', null),
      supabase.from('proposals').select('job_id, event_date, drive_folder_id').not('drive_folder_id', 'is', null),
    ]);
    if (jobs.error) throw new Error(`jobs: ${jobs.error.message}`);
    if (packets.error) throw new Error(`pre_call_packets: ${packets.error.message}`);
    if (proposals.error) throw new Error(`proposals: ${proposals.error.message}`);

    type Row = { id?: string; job_id?: string | null; event_date: string | null; drive_folder_id: string | null };
    const jobDate = new Map(((jobs.data ?? []) as Row[]).map((job) => [job.id as string, job.event_date]));
    const datesByFolder = new Map<string, (string | null)[]>();
    const note = (folderId: string | null, date: string | null) => {
      // A Drive folder id is 28+ characters; a few old job rows hold ids cut to 5, which are not folders.
      if (typeof folderId !== 'string' || folderId.length < 20) return;
      datesByFolder.set(folderId, [...(datesByFolder.get(folderId) ?? []), date]);
    };
    for (const job of (jobs.data ?? []) as Row[]) note(job.drive_folder_id, job.event_date);
    for (const row of [...(packets.data ?? []), ...(proposals.data ?? [])] as Row[]) {
      note(row.drive_folder_id, (row.job_id ? jobDate.get(row.job_id) : null) || row.event_date);
    }

    const about = await driveJson('/drive/v3/about?fields=folderColorPalette', { method: 'GET' }).catch(() => null);
    const palette: string[] = about?.folderColorPalette ?? [];
    const colours = { hot: nearestColour(TIER_COLOUR.hot, palette), soon: nearestColour(TIER_COLOUR.soon, palette) };

    const inRoot = await childFolders(root);
    let archive: DriveFolder | null = inRoot.find((folder) => folder.name === ARCHIVE_FOLDER_NAME) ?? null;
    const inArchive = archive ? await childFolders(archive.id) : [];
    const ensureArchive = async (): Promise<DriveFolder | null> => {
      if (archive || dry) return archive;
      archive = await driveJson('/drive/v3/files?fields=id,name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ARCHIVE_FOLDER_NAME, mimeType: FOLDER_MIME, parents: [root] }),
      });
      return archive;
    };

    const tiers: Record<FolderTier, number> = { hot: 0, soon: 0, later: 0, past: 0, archive: 0 };
    const changes: Record<string, unknown>[] = [];
    const unlinked: string[] = [];
    const undated: string[] = [];
    const candidates = [
      ...inRoot.filter((folder) => folder.id !== archive?.id).map((folder) => ({ folder, archived: false })),
      ...inArchive.map((folder) => ({ folder, archived: true })),
    ];

    // A record can point at a subfolder of its job's folder (Whatnot points at its 03_Client Asset Collect).
    // It answers for the folder above it.
    const candidateIds = new Set(candidates.map(({ folder }) => folder.id));
    for (const [folderId, dates] of [...datesByFolder]) {
      if (candidateIds.has(folderId)) continue;
      const meta = await driveJson(`/drive/v3/files/${encodeURIComponent(folderId)}?fields=parents,trashed`, { method: 'GET' })
        .catch(() => null);
      const parent = meta && !meta.trashed ? (meta.parents ?? []).find((id: string) => candidateIds.has(id)) : undefined;
      if (parent) datesByFolder.set(parent, [...(datesByFolder.get(parent) ?? []), ...dates]);
    }

    for (const { folder, archived } of candidates) {
      const dates = datesByFolder.get(folder.id);
      if (!dates) { unlinked.push(folder.name); continue; }
      const show = folderShowDate(dates, today);
      const tier = show ? folderTier(show, today) : null;
      if (!show || !tier) { undated.push(folder.name); continue; }
      tiers[tier] += 1;

      const change: Record<string, unknown> = { name: folder.name, show, tier };
      const query = new URLSearchParams({ fields: 'id,folderColorRgb,parents' });
      const patch: Record<string, unknown> = {};

      const belongsInArchive = tier === 'archive';
      if (belongsInArchive !== archived) {
        change.move = belongsInArchive ? 'into Archive' : 'back to Soleia Clients';
        const from = archived ? archive?.id : root;
        const to = belongsInArchive ? (await ensureArchive())?.id : root;
        if (from && to) {
          query.set('addParents', to);
          query.set('removeParents', from);
        }
      }

      const current = folder.folderColorRgb ?? '';
      const marked = folder.appProperties?.[TIER_KEY];
      if (tier === 'hot' || tier === 'soon') {
        const want = colours[tier];
        if (current.toLowerCase() !== want.toLowerCase() || marked !== tier) {
          patch.folderColorRgb = want;
          // Keep the colour the folder wore before this job first coloured it, to put back later.
          const was = marked ? folder.appProperties?.[WAS_KEY] || PLAIN_FOLDER_COLOUR : colourToRestore(current, want);
          patch.appProperties = { [TIER_KEY]: tier, [WAS_KEY]: was };
          change.colour = { from: current || null, to: want };
        }
      } else if (marked) {
        const was = folder.appProperties?.[WAS_KEY] || PLAIN_FOLDER_COLOUR;
        patch.folderColorRgb = was;
        patch.appProperties = { [TIER_KEY]: null, [WAS_KEY]: null };
        change.colour = { from: current || null, to: was };
      }

      // A dry run with no Archive yet cannot name the move's target, but still reports the move.
      if (!change.move && !Object.keys(patch).length) continue;
      if (!dry) {
        try {
          const saved = await driveJson(`/drive/v3/files/${encodeURIComponent(folder.id)}?${query}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
          });
          change.saved = {
            colour: saved?.folderColorRgb ?? null,
            inArchive: Boolean(archive && (saved?.parents ?? []).includes(archive.id)),
          };
        } catch (error) {
          change.error = (error as Error).message;
        }
      }
      changes.push(change);
    }

    return json({ today, dry, colours, palette: palette.length, archive: archive?.id ?? null, tiers, changes, unlinked, undated });
  } catch (error) {
    console.error('organize-client-drive-folders:', (error as Error).message);
    return json({ error: (error as Error).message }, 500);
  }
});
