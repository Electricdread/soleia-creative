// Upload a file to Google Drive using Soleia's server-side Google OAuth grant.
//
// By default a file lands in "Soleia Originals/<YYYY-Q#>" — cold storage for
// clip masters. Pass `folderId` to put it in a job's own folder instead, and
// `assetCollect=true` to put it in that job's client asset drop, which is where
// a document attached to a calendar event belongs: the client is already
// looking in there.
//
// Returns { fileId, webViewLink, folderId }.

import { driveAuthMode, driveJson } from '../_shared/googleDrive.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function quarterFolderName(d = new Date()) {
  const year = d.getUTCFullYear();
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `${year}-Q${q}`;
}

async function gatewayJson(
  path: string,
  init: RequestInit,
) {
  return driveJson(path, init);
}

async function findOrCreateFolder(
  name: string,
  parentId: string | null,
): Promise<string> {
  const parentClause = parentId
    ? ` and '${parentId}' in parents`
    : '';
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and trashed=false${parentClause}`,
  );
  const list = await gatewayJson(
    `/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`,
    { method: 'GET' },
  );
  if (list?.files?.length) return list.files[0].id;

  const body: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) body.parents = [parentId];

  const created = await gatewayJson(
    '/drive/v3/files?fields=id',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  return created.id;
}

/** Lowercase, punctuation to spaces — the asset drop is spelled two ways. */
const normalise = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

/**
 * The client asset drop inside a job folder, under either of its spellings —
 * `03_Client Asset Collect` or `Client Asset Collect`.
 *
 * When there is no such child this returns the job folder itself rather than
 * creating one: a second asset folder beside the one the client is already
 * uploading to is the failure this project has had twice.
 */
async function assetCollectFolder(
  jobFolderId: string,
): Promise<string> {
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and '${jobFolderId}' in parents and trashed=false`,
  );
  const list = await gatewayJson(
    `/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=100`,
    { method: 'GET' },
  );
  const hit = (list?.files ?? []).find((f: { name: string }) =>
    normalise(f.name).endsWith('client asset collect'),
  );
  return hit?.id ?? jobFolderId;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    driveAuthMode();

    const form = await req.formData();
    const file = form.get('file');
    const filename = String(form.get('filename') || (file instanceof File ? file.name : 'upload.bin'));
    const mimeType = String(form.get('mimeType') || (file instanceof File ? file.type : 'application/octet-stream'));

    if (!(file instanceof File) && !(file instanceof Blob)) {
      return new Response(
        JSON.stringify({ error: 'Missing "file" form field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (file.size > 5 * 1024 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File exceeds 5GB limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // A caller that names a folder gets that folder; everything else keeps
    // landing in the quarterly originals bucket.
    const requestedFolder = String(form.get('folderId') || '').trim();
    const wantAssetCollect = String(form.get('assetCollect') || '') === 'true';

    let quarterId: string;
    if (requestedFolder) {
      quarterId = wantAssetCollect
        ? await assetCollectFolder(requestedFolder)
        : requestedFolder;
    } else {
      const rootId = await findOrCreateFolder('Soleia Originals', null);
      quarterId = await findOrCreateFolder(quarterFolderName(), rootId);
    }

    // Multipart upload
    const boundary = '----soleia-' + crypto.randomUUID();
    const metadata = {
      name: filename,
      parents: [quarterId],
      mimeType,
    };
    const fileBuf = new Uint8Array(await (file as Blob).arrayBuffer());
    const enc = new TextEncoder();
    const head = enc.encode(
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) + `\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`,
    );
    const tail = enc.encode(`\r\n--${boundary}--`);
    const body = new Uint8Array(head.length + fileBuf.length + tail.length);
    body.set(head, 0);
    body.set(fileBuf, head.length);
    body.set(tail, head.length + fileBuf.length);

    const uploaded = await gatewayJson(
      '/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,size,name',
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body,
      },
    );

    return new Response(
      JSON.stringify({
        fileId: uploaded.id,
        webViewLink: uploaded.webViewLink,
        folderId: quarterId,
        size: uploaded.size,
        name: uploaded.name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('upload-to-drive error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
