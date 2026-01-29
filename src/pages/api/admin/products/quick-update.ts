import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-helpers';
import { ProductService } from '@/services/productService';

export const PATCH: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

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

export const GET: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const products = await ProductService.getAllSimple();
    return new Response(JSON.stringify(products), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
