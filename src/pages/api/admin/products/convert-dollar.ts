import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-helpers';
import { ProductService } from '@/services/productService';
import { DollarRateService } from '@/services/dollarRateService';
import { SettingsService } from '@/services/settingsService';

export const POST: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const dollarType = await SettingsService.getDollarType();
    const rate = await DollarRateService.getByCasa(dollarType);

    if (!rate) {
      return new Response(
        JSON.stringify({ error: `No hay cotización disponible para dólar ${dollarType}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const affected = await ProductService.convertDollarPrices(rate.venta);

    return new Response(
      JSON.stringify({
        success: true,
        affected,
        dollar_type: dollarType,
        dollar_venta: rate.venta,
        message: `${affected} producto(s) actualizados al dólar ${dollarType} ($${rate.venta})`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error converting dollar prices:', error);
    return new Response(
      JSON.stringify({ error: 'Error al convertir precios' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
