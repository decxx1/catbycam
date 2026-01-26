import type { APIRoute } from 'astro';
import { getSession } from '@/utils/auth';
import { UserService } from '@/services/userService';
import { PaymentService } from '@/services/paymentService';

export const GET: APIRoute = async ({ cookies, url }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const page = Number(url.searchParams.get('page')) || 1;

  try {
    const orders = await PaymentService.getAllOrders(page, 10);
    return new Response(JSON.stringify(orders), { status: 200 });
  } catch (error) {
    console.error('Admin Orders API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch orders' }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

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

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  try {
    const { id } = await request.json();
    await PaymentService.deleteOrder(Number(id));
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
