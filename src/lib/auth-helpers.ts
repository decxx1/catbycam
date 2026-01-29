import { auth } from './auth';

export async function requireAdmin(request: Request): Promise<{ user: any } | Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const user = session.user as any;
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  return { user };
}

export async function requireAuth(request: Request): Promise<{ user: any; session: any } | Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  return { user: session.user, session };
}
