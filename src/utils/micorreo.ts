import { MC_USER, MC_PASSWORD, MC_BASE_URL, MC_TEST_BASE_URL } from 'astro:env/server';

// In dev (IS_PROD=false), use the test environment if MC_TEST_BASE_URL is defined
const activeBaseUrl: string = import.meta.env.PROD ? MC_BASE_URL : (MC_TEST_BASE_URL ?? MC_BASE_URL);

interface TokenCache {
  token: string;
  expires: Date;
}

let cachedToken: TokenCache | null = null;

async function getToken(): Promise<string> {
  const now = new Date();

  if (cachedToken && cachedToken.expires > now) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(`${MC_USER}:${MC_PASSWORD}`).toString('base64');

  const response = await fetch(`${activeBaseUrl}/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    throw new Error(`[MiCorreo] Auth failed with status ${response.status}`);
  }

  const data: { token: string; expire?: string; expires?: string } = await response.json();
  const expiresStr = data.expire ?? data.expires ?? '';

  cachedToken = {
    token: data.token,
    // The API returns a datetime string like "2022-04-26 21:16:20" (field may be "expire" or "expires")
    expires: expiresStr ? new Date(expiresStr.replace(' ', 'T')) : new Date(Date.now() + 9 * 60 * 60 * 1000),
  };

  return cachedToken.token;
}

export async function fetchMiCorreo<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const response = await fetch(`${activeBaseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  // Token expired mid-session — refresh once and retry
  if (response.status === 401) {
    cachedToken = null;
    const freshToken = await getToken();

    const retry = await fetch(`${activeBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshToken}`,
        ...options.headers,
      },
    });

    if (!retry.ok) {
      const errorBody = await retry.text();
      throw new Error(`[MiCorreo] ${retry.status} ${endpoint}: ${errorBody}`);
    }

    const retryText = await retry.text();
    if (!retryText) return [] as unknown as T;
    return JSON.parse(retryText) as T;
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`[MiCorreo] ${response.status} ${endpoint}: ${errorBody}`);
  }

  const text = await response.text();
  if (!text) return [] as unknown as T; // empty body (e.g. tracking with no events in test env)
  return JSON.parse(text) as T;
}
