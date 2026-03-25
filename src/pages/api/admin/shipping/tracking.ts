import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-helpers';
import { MiCorreoService } from '@/services/miCorreoService';
import pool from '@/utils/db';

export const GET: APIRoute = async ({ request, url }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const orderId = url.searchParams.get('orderId');
  if (!orderId) {
    return new Response(JSON.stringify({ error: 'orderId is required' }), { status: 400 });
  }

  const [rows]: any = await pool.execute(
    'SELECT id, mc_shipping_id, mc_tracking_number FROM orders WHERE id = ?',
    [orderId]
  );

  const order = rows[0];
  if (!order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
  }

  if (!order.mc_shipping_id) {
    return new Response(
      JSON.stringify({ error: 'This order has not been imported to MiCorreo yet' }),
      { status: 404 }
    );
  }

  try {
    const trackingResults = await MiCorreoService.getTracking(order.mc_shipping_id);
    const first = Array.isArray(trackingResults) ? trackingResults[0] : null;
    const events = first?.events ?? (Array.isArray(trackingResults) ? [] : []);
    const trackingNumber = first?.trackingNumber ?? order.mc_tracking_number ?? null;

    // Persist tracking number if it was missing
    if (trackingNumber && !order.mc_tracking_number) {
      await pool.execute(
        'UPDATE orders SET mc_tracking_number = ? WHERE id = ?',
        [trackingNumber, orderId]
      );
    }

    return new Response(JSON.stringify({ events, trackingNumber }), { status: 200 });
  } catch (error) {
    console.error('[API /api/admin/shipping/tracking]', error);
    return new Response(
      JSON.stringify({ error: 'Could not fetch tracking information' }),
      { status: 502 }
    );
  }
};
