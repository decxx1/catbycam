import pool from '@/utils/db';

export interface AdminNotification {
  id?: number;
  type: 'payment_approved' | 'new_order' | 'low_stock' | 'system';
  title: string;
  message: string;
  data?: string; // JSON string for extra data like order_id, payment_id, etc.
  is_read: boolean;
  created_at?: string;
}

export const NotificationService = {
  async createTable() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('payment_approved', 'new_order', 'low_stock', 'system') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSON,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  async create(notification: Omit<AdminNotification, 'id' | 'is_read' | 'created_at'>) {
    const [result]: any = await pool.execute(
      'INSERT INTO admin_notifications (type, title, message, data) VALUES (?, ?, ?, ?)',
      [notification.type, notification.title, notification.message, notification.data || null]
    );
    return result.insertId;
  },

  async getUnread(limit: number = 10) {
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));
    const [rows]: any = await pool.execute(
      `SELECT * FROM admin_notifications WHERE is_read = FALSE ORDER BY created_at DESC LIMIT ${safeLimit}`
    );
    return rows;
  },

  async getAll(page: number = 1, limit: number = 20) {
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const safeOffset = Math.max(0, (Number(page) - 1) * safeLimit);
    const [rows]: any = await pool.execute(
      `SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );

    const [countResult]: any = await pool.execute(
      'SELECT COUNT(*) as total FROM admin_notifications'
    );

    return {
      data: rows,
      total: countResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  },

  async markAsRead(id: number) {
    await pool.execute('UPDATE admin_notifications SET is_read = TRUE WHERE id = ?', [id]);
  },

  async markAllAsRead() {
    await pool.execute('UPDATE admin_notifications SET is_read = TRUE WHERE is_read = FALSE');
  },

  async getUnreadCount() {
    const [rows]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM admin_notifications WHERE is_read = FALSE'
    );
    return rows[0].count;
  },

  async delete(id: number) {
    await pool.execute('DELETE FROM admin_notifications WHERE id = ?', [id]);
  }
};
