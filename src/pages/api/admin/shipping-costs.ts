import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-helpers';
import pool from '@/utils/db';

export const GET: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const [rows] = await pool.execute(`
      SELECT sc.id, sc.province_id, sc.cost, p.name as province_name
      FROM shipping_costs sc
      JOIN provinces p ON sc.province_id = p.id
      ORDER BY p.name ASC
    `);
    return new Response(JSON.stringify(rows), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching shipping costs:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener costos' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  try {
    const { costs } = await request.json();
    
    if (!Array.isArray(costs)) {
      return new Response(JSON.stringify({ error: 'Formato inválido' }), { status: 400 });
    }

    for (const item of costs) {
      if (item.province_id && item.cost !== undefined) {
        await pool.execute(
          `INSERT INTO shipping_costs (province_id, cost) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE cost = VALUES(cost)`,
          [item.province_id, item.cost]
        );
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error saving shipping costs:', error);
    return new Response(JSON.stringify({ error: 'Error al guardar costos' }), { status: 500 });
  }
};
