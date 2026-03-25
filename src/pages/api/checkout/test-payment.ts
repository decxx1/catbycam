import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/auth-helpers';
import pool from '@/utils/db';

// Only active in dev/test mode — blocked in production builds
export const POST: APIRoute = async ({ request }) => {
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: 'Not available in production' }), { status: 403 });
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user: sessionUser } = authResult;

  let orderId: number;
  try {
    const body = await request.json();
    orderId = body.orderId;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 });
  }

  if (!orderId) {
    return new Response(JSON.stringify({ error: 'orderId is required' }), { status: 400 });
  }

  // Verify the order belongs to this user and is still pending
  const [rows]: any = await pool.execute(
    'SELECT id, user_id, status FROM orders WHERE id = ? AND user_id = ?',
    [orderId, sessionUser.id]
  );

  const order = rows[0];
  if (!order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
  }
  if (order.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Order is not pending' }), { status: 409 });
  }

  await pool.execute(
    "UPDATE orders SET status = 'paid', payment_id = 'TEST-PAYMENT', shipping_status = 'processing' WHERE id = ?",
    [orderId]
  );

  return new Response(JSON.stringify({ success: true, orderId }), { status: 200 });
};
