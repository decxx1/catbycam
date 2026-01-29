import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/auth-helpers';
import { PaymentService } from '@/services/paymentService';
import { UserService } from '@/services/userService';

export const POST: APIRoute = async ({ request }) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user: sessionUser } = authResult;

  try {
    const { items, total, shippingAddress, phone, comments } = await request.json();

    // 0. Get user info for payer details
    const user = await UserService.findById(sessionUser.id);

    // 1. Create or Update existing pending order in DB
    const orderId = await PaymentService.createOrUpdateOrder(
      sessionUser.id,
      total,
      shippingAddress,
      items,
      phone,
      comments
    );

    // 2. Generate preference
    const preferenceId = await PaymentService.generatePreference(
      orderId, 
      sessionUser.id, 
      items, 
      user?.email
    );

    return new Response(JSON.stringify({ preferenceId }), { status: 201 });
  } catch (error: any) {
    console.error('Preference API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create preference',
      details: error.message
    }), { status: 500 });
  }
};
