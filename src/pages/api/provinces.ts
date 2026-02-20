import type { APIRoute } from 'astro';
import pool from '@/utils/db';

export const GET: APIRoute = async () => {
  try {
    const [rows] = await pool.execute('SELECT id, name FROM provinces ORDER BY name ASC');
    return new Response(JSON.stringify(rows), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener provincias' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
