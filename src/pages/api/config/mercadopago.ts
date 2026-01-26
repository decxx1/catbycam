import type { APIRoute } from 'astro';
import { getPublicKey } from '@/utils/mercadopago';

export const GET: APIRoute = async () => {
  try {
    const publicKey = await getPublicKey();
    
    return new Response(JSON.stringify({ 
      publicKey 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching MP public key:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al obtener configuración',
      publicKey: ''
    }), { status: 500 });
  }
};
