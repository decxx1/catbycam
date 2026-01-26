import type { APIRoute } from 'astro';
import { getSession } from '@/utils/auth';
import { UserService } from '@/services/userService';
import { ProductService } from '@/services/productService';

export const PATCH: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  try {
    const { id, ...data } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de producto requerido' }), { status: 400 });
    }

    await ProductService.quickUpdate(id, data);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error('Quick update error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error al actualizar' }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  try {
    const products = await ProductService.getAllSimple();
    return new Response(JSON.stringify(products), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
