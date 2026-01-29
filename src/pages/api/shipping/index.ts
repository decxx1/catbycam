import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/auth-helpers';
import { ShippingService } from '@/services/shippingService';

export const GET: APIRoute = async ({ request }) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user: sessionUser } = authResult;

  const data = await ShippingService.getByUserId(sessionUser.id);
  return new Response(JSON.stringify(data), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user: sessionUser } = authResult;

  const addressData = await request.json();
  const result = await ShippingService.create({ ...addressData, user_id: sessionUser.id });
  return new Response(JSON.stringify(result), { status: 201 });
};

export const PUT: APIRoute = async ({ request }) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user: sessionUser } = authResult;

  const { id, ...data } = await request.json();
  await ShippingService.update(id, { ...data, user_id: sessionUser.id });
  return new Response(null, { status: 204 });
};

export const DELETE: APIRoute = async ({ request }) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const { id } = await request.json();
  // Optional: Verify ownership before delete?
  // const address = await ShippingService.findById(id);
  // if (address.user_id !== session.userId) return new Response('Forbidden', { status: 403 });
  
  await ShippingService.delete(id);
  return new Response(null, { status: 204 });
};
