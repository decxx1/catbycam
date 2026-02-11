import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-helpers';
import { SettingsService } from '@/services/settingsService';

export const GET: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const [mpConfig, contactInfo, purchasesEnabled] = await Promise.all([
      SettingsService.getMercadoPagoConfig(),
      SettingsService.getContactInfo(),
      SettingsService.isPurchasesEnabled(),
    ]);
    
    return new Response(JSON.stringify({
      mp_public_key: mpConfig.publicKey || '',
      mp_access_token: mpConfig.accessToken || '',
      contact_whatsapp: contactInfo.whatsapp || '',
      contact_email: contactInfo.email || '',
      contact_address: contactInfo.address || '',
      contact_maps_url: contactInfo.mapsUrl || '',
      contact_maps_iframe: contactInfo.mapsIframe || '',
      store_purchases_enabled: purchasesEnabled,
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
    const { mp_public_key, mp_access_token, contact_whatsapp, contact_email, contact_address, contact_maps_url, contact_maps_iframe, store_purchases_enabled } = body;

    // Ensure table exists
    await SettingsService.createTable();

    // Save MercadoPago settings
    if (mp_public_key !== undefined && mp_access_token !== undefined) {
      await SettingsService.setMercadoPagoConfig(mp_public_key, mp_access_token);
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

    // Save store purchases toggle
    if (store_purchases_enabled !== undefined) {
      await SettingsService.setPurchasesEnabled(store_purchases_enabled);
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
