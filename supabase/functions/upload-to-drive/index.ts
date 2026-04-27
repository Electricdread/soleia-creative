// Upload a file to Google Drive via the connector gateway.
// Stores originals in a "Soleia Originals/<YYYY-Q#>" folder.
// Returns { fileId, webViewLink, folderId }.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/google_drive';

function quarterFolderName(d = new Date()) {
  const year = d.getUTCFullYear();
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `${year}-Q${q}`;
}

async function gatewayJson(
  path: string,
  init: RequestInit,
  lovableKey: string,
  driveKey: string,
) {
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
    throw new Error(
      `Drive gateway ${path} failed [${res.status}]: ${text.slice(0, 500)}`,
    );
  }
  return json;
}

async function findOrCreateFolder(
  name: string,
  parentId: string | null,
  lovableKey: string,
  driveKey: string,
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
    lovableKey,
    driveKey,
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
    lovableKey,
    driveKey,
  );
  return created.id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const driveKey = Deno.env.get('GOOGLE_DRIVE_API_KEY');
    if (!lovableKey) throw new Error('LOVABLE_API_KEY is not configured');
    if (!driveKey) throw new Error('GOOGLE_DRIVE_API_KEY is not configured');

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

    const rootId = await findOrCreateFolder('Soleia Originals', null, lovableKey, driveKey);
    const quarterId = await findOrCreateFolder(quarterFolderName(), rootId, lovableKey, driveKey);

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
      lovableKey,
      driveKey,
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
