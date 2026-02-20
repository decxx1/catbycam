import pool from '@/utils/db';
import { createPreference } from '@/utils/mercadopago';

export interface Order {
  id?: number;
  user_id: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  shipping_address: string;
  phone?: string;
  comments?: string;
  shipping_type?: 'pickup' | 'delivery';
  shipping_cost?: number;
  shipping_status?: 'processing' | 'shipped' | 'delivered';
  tracking_number?: string;
  payment_id?: string;
  preference_id?: string;
  external_reference?: string;
  created_at?: string;
}

export interface OrderItem {
  product_id: number;
  title: string;
  price: number;
  quantity: number;
}

export const PaymentService = {
  async getLatestPendingOrder(userId: number) {
    const [rows]: any = await pool.execute(
      'SELECT * FROM orders WHERE user_id = ? AND status = "pending" ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    if (rows.length === 0) return null;
    
    const [items]: any = await pool.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [rows[0].id]
    );
    rows[0].items = items;
    return rows[0];
  },

  async createOrUpdateOrder(userId: number, total: number, shippingAddress: string, items: OrderItem[], phone?: string, comments?: string, shippingType: 'pickup' | 'delivery' = 'delivery', shippingCost: number = 0) {
    const existingOrder = await this.getLatestPendingOrder(userId);
    
    // Check if we can reuse the existing pending order
    // We check if it has the same total and same items (simplified check)
    if (existingOrder && !existingOrder.payment_id) {
       // If same total and same amount of items, we might reuse it. 
       // For safety, if items are exactly the same, reuse. 
       // If not, we update the existing order instead of creating a new one.
       const conn = await pool.getConnection();
       try {
         await conn.beginTransaction();
         await conn.execute(
           'UPDATE orders SET total_amount = ?, shipping_address = ?, phone = ?, comments = ?, shipping_type = ?, shipping_cost = ?, preference_id = NULL, external_reference = ? WHERE id = ?',
           [total, shippingAddress, phone || null, comments || null, shippingType, shippingCost, `ORDER_${userId}_${Date.now()}`, existingOrder.id]
         );
         await conn.execute('DELETE FROM order_items WHERE order_id = ?', [existingOrder.id]);
         for (const item of items) {
           await conn.execute(
             'INSERT INTO order_items (order_id, product_id, title, price, quantity) VALUES (?, ?, ?, ?, ?)',
             [existingOrder.id, item.product_id, item.title, item.price, item.quantity]
           );
         }
         await conn.commit();
         return existingOrder.id;
       } catch (error) {
         await conn.rollback();
         throw error;
       } finally {
         conn.release();
       }
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Create order
      const [orderResult]: any = await conn.execute(
        'INSERT INTO orders (user_id, total_amount, status, shipping_address, phone, comments, shipping_type, shipping_cost, external_reference) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, total, 'pending', shippingAddress, phone || null, comments || null, shippingType, shippingCost, `ORDER_${userId}_${Date.now()}`]
      );
      const orderId = orderResult.insertId;

      // 2. Add items
      for (const item of items) {
        await conn.execute(
          'INSERT INTO order_items (order_id, product_id, title, price, quantity) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.product_id, item.title, item.price, item.quantity]
        );
      }

      await conn.commit();
      return orderId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async deleteOrder(orderId: number, userId?: number) {
    // Basic security and business logic
    const query = userId 
        ? 'SELECT * FROM orders WHERE id = ? AND user_id = ?' 
        : 'SELECT * FROM orders WHERE id = ?';
    const params = userId ? [orderId, userId] : [orderId];
    
    const [rows]: any = await pool.execute(query, params);
    if (rows.length === 0) throw new Error('Order not found');
    
    const order = rows[0];
    
    // Rule: Cannot delete if paid or if it has a payment_id (waiting for approval)
    if (order.status !== 'pending' && order.status !== 'cancelled') {
        throw new Error('No se pueden eliminar pedidos pagados');
    }
    
    if (order.payment_id) {
        throw new Error('No se pueden eliminar pedidos con pago en proceso');
    }

    await pool.execute('DELETE FROM orders WHERE id = ?', [orderId]);
    return true;
  },

  async generatePreference(orderId: number, userId: number, items: OrderItem[], userEmail?: string, shippingCost: number = 0) {
    const externalReference = `ORDER_${orderId}`;

    const webhookUrl = import.meta.env.WEBHOOK_DOMAIN || import.meta.env.PUBLIC_SITE_URL;
    const notification_url = webhookUrl && webhookUrl.startsWith('http') 
        ? `${webhookUrl}/api/webhooks` 
        : undefined;

    // Build items array with products
    const preferenceItems = items.map(item => ({
        id: String(item.product_id),
        title: item.title,
        unit_price: Number(item.price),
        quantity: Number(item.quantity),
        currency_id: 'ARS'
    }));

    // Add shipping cost as a separate item if > 0
    if (shippingCost > 0) {
      preferenceItems.push({
        id: 'shipping',
        title: 'Costo de envío',
        unit_price: Number(shippingCost),
        quantity: 1,
        currency_id: 'ARS'
      });
    }

    const preferenceBody = {
        body: {
            items: preferenceItems,
            payer: userEmail ? { email: userEmail } : undefined,
            external_reference: externalReference,
            back_urls: {
                success: `${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/profile?payment=success`,
                failure: `${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/profile?payment=failure`,
                pending: `${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/profile?payment=pending`
            },
            auto_return: 'approved',
            notification_url: notification_url
        }
    };
    
    try {
        const preference = await createPreference(preferenceBody);

        // Update order with preference ID
        await pool.execute('UPDATE orders SET preference_id = ?, external_reference = ? WHERE id = ?', [
            preference.id,
            externalReference,
            orderId
        ]);

        return preference.id;
    } catch (mpError: any) {
        console.error('Mercado Pago API Error Details:', {
            status: mpError.status,
            message: mpError.message,
            cause: mpError.cause,
            code: mpError.code
        });
        throw mpError;
    }
  },

  async updateOrderStatusByExternalReference(extRef: string, paymentId: string, status: Order['status']) {
    await pool.execute(
        'UPDATE orders SET status = ?, payment_id = ? WHERE external_reference = ?',
        [status, paymentId, extRef]
    );
  },

  async getOrderItemsByExternalReference(extRef: string): Promise<OrderItem[]> {
    const [orders]: any = await pool.execute(
      'SELECT id FROM orders WHERE external_reference = ?',
      [extRef]
    );
    if (orders.length === 0) return [];
    
    const [items]: any = await pool.execute(
      'SELECT product_id, title, price, quantity FROM order_items WHERE order_id = ?',
      [orders[0].id]
    );
    return items;
  },

  async getOrdersByUserId(userId: number, page: number = 1, limit: number = 5) {
    const offset = (page - 1) * limit;
    const [rows]: any = await pool.execute(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [userId]
    );
    
    // Add items to each order
    for (const order of rows) {
      const [items]: any = await pool.execute(
        'SELECT * FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.items = items;
    }

    const [countResult]: any = await pool.execute(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
      [userId]
    );

    return {
      data: rows,
      total: countResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  },

  async getAllOrders(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const [rows]: any = await pool.execute(`
      SELECT o.*, u.name as user_name, u.email as user_email 
      FROM orders o 
      JOIN user u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `);
    
    for (const order of rows) {
      const [items]: any = await pool.execute(
        'SELECT * FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.items = items;
    }

    const [countResult]: any = await pool.execute('SELECT COUNT(*) as total FROM orders');

    return {
      data: rows,
      total: countResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  },

  async updateShippingStatus(orderId: number, shippingStatus: Order['shipping_status'], trackingNumber?: string) {
    if (trackingNumber) {
      await pool.execute(
        'UPDATE orders SET shipping_status = ?, tracking_number = ? WHERE id = ?',
        [shippingStatus, trackingNumber, orderId]
      );
    } else {
      await pool.execute(
        'UPDATE orders SET shipping_status = ? WHERE id = ?',
        [shippingStatus, orderId]
      );
    }
  },

  async getOrderById(orderId: number) {
    const [rows]: any = await pool.execute(
      'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN user u ON o.user_id = u.id WHERE o.id = ?',
      [orderId]
    );
    if (rows.length === 0) return null;
    
    const [items]: any = await pool.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );
    rows[0].items = items;
    return rows[0];
  }
};
