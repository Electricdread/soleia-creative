// Stream a Google Drive file back to the caller via the connector gateway.
// Body: { fileId: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Expose-Headers': 'content-disposition, content-type, content-length',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/google_drive';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const driveKey = Deno.env.get('GOOGLE_DRIVE_API_KEY');
    if (!lovableKey) throw new Error('LOVABLE_API_KEY is not configured');
    if (!driveKey) throw new Error('GOOGLE_DRIVE_API_KEY is not configured');

    const url = new URL(req.url);
    let fileId = url.searchParams.get('fileId');
    if (!fileId && req.method !== 'GET') {
      const body = await req.json().catch(() => ({}));
      fileId = body?.fileId;
    }
    if (!fileId || !/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) {
      return new Response(
        JSON.stringify({ error: 'Valid fileId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Get filename for Content-Disposition
    const metaRes = await fetch(
      `${GATEWAY}/drive/v3/files/${fileId}?fields=name,mimeType,size`,
      {
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          'X-Connection-Api-Key': driveKey,
        },
      },
    );
    if (!metaRes.ok) {
      const t = await metaRes.text();
      throw new Error(`Metadata fetch failed [${metaRes.status}]: ${t.slice(0, 300)}`);
    }
    const meta = await metaRes.json();

    const fileRes = await fetch(
      `${GATEWAY}/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          'X-Connection-Api-Key': driveKey,
        },
      },
    );
    if (!fileRes.ok || !fileRes.body) {
      const t = await fileRes.text();
      throw new Error(`Download failed [${fileRes.status}]: ${t.slice(0, 300)}`);
    }

    const safeName = (meta.name || 'download').replace(/"/g, '');
    return new Response(fileRes.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': meta.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeName}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('download-from-drive error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
