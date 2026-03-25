import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-helpers';
import { MiCorreoService } from '@/services/miCorreoService';

export const GET: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const result = await MiCorreoService.validateUser();
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/shipping/validate]', error);
    return new Response(
      JSON.stringify({ error: error.message ?? 'Could not validate MiCorreo user' }),
      { status: 502 }
    );
  }
};
