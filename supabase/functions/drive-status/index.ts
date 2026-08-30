// Health-check for Soleia's Google Drive authorization.
// Verifies: OAuth/gateway credentials, list permission, write permission.

import { driveAuthMode, driveFetch, verifyDriveAuth } from '../_shared/googleDrive.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

async function gw(
  path: string,
  init: RequestInit,
) {
  const res = await driveFetch(path, init);
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { ok: res.ok, status: res.status, text, json };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const report: any = {
    verifyCredentials: { ok: false },
    list: { ok: false },
    write: { ok: false },
    soleiaFolder: null,
    errors: [] as string[],
    startedAt: new Date().toISOString(),
  };

  const t0 = performance.now();

  try {
    report.authMode = driveAuthMode();

    // 1. Verify the active authorization with a non-destructive Drive call.
    const tA = performance.now();
    try {
      const verified = await verifyDriveAuth();
      report.verifyCredentials = {
        ok: verified.ok,
        status: verified.status,
        mode: verified.mode,
        account: verified.json?.user?.emailAddress ?? null,
        latencyMs: Math.round(performance.now() - tA),
        error: verified.ok ? null : verified.text.slice(0, 300),
      };
      if (!verified.ok) {
        report.errors.push(`verify_credentials [${verified.status}]: ${verified.text.slice(0, 200)}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      report.verifyCredentials = { ok: false, error: msg };
      report.errors.push(`verify_credentials: ${msg}`);
    }

    // 2. List - find Soleia Originals
    const tB = performance.now();
    const q = encodeURIComponent(
      "mimeType='application/vnd.google-apps.folder' and name='Soleia Originals' and trashed=false",
    );
    const listRes = await gw(
      `/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)&pageSize=1`,
      { method: 'GET' },
    );
    report.list = {
      ok: listRes.ok,
      status: listRes.status,
      latencyMs: Math.round(performance.now() - tB),
      error: listRes.ok ? null : listRes.text.slice(0, 300),
    };
    if (!listRes.ok) {
      report.errors.push(`list [${listRes.status}]: ${listRes.text.slice(0, 200)}`);
    } else if (listRes.json?.files?.length) {
      const f = listRes.json.files[0];
      report.soleiaFolder = {
        id: f.id,
        name: f.name,
        webViewLink: f.webViewLink ?? `https://drive.google.com/drive/folders/${f.id}`,
      };
    }

    // 3. Write - create + delete a temp folder
    const tC = performance.now();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const createRes = await gw(
      '/drive/v3/files?fields=id,name',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Soleia Health Check ${stamp}`,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      },
    );

    if (!createRes.ok) {
      report.write = {
        ok: false,
        status: createRes.status,
        latencyMs: Math.round(performance.now() - tC),
        error: createRes.text.slice(0, 300),
      };
      report.errors.push(`write/create [${createRes.status}]: ${createRes.text.slice(0, 200)}`);
    } else {
      const tempId = createRes.json?.id;
      // best-effort delete
      let deleteOk = false;
      let deleteErr: string | null = null;
      if (tempId) {
        const delRes = await gw(
          `/drive/v3/files/${tempId}`,
          { method: 'DELETE' },
        );
        deleteOk = delRes.ok || delRes.status === 204;
        if (!deleteOk) deleteErr = `delete [${delRes.status}]: ${delRes.text.slice(0, 200)}`;
      }
      report.write = {
        ok: true,
        createdId: tempId,
        cleanedUp: deleteOk,
        cleanupError: deleteErr,
        latencyMs: Math.round(performance.now() - tC),
        error: null,
      };
      if (deleteErr) report.errors.push(deleteErr);
    }

    report.totalMs = Math.round(performance.now() - t0);
    report.healthy =
      report.verifyCredentials.ok && report.list.ok && report.write.ok;

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    report.errors.push(message);
    report.totalMs = Math.round(performance.now() - t0);
    report.healthy = false;
    return new Response(JSON.stringify({ ...report, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
