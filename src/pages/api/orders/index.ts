import type { APIRoute } from 'astro';
import { getSession } from '@/utils/auth';
import { PaymentService } from '@/services/paymentService';

export const GET: APIRoute = async ({ cookies, url }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const page = Number(url.searchParams.get('page')) || 1;

  try {
    const response = await PaymentService.getOrdersByUserId(session.userId, page, 5);
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    console.error('User Orders API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch your orders' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  try {
    const { id } = await request.json();
    await PaymentService.deleteOrder(Number(id), session.userId);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
