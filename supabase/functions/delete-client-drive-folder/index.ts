// Retire the Google Drive folder a packet created, when it is safe to.
//
// Saving a packet with a client name creates a job folder under
// `Soleia Clients/`. Deleting the packet used to leave that folder behind, so
// Drive filled up with folders for packets that no longer exist.
//
// The folder is NOT the packet's private property: `create-client-drive-folder`
// deliberately hands the same folder to the job's proposal, and clients upload
// their brand assets into `03_Client Asset Collect` inside it. So this function
// refuses to touch a folder anything else still points at, and it trashes
// rather than deletes — Drive keeps a trashed folder for 30 days.
//
// POST { packet_id, action: 'check' | 'trash' }, admin session required.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/google_drive';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

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
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) {
    throw new Error(`Drive gateway ${path} failed [${res.status}]: ${text.slice(0, 300)}`);
  }
  return parsed;
}

interface Blocker { type: 'proposal' | 'packet' | 'job'; id: string; label: string }

/** Everything other than this packet that still points at the folder. */
async function findBlockers(
  supabase: ReturnType<typeof createClient>,
  folderId: string,
  packetId: string,
): Promise<{ blockers: Blocker[]; releaseJobIds: string[] }> {
  const blockers: Blocker[] = [];
  const releaseJobIds: string[] = [];

  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, event_name, client_name')
    .eq('drive_folder_id', folderId);
  for (const p of (proposals ?? []) as any[]) {
    blockers.push({
      type: 'proposal',
      id: p.id,
      label: [p.client_name, p.event_name].filter(Boolean).join(' — ') || 'Proposal',
    });
  }

  const { data: packets } = await supabase
    .from('pre_call_packets')
    .select('id, title, client_name')
    .eq('drive_folder_id', folderId)
    .neq('id', packetId);
  for (const p of (packets ?? []) as any[]) {
    blockers.push({
      type: 'packet',
      id: p.id,
      label: [p.client_name, p.title].filter(Boolean).join(' — ') || 'Packet',
    });
  }

  // A job holding the same folder is only a blocker while something else is
  // still attached to it. A job whose sole attachment is the packet being
  // deleted has nothing left to keep the folder for, so it gets released
  // alongside rather than standing in the way.
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, client_name')
    .eq('drive_folder_id', folderId);
  for (const j of (jobs ?? []) as any[]) {
    const [{ count: proposalCount }, { count: packetCount }, { count: sessionCount }] = await Promise.all([
      supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('job_id', j.id),
      supabase.from('pre_call_packets').select('id', { count: 'exact', head: true }).eq('job_id', j.id).neq('id', packetId),
      supabase.from('creative_sessions').select('id', { count: 'exact', head: true }).eq('job_id', j.id),
    ]);
    if ((proposalCount ?? 0) + (packetCount ?? 0) + (sessionCount ?? 0) > 0) {
      blockers.push({
        type: 'job',
        id: j.id,
        label: [j.client_name, j.title].filter(Boolean).join(' — ') || 'Job',
      });
    } else {
      releaseJobIds.push(j.id);
    }
  }

  return { blockers, releaseJobIds };
}

/**
 * Count the files sitting in the folder tree, so the admin is told what they
 * are about to bin. Walks a bounded number of folders — the layout is shallow,
 * and a runaway walk on a huge client drop is not worth a timeout.
 */
async function countFiles(
  folderId: string,
  lovableKey: string,
  driveKey: string,
): Promise<{ files: number; truncated: boolean }> {
  const queue = [folderId];
  let files = 0;
  let requests = 0;
  const MAX_REQUESTS = 40;

  while (queue.length) {
    if (requests >= MAX_REQUESTS) return { files, truncated: true };
    const parent = queue.shift()!;
    const q = encodeURIComponent(`'${parent}' in parents and trashed=false`);
    let pageToken = '';
    do {
      if (requests >= MAX_REQUESTS) return { files, truncated: true };
      requests++;
      const page = await gw(
        `/drive/v3/files?q=${q}&fields=nextPageToken,files(id,mimeType)&pageSize=200` +
          (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''),
        { method: 'GET' },
        lovableKey,
        driveKey,
      );
      for (const f of (page?.files ?? []) as { id: string; mimeType: string }[]) {
        if (f.mimeType === 'application/vnd.google-apps.folder') queue.push(f.id);
        else files++;
      }
      pageToken = page?.nextPageToken ?? '';
    } while (pageToken);
  }

  return { files, truncated: false };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const driveKey = Deno.env.get('GOOGLE_DRIVE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) throw new Error('Supabase env not configured');
    if (!lovableKey) throw new Error('LOVABLE_API_KEY is not configured');
    if (!driveKey) throw new Error('GOOGLE_DRIVE_API_KEY is not configured');

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Binning a client's folder is an admin action, and the packet row itself
    // is protected by RLS, so the same bar applies here.
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return json(401, { error: 'Authentication required' });
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.slice(7).trim());
    if (userErr || !userData?.user) return json(401, { error: 'Invalid or expired session' });
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) return json(403, { error: 'Admin privileges required' });

    const body = await req.json().catch(() => ({}));
    const packetId: string | undefined = body?.packet_id;
    const action: 'check' | 'trash' = body?.action === 'trash' ? 'trash' : 'check';
    if (!packetId || typeof packetId !== 'string') {
      return json(400, { error: 'packet_id required' });
    }

    const { data: packet, error: packetErr } = await supabase
      .from('pre_call_packets')
      .select('id, title, client_name, drive_folder_id, drive_folder_url')
      .eq('id', packetId)
      .maybeSingle();
    if (packetErr) throw new Error(`Fetch packet failed: ${packetErr.message}`);
    if (!packet) return json(404, { error: 'Packet not found' });

    const folderId = (packet as any).drive_folder_id as string | null;
    if (!folderId) return json(200, { hasFolder: false });

    const { blockers, releaseJobIds } = await findBlockers(supabase, folderId, packetId);

    // Folder metadata, read from Drive rather than assumed: a folder someone
    // already tidied up by hand should say so instead of erroring on the way
    // to the bin.
    let folderName: string | null = null;
    let alreadyTrashed = false;
    let missing = false;
    try {
      const meta = await gw(
        `/drive/v3/files/${folderId}?fields=id,name,trashed`,
        { method: 'GET' },
        lovableKey,
        driveKey,
      );
      folderName = meta?.name ?? null;
      alreadyTrashed = Boolean(meta?.trashed);
    } catch (e) {
      missing = true;
      console.warn(`Drive folder ${folderId} could not be read: ${(e as Error).message}`);
    }

    let files = 0;
    let truncated = false;
    if (!missing && !alreadyTrashed) {
      try {
        const counted = await countFiles(folderId, lovableKey, driveKey);
        files = counted.files;
        truncated = counted.truncated;
      } catch (e) {
        console.warn(`Counting ${folderId} failed: ${(e as Error).message}`);
      }
    }

    const state = {
      hasFolder: true,
      folderId,
      folderName,
      folderUrl: (packet as any).drive_folder_url ?? `https://drive.google.com/drive/folders/${folderId}`,
      missing,
      alreadyTrashed,
      files,
      truncated,
      blockers,
      canTrash: blockers.length === 0,
    };

    if (action === 'check') return json(200, state);

    // trash — the blockers were just recomputed here, never taken from the
    // caller, so a stale dialog cannot talk this into binning a shared folder.
    if (blockers.length) {
      return json(409, { ...state, error: 'Folder is still in use', trashed: false });
    }

    if (!missing && !alreadyTrashed) {
      await gw(
        `/drive/v3/files/${folderId}?fields=id,trashed`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trashed: true }),
        },
        lovableKey,
        driveKey,
      );
    }

    await supabase
      .from('pre_call_packets')
      .update({ drive_folder_id: null, drive_folder_url: null })
      .eq('id', packetId);

    if (releaseJobIds.length) {
      await supabase
        .from('jobs')
        .update({ drive_folder_id: null, drive_folder_url: null })
        .in('id', releaseJobIds);
    }

    return json(200, { ...state, trashed: true, releasedJobs: releaseJobIds.length });
  } catch (e) {
    console.error('delete-client-drive-folder failed', e);
    return json(500, { error: (e as Error).message ?? 'Unknown error' });
  }
});
