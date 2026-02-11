import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-helpers';
import { SettingsService } from '@/services/settingsService';

export const GET: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const [mpConfig, contactInfo, dollarType] = await Promise.all([
      SettingsService.getMercadoPagoConfig(),
      SettingsService.getContactInfo(),
      SettingsService.getDollarType(),
    ]);
    
    return new Response(JSON.stringify({
      mp_public_key: mpConfig.publicKey || '',
      mp_access_token: mpConfig.accessToken || '',
      contact_whatsapp: contactInfo.whatsapp || '',
      contact_email: contactInfo.email || '',
      contact_address: contactInfo.address || '',
      contact_maps_url: contactInfo.mapsUrl || '',
      contact_maps_iframe: contactInfo.mapsIframe || '',
      dollar_type: dollarType,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener configuración' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await request.json();
    const { mp_public_key, mp_access_token, contact_whatsapp, contact_email, contact_address, contact_maps_url, contact_maps_iframe, dollar_type } = body;

    // Ensure table exists
    await SettingsService.createTable();

    // Save MercadoPago settings
    if (mp_public_key !== undefined && mp_access_token !== undefined) {
      await SettingsService.setMercadoPagoConfig(mp_public_key, mp_access_token);
    }

    // Save Dollar type
    if (dollar_type !== undefined) {
      await SettingsService.setDollarType(dollar_type);
    }

    // Save Contact settings
    if (contact_whatsapp !== undefined) {
      await SettingsService.setContactInfo({
        whatsapp: contact_whatsapp,
        email: contact_email,
        address: contact_address,
        mapsUrl: contact_maps_url,
        mapsIframe: contact_maps_iframe,
      });
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
