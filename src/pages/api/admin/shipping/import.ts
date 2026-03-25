import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-helpers';
import { MiCorreoService } from '@/services/miCorreoService';
import pool from '@/utils/db';

export const POST: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  let body: {
    orderId: number;
    dimensions: { weight: number; height: number; width: number; length: number };
    declaredValue?: number;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { orderId, dimensions, declaredValue } = body;

  if (!orderId || !dimensions) {
    return new Response(
      JSON.stringify({ error: 'orderId and dimensions are required' }),
      { status: 400 }
    );
  }

  // Fetch order with user info
  const [orderRows]: any = await pool.execute(
    `SELECT o.*, u.name as user_name, u.email as user_email
     FROM orders o
     JOIN user u ON o.user_id = u.id
     WHERE o.id = ?`,
    [orderId]
  );

  const order = orderRows[0];
  if (!order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
  }

  if (order.mc_imported_at) {
    return new Response(
      JSON.stringify({ error: 'This order was already imported to MiCorreo', trackingNumber: order.mc_tracking_number }),
      { status: 409 }
    );
  }

  if (order.shipping_type === 'pickup') {
    return new Response(
      JSON.stringify({ error: 'Pickup orders do not require a MiCorreo shipment' }),
      { status: 400 }
    );
  }

  // Fetch user's default shipping address (with province code)
  const [addressRows]: any = await pool.execute(
    `SELECT sa.*, p.code as province_code
     FROM shipping_addresses sa
     LEFT JOIN provinces p ON sa.province_id = p.id
     WHERE sa.user_id = ? AND sa.is_default = TRUE
     LIMIT 1`,
    [order.user_id]
  );

  const addr = addressRows[0];
  if (!addr) {
    return new Response(
      JSON.stringify({ error: 'No default shipping address found for this user. Ask them to set one in their profile.' }),
      { status: 422 }
    );
  }

  if (!addr.province_code) {
    return new Response(
      JSON.stringify({ error: `Province "${addr.province_id}" has no MiCorreo code. Run db:seed to populate province codes.` }),
      { status: 422 }
    );
  }

  // Parse street name and number from the combined address field
  const streetMatch = addr.address.match(/^(.+?)\s+(\d+.*)$/);
  const streetName = streetMatch ? streetMatch[1].trim() : addr.address;
  const streetNumber = streetMatch ? streetMatch[2].trim() : 'S/N';

  try {
    await MiCorreoService.importShipping({
      extOrderId: String(orderId),
      orderNumber: String(orderId),
      recipientName: order.user_name,
      recipientEmail: order.user_email,
      recipientPhone: order.phone ?? addr.phone ?? '',
      deliveryType: 'D',
      shippingAddress: {
        streetName,
        streetNumber,
        city: addr.city,
        provinceCode: addr.province_code,
        postalCode: addr.zip ?? '',
      },
      dimensions,
      declaredValue: declaredValue ?? order.total_amount,
    });

    // Fetch the real tracking number from MiCorreo (shippingId = extOrderId = orderId)
    let trackingNumber: string | null = null;
    try {
      const trackingResults = await MiCorreoService.getTracking(String(orderId));
      const first = Array.isArray(trackingResults) ? trackingResults[0] : null;
      trackingNumber = first?.trackingNumber ?? null;
    } catch {
      // Tracking may not be available immediately after import; will be fetched later
    }

    // Persist import result back to the order
    await pool.execute(
      `UPDATE orders
       SET mc_shipping_id = ?,
           mc_tracking_number = ?,
           mc_imported_at = NOW(),
           shipping_status = 'shipped'
       WHERE id = ?`,
      [String(orderId), trackingNumber, orderId]
    );

    return new Response(JSON.stringify({ success: true, trackingNumber }), { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/shipping/import]', error);
    return new Response(
      JSON.stringify({ error: error.message ?? 'Could not import shipment to MiCorreo' }),
      { status: 502 }
    );
  }
};
