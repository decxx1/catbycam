import type { APIRoute } from 'astro';
import { getSession } from '@/utils/auth';
import { UserService } from '@/services/userService';

export const PATCH: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Nombre y email son requeridos' }), { status: 400 });
    }

    // Get current user
    const currentUser = await UserService.findById(session.userId);
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });
    }

    const emailChanged = currentUser.email !== email;

    // Check if email is already taken by another user
    if (emailChanged) {
      const emailTaken = await UserService.emailExists(email, session.userId);
      if (emailTaken) {
        return new Response(JSON.stringify({ error: 'Este email ya está en uso' }), { status: 400 });
      }
    }

    // Update profile
    await UserService.updateProfile(session.userId, { name, email });

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
