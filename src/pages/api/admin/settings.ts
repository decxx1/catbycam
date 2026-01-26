import type { APIRoute } from 'astro';
import { getSession } from '@/utils/auth';
import { UserService } from '@/services/userService';
import { SettingsService } from '@/services/settingsService';

async function isAdmin(cookies: any): Promise<boolean> {
  const token = cookies.get('auth_token')?.value;
  if (!token) return false;
  
  const session = await getSession(token);
  if (!session) return false;
  
  const user = await UserService.findById(session.userId);
  return user?.role === 'admin';
}

export const GET: APIRoute = async ({ cookies }) => {
  if (!await isAdmin(cookies)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const mpConfig = await SettingsService.getMercadoPagoConfig();
    
    return new Response(JSON.stringify({
      mp_public_key: mpConfig.publicKey || '',
      mp_access_token: mpConfig.accessToken || ''
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener configuración' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!await isAdmin(cookies)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { mp_public_key, mp_access_token } = body;

    // Ensure table exists
    await SettingsService.createTable();

    // Save MercadoPago settings
    if (mp_public_key !== undefined && mp_access_token !== undefined) {
      await SettingsService.setMercadoPagoConfig(mp_public_key, mp_access_token);
    }

    return new Response(JSON.stringify({ success: true, message: 'Configuración guardada correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return new Response(JSON.stringify({ error: 'Error al guardar configuración' }), { status: 500 });
  }
};
