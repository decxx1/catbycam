import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-helpers';
import { PaymentService } from '@/services/paymentService';

export const GET: APIRoute = async ({ request, url }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const page = Number(url.searchParams.get('page')) || 1;

  try {
    const orders = await PaymentService.getAllOrders(page, 10);
    return new Response(JSON.stringify(orders), { status: 200 });
  } catch (error) {
    console.error('Admin Orders API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch orders' }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const { id, shipping_status, tracking_number } = await request.json();
    
    if (!id || !shipping_status) {
      return new Response(JSON.stringify({ error: 'ID y estado de envío son requeridos' }), { status: 400 });
    }

    await PaymentService.updateShippingStatus(Number(id), shipping_status, tracking_number);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error('Error updating shipping status:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const { id } = await request.json();
    await PaymentService.deleteOrder(Number(id));
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
