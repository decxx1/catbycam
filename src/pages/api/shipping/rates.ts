import type { APIRoute } from 'astro';
import { MiCorreoService } from '@/services/miCorreoService';
import type { Dimensions } from '@/services/miCorreoService';

export const POST: APIRoute = async ({ request }) => {
  let body: {
    postalCodeDestination: string;
    dimensions: Dimensions;
    deliveredType?: 'D' | 'S';
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { postalCodeDestination, dimensions, deliveredType } = body;

  if (!postalCodeDestination || !dimensions) {
    return new Response(
      JSON.stringify({ error: 'postalCodeDestination and dimensions are required' }),
      { status: 400 }
    );
  }

  try {
    const rates = await MiCorreoService.getRates(postalCodeDestination, dimensions, deliveredType);
    return new Response(JSON.stringify(rates), { status: 200 });
  } catch (error: any) {
    console.error('[API /api/shipping/rates]', error);
    return new Response(
      JSON.stringify({ error: error.message ?? 'Could not fetch shipping rates' }),
      { status: 502 }
    );
  }
};
