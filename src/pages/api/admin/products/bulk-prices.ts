import type { APIRoute } from 'astro';
import { getSession } from '@/utils/auth';
import { UserService } from '@/services/userService';
import { ProductService } from '@/services/productService';

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  const user = await UserService.findById(session.userId);
  if (!user || user.role !== 'admin') return new Response('Forbidden', { status: 403 });

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
