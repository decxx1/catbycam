import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-helpers';
import { DollarRateService } from '@/services/dollarRateService';
import { SettingsService } from '@/services/settingsService';

export const GET: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const [rates, dollarType] = await Promise.all([
      DollarRateService.getAll(),
      SettingsService.getDollarType(),
    ]);

    const selectedRate = rates.find(r => r.casa === dollarType) || null;

    return new Response(JSON.stringify({
      rates,
      dollar_type: dollarType,
      selected_rate: selectedRate,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching dollar rates:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener cotizaciones' }), { status: 500 });
  }
};
