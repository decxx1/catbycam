import type { APIRoute } from 'astro';
import { PaymentService } from '@/services/paymentService';
import { NotificationService } from '@/services/notificationService';
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
  // CORS headers for Mercado Pago
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();
    console.log('--- webhook call ---');
    console.log('Payload:', JSON.stringify(body, null, 2));

    // Mercado Pago webhooks send different types of notifications. 
    // We care about "payment" notifications.
    if (body.type === 'payment' || body.action?.includes('payment')) {
        const paymentId = body.data?.id || body.resource?.split('/').pop();
        
        if (!paymentId) {
            console.warn('Webhook: No payment ID found in payload');
            return new Response(JSON.stringify({ error: 'No payment ID found' }), { 
              status: 400,
              headers: corsHeaders
            });
        }

        console.log(`Webhook: Processing payment ${paymentId}...`);

        // Fetch actual payment details from MP to verify status
        const accessToken = await getAccessTokenForWebhook();
        const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (res.ok) {
            const paymentData = await res.json();
            const status = paymentData.status; // approved, rejected, pending, etc.
            const externalReference = paymentData.external_reference;

            if (externalReference) {
                let orderStatus: 'pending' | 'paid' | 'cancelled' = 'pending';
                if (status === 'approved') orderStatus = 'paid';
                if (status === 'rejected' || status === 'cancelled') orderStatus = 'cancelled';

                console.log(`Webhook: Updating order ${externalReference} to ${orderStatus} (Payment Status: ${status})`);
                await PaymentService.updateOrderStatusByExternalReference(
                    externalReference, 
                    String(paymentId), 
                    orderStatus
                );

                // Crear notificación para administradores cuando el pago es aprobado
                if (status === 'approved') {
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
                    console.log(`Webhook: Notification created for approved payment ${paymentId}`);
                }
            } else {
                console.warn(`Webhook: Payment ${paymentId} has no external_reference`);
            }
        } else {
            const errorText = await res.text();
            console.error(`Webhook: Failed to fetch payment details for ${paymentId}:`, errorText);
        }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Webhook: Unexpected error handling failed', error);
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
