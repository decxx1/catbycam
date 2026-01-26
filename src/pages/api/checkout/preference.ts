import type { APIRoute } from 'astro';
import { getSession } from '@/utils/auth';
import { PaymentService } from '@/services/paymentService';
import { UserService } from '@/services/userService';

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) return new Response('Unauthorized', { status: 401 });

  try {
    const { items, total, shippingAddress, phone, comments } = await request.json();

    // 0. Get user info for payer details
    const user = await UserService.findById(session.userId);

    // 1. Create or Update existing pending order in DB
    const orderId = await PaymentService.createOrUpdateOrder(
      session.userId,
      total,
      shippingAddress,
      items,
      phone,
      comments
    );

    // 2. Generate preference
    const preferenceId = await PaymentService.generatePreference(
      orderId, 
      session.userId, 
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
