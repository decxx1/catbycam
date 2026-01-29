import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/auth-helpers';
import { UserService } from '@/services/userService';

export const PATCH: APIRoute = async ({ request }) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user: sessionUser } = authResult;

  try {
    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return new Response(JSON.stringify({ error: 'Todos los campos son requeridos' }), { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return new Response(JSON.stringify({ error: 'Las contraseñas nuevas no coinciden' }), { status: 400 });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }), { status: 400 });
    }

    const result = await UserService.changePassword(sessionUser.id, currentPassword, newPassword);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), { status: 400 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Contraseña actualizada correctamente' 
    }), { status: 200 });
  } catch (error: any) {
    console.error('Password change error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error al cambiar contraseña' }), { status: 500 });
  }
};
