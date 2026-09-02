// One Google Drive transport for every Soleia edge function.
//
// Preferred production mode is a DSX-owned OAuth grant stored as edge secrets:
//   GOOGLE_OAUTH_CLIENT_ID
//   GOOGLE_OAUTH_CLIENT_SECRET
//   GOOGLE_OAUTH_REFRESH_TOKEN
//
// The refresh token must be granted with the full Drive scope
// (https://www.googleapis.com/auth/drive). The watcher needs to see files that
// clients create, while the folder and upload functions need write access.
// `drive.file` cannot reliably see client-created files.
//
// During rollout only, the old Lovable connector remains an automatic fallback
// when none of the OAuth secrets are present. A partially configured OAuth set
// fails closed so a typo cannot silently send production traffic back through
// the connector.

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_API = 'https://www.googleapis.com';
const LOVABLE_GATEWAY = 'https://connector-gateway.lovable.dev/google_drive';

export type DriveAuthMode = 'google_oauth' | 'lovable_gateway';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;
let tokenRefreshInFlight: Promise<string> | null = null;

function oauthSecrets() {
  return {
    clientId: Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')?.trim() ?? '',
    clientSecret: Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')?.trim() ?? '',
    refreshToken: Deno.env.get('GOOGLE_OAUTH_REFRESH_TOKEN')?.trim() ?? '',
  };
}

function gatewaySecrets() {
  return {
    lovableKey: Deno.env.get('LOVABLE_API_KEY')?.trim() ?? '',
    driveKey: Deno.env.get('GOOGLE_DRIVE_API_KEY')?.trim() ?? '',
  };
}

export function driveAuthMode(): DriveAuthMode {
  const oauth = oauthSecrets();
  const oauthCount = [oauth.clientId, oauth.clientSecret, oauth.refreshToken]
    .filter(Boolean).length;

  if (oauthCount === 3) return 'google_oauth';
  if (oauthCount > 0) {
    throw new Error(
      'Google OAuth is partially configured; client ID, client secret, and refresh token are all required',
    );
  }

  const gateway = gatewaySecrets();
  if (gateway.lovableKey && gateway.driveKey) return 'lovable_gateway';
  throw new Error(
    'Google Drive is not configured; add the three GOOGLE_OAUTH_* secrets',
  );
}

async function refreshAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  if (tokenRefreshInFlight) return tokenRefreshInFlight;

  tokenRefreshInFlight = requestNewAccessToken(now);
  try {
    return await tokenRefreshInFlight;
  } finally {
    tokenRefreshInFlight = null;
  }
}

async function requestNewAccessToken(now: number): Promise<string> {

  const { clientId, clientSecret, refreshToken } = oauthSecrets();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await response.text();
  let token: { access_token?: string; expires_in?: number; error?: string; error_description?: string } = {};
  try {
    token = text ? JSON.parse(text) : {};
  } catch {
    // Keep the safe generic error below; token responses must never be logged.
  }
  if (!response.ok || !token.access_token) {
    const reason = token.error_description || token.error || `HTTP ${response.status}`;
    throw new Error(`Google OAuth token refresh failed: ${reason}`);
  }

  cachedToken = {
    accessToken: token.access_token,
    expiresAt: now + Math.max(60, token.expires_in ?? 3600) * 1000,
  };
  return cachedToken.accessToken;
}

function directUrl(path: string): string {
  if (path.startsWith('/upload/drive/v3/')) {
    return `${GOOGLE_API}/upload${path.slice('/upload'.length)}`;
  }
  if (path.startsWith('/drive/v3/')) return `${GOOGLE_API}${path}`;
  throw new Error(`Unsupported Google Drive path: ${path}`);
}

async function directFetch(path: string, init: RequestInit, retryAuth = true): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${await refreshAccessToken()}`);
  const response = await fetch(directUrl(path), { ...init, headers });

  // A token can be revoked between refresh and request. Refresh once; callers
  // still receive the real Google response if the replacement is also refused.
  if (response.status === 401 && retryAuth) {
    cachedToken = null;
    return directFetch(path, init, false);
  }
  return response;
}

/** Fetch a Drive v3 or Drive upload-v3 path using Soleia's configured auth. */
export async function driveFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const mode = driveAuthMode();
  if (mode === 'google_oauth') return directFetch(path, init);

  const { lovableKey, driveKey } = gatewaySecrets();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${lovableKey}`);
  headers.set('X-Connection-Api-Key', driveKey);
  return fetch(`${LOVABLE_GATEWAY}${path}`, { ...init, headers });
}

export async function driveJson(path: string, init: RequestInit = {}): Promise<any> {
  const response = await driveFetch(path, init);
  const text = await response.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // The status and bounded response below are more useful than a JSON parse error.
  }
  if (!response.ok) {
    throw new Error(`Google Drive ${path} failed [${response.status}]: ${text.slice(0, 500)}`);
  }
  return parsed;
}

/** Non-destructive credential check used by the admin health endpoint. */
export async function verifyDriveAuth(): Promise<{
  ok: boolean;
  mode: DriveAuthMode;
  status: number;
  text: string;
  json: any;
}> {
  const mode = driveAuthMode();
  const response = await driveFetch('/drive/v3/about?fields=user(displayName,emailAddress),storageQuota(limit,usage)');
  const text = await response.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { ok: response.ok, mode, status: response.status, text, json };
}
