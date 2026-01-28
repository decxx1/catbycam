import type { AstroCookies } from 'astro';
import { getSession } from '@/utils/auth';
import { UserService, type User } from '@/services/userService';

export async function requireAdmin(cookies: AstroCookies): Promise<{ user: User } | { redirect: string }> {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;

  if (!session) {
    if (token) {
      cookies.delete('auth_token', { path: '/' });
    }
    return { redirect: '/admin/login' };
  }

  const user = await UserService.findById(session.userId);

  if (!user || user.role !== 'admin') {
    cookies.delete('auth_token', { path: '/' });
    return { redirect: '/' };
  }

  return { user };
}
