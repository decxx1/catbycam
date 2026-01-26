import { MercadoPagoConfig, Preference } from 'mercadopago';
import { SettingsService } from '@/services/settingsService';

let cachedAccessToken: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  
  // Return cached token if still valid
  if (cachedAccessToken && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedAccessToken;
  }

  try {
    const config = await SettingsService.getMercadoPagoConfig();
    if (config.accessToken) {
      cachedAccessToken = config.accessToken;
      cacheTimestamp = now;
      return config.accessToken;
    }
  } catch (error) {
    console.warn('Could not fetch MP config from DB, falling back to env var');
  }
  return '';
}

function createMPClient(accessToken: string) {
  return new MercadoPagoConfig({ 
    accessToken,
    options: { timeout: 5000 }
  });
}

export async function createPreference(body: any) {
  const accessToken = await getAccessToken();
  const client = createMPClient(accessToken);
  const preference = new Preference(client);
  return preference.create(body);
}

export async function getPublicKey(): Promise<string> {
  try {
    const config = await SettingsService.getMercadoPagoConfig();
    if (config.publicKey) {
      return config.publicKey;
    }
  } catch (error) {
    console.warn('Could not fetch MP public key from DB, falling back to env var');
  }
  return '';
}

export async function getAccessTokenForWebhook(): Promise<string> {
  return getAccessToken();
}
