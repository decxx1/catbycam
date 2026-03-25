import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-helpers';
import { MiCorreoService } from '@/services/miCorreoService';
import type { RegisterUserData } from '@/services/miCorreoService';

export const POST: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  let body: RegisterUserData;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { firstName, lastName, email, password, documentType, documentId } = body;
  if (!firstName || !lastName || !email || !password || !documentType || !documentId) {
    return new Response(
      JSON.stringify({ error: 'firstName, lastName, email, password, documentType and documentId are required' }),
      { status: 400 }
    );
  }

  try {
    const result = await MiCorreoService.registerUser(body);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: any) {
    console.error('[API /api/admin/shipping/register]', error);
    return new Response(
      JSON.stringify({ error: error.message ?? 'Could not register MiCorreo user' }),
      { status: 502 }
    );
  }
};
