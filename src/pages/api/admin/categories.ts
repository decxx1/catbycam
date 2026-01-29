import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-helpers';
import { CategoryService } from '@/services/categoryService';

export const GET: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const categories = await CategoryService.getAll();
  return new Response(JSON.stringify(categories), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const { name } = await request.json();
  const id = await CategoryService.create(name);
  return new Response(JSON.stringify({ id }), { status: 201 });
};

export const PUT: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const { id, name } = await request.json();
  await CategoryService.update(id, name);
  return new Response(null, { status: 200 });
};

export const DELETE: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const { id } = await request.json();
  await CategoryService.delete(id);
  return new Response(null, { status: 204 });
};
