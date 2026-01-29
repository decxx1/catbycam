import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/auth-helpers';
import { PaymentService } from '@/services/paymentService';

export const GET: APIRoute = async ({ request, url }) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user: sessionUser } = authResult;

  const page = Number(url.searchParams.get('page')) || 1;

  try {
    const response = await PaymentService.getOrdersByUserId(sessionUser.id, page, 5);
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    console.error('User Orders API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch your orders' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user: sessionUser } = authResult;

  try {
    const { id } = await request.json();
    await PaymentService.deleteOrder(Number(id), sessionUser.id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
