import type { APIRoute } from 'astro';
import pool from '@/utils/db';

export const GET: APIRoute = async () => {
  try {
    const [rows] = await pool.execute(`
      SELECT sc.province_id, sc.cost, p.name as province_name
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
    return new Response(JSON.stringify({ error: 'Error al obtener costos de envío' }), { status: 500 });
  }
};
