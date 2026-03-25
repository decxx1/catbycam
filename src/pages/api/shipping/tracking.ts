import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/auth-helpers';
import { MiCorreoService } from '@/services/miCorreoService';
import pool from '@/utils/db';

export const GET: APIRoute = async ({ request, url }) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user: sessionUser } = authResult;

  const orderId = url.searchParams.get('orderId');
  if (!orderId) {
    return new Response(JSON.stringify({ error: 'orderId is required' }), { status: 400 });
  }

  // Fetch the order and verify ownership
  const [rows]: any = await pool.execute(
    'SELECT id, mc_shipping_id, mc_tracking_number, user_id FROM orders WHERE id = ?',
    [orderId]
  );

  const order = rows[0];

  if (!order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
  }

  if (order.user_id !== sessionUser.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  if (!order.mc_shipping_id) {
    return new Response(
      JSON.stringify({ error: 'This order has not been dispatched yet' }),
      { status: 404 }
    );
  }

  try {
    const tracking = await MiCorreoService.getTracking(order.mc_shipping_id);
    return new Response(JSON.stringify({ tracking, trackingNumber: order.mc_tracking_number }), { status: 200 });
  } catch (error) {
    console.error('[API /api/shipping/tracking]', error);
    return new Response(
      JSON.stringify({ error: 'Could not fetch tracking information' }),
      { status: 502 }
    );
  }
};
