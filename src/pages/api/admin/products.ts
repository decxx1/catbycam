import type { APIRoute } from 'astro';
import { getSession } from '@/utils/auth';
import { UserService } from '@/services/userService';
import { ProductService } from '@/services/productService';

export const GET: APIRoute = async ({ url, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const page = Number(url.searchParams.get('page') || 1);
  const limit = Number(url.searchParams.get('limit') || 10);
  const search = url.searchParams.get('search') || '';
  const categoryId = url.searchParams.get('categoryId') || '';

  const data = await ProductService.getAll({ page, limit, search, categoryId });
  return new Response(JSON.stringify(data), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const productData = await request.json();
  const id = await ProductService.create(productData);
  return new Response(JSON.stringify({ id }), { status: 201 });
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const { id, ...data } = await request.json();
  await ProductService.update(id, data);
  return new Response(null, { status: 204 });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const { id } = await request.json();
  await ProductService.delete(id);
  return new Response(null, { status: 204 });
};
