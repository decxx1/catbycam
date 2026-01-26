import type { APIRoute } from 'astro';
import { NotificationService } from '@/services/notificationService';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'unread') {
      const notifications = await NotificationService.getUnread();
      const count = await NotificationService.getUnreadCount();
      return new Response(JSON.stringify({ notifications, count }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'count') {
      const count = await NotificationService.getUnreadCount();
      return new Response(JSON.stringify({ count }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const result = await NotificationService.getAll(page, limit);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener notificaciones' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, id } = body;

    if (action === 'mark_read' && id) {
      await NotificationService.markAsRead(id);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'mark_all_read') {
      await NotificationService.markAllAsRead();
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'delete' && id) {
      await NotificationService.delete(id);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Acción no válida' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing notification action:', error);
    return new Response(JSON.stringify({ error: 'Error al procesar la acción' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
