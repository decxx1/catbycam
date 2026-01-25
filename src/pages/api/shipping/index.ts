import type { APIRoute } from 'astro';
import { getSession } from '@/utils/auth';
import { ShippingService } from '@/services/shippingService';

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const data = await ShippingService.getByUserId(session.userId);
  return new Response(JSON.stringify(data), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const addressData = await request.json();
  const result = await ShippingService.create({ ...addressData, user_id: session.userId });
  return new Response(JSON.stringify(result), { status: 201 });
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { id, ...data } = await request.json();
  await ShippingService.update(id, { ...data, user_id: session.userId });
  return new Response(null, { status: 204 });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { id } = await request.json();
  // Optional: Verify ownership before delete?
  // const address = await ShippingService.findById(id);
  // if (address.user_id !== session.userId) return new Response('Forbidden', { status: 403 });
  
  await ShippingService.delete(id);
  return new Response(null, { status: 204 });
};
