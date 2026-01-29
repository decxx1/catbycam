import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/auth-helpers';
import { UserService } from '@/services/userService';

export const PATCH: APIRoute = async ({ request, cookies }) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user: sessionUser } = authResult;

  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Nombre y email son requeridos' }), { status: 400 });
    }

    // Get current user
    const currentUser = await UserService.findById(sessionUser.id);
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });
    }

    const emailChanged = currentUser.email !== email;

    // Check if email is already taken by another user
    if (emailChanged) {
      const emailTaken = await UserService.emailExists(email, sessionUser.id);
      if (emailTaken) {
        return new Response(JSON.stringify({ error: 'Este email ya está en uso' }), { status: 400 });
      }
    }

    // Update profile
    await UserService.updateProfile(sessionUser.id, { name, email });

    // If email changed, user needs to re-login
    if (emailChanged) {
      cookies.delete('auth_token', { path: '/' });
      cookies.delete('cb_logged_in', { path: '/' });
      return new Response(JSON.stringify({ 
        success: true, 
        emailChanged: true,
        message: 'Email actualizado. Por favor, inicia sesión nuevamente.' 
      }), { status: 200 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailChanged: false,
      message: 'Perfil actualizado correctamente' 
    }), { status: 200 });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error al actualizar perfil' }), { status: 500 });
  }
};
