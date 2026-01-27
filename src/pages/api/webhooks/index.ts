import type { APIRoute } from 'astro';
import { PaymentService } from '@/services/paymentService';
import { NotificationService } from '@/services/notificationService';
import { ProductService } from '@/services/productService';
import { getAccessTokenForWebhook } from '@/utils/mercadopago';

// Allow GET for diagnostics/testing
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ 
    status: 'Webhook endpoint is active',
    timestamp: new Date().toISOString()
  }), { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const POST: APIRoute = async ({ request }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();

    if (body.type === 'payment' || body.action?.includes('payment')) {
        const paymentId = body.data?.id || body.resource?.split('/').pop();
        
        if (!paymentId) {
            return new Response(JSON.stringify({ error: 'No payment ID found' }), { 
              status: 400,
              headers: corsHeaders
            });
        }

        const accessToken = await getAccessTokenForWebhook();
        const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (res.ok) {
            const paymentData = await res.json();
            const status = paymentData.status;
            const externalReference = paymentData.external_reference;

            if (externalReference) {
                let orderStatus: 'pending' | 'paid' | 'cancelled' = 'pending';
                if (status === 'approved') orderStatus = 'paid';
                if (status === 'rejected' || status === 'cancelled') orderStatus = 'cancelled';

                await PaymentService.updateOrderStatusByExternalReference(
                    externalReference, 
                    String(paymentId), 
                    orderStatus
                );

                // Si el pago fue aprobado: descontar stock y crear notificación
                if (status === 'approved') {
                    // Descontar stock de los productos
                    const orderItems = await PaymentService.getOrderItemsByExternalReference(externalReference);
                    if (orderItems.length > 0) {
                        await ProductService.decreaseStockBulk(
                            orderItems.map(item => ({
                                productId: item.product_id,
                                quantity: item.quantity
                            }))
                        );
                    }

                    // Crear notificación para administradores
                    const amount = paymentData.transaction_amount || 0;
                    const payerEmail = paymentData.payer?.email || 'Cliente';
                    
                    await NotificationService.create({
                        type: 'payment_approved',
                        title: '¡Nuevo pago aprobado!',
                        message: `Se recibió un pago de $${amount.toLocaleString('es-AR')} de ${payerEmail}`,
                        data: JSON.stringify({
                            order_reference: externalReference,
                            payment_id: paymentId,
                            amount: amount,
                            payer_email: payerEmail
                        })
                    });
                }
            }
        }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook handling failed' }), { 
      status: 500,
      headers: corsHeaders
    });
  }
};

// Handle preflight CORS requests
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};
