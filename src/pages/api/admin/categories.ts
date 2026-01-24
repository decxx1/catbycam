import type { APIRoute } from 'astro';
import { getSession } from '@/utils/auth';
import { UserService } from '@/services/userService';
import { CategoryService } from '@/services/categoryService';

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const categories = await CategoryService.getAll();
  return new Response(JSON.stringify(categories), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const { name } = await request.json();
  const id = await CategoryService.create(name);
  return new Response(JSON.stringify({ id }), { status: 201 });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const { id } = await request.json();
  await CategoryService.delete(id);
  return new Response(null, { status: 204 });
};
