import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-helpers';
import { ProductService } from '@/services/productService';

export const POST: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const { percentage, categoryId } = await request.json();

    if (typeof percentage !== 'number' || percentage === 0) {
      return new Response(JSON.stringify({ error: 'Porcentaje inválido' }), { status: 400 });
    }

    const affected = await ProductService.bulkUpdatePrices(percentage, categoryId || undefined);

    return new Response(JSON.stringify({ 
      success: true, 
      affected,
      message: `Se actualizaron ${affected} productos` 
    }), { status: 200 });
  } catch (error: any) {
    console.error('Bulk price update error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error al actualizar precios' }), { status: 500 });
  }
};
