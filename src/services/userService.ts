import pool from '@/utils/db';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  created_at: string;
}

export const UserService = {
  async register({ name, email, password }: Partial<User>) {
    const hashedPassword = await bcrypt.hash(password!, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    return result as any;
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const [rows]: any = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  async findById(id: number | string): Promise<User | undefined> {
    const [rows]: any = await pool.execute('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password!);
  },

  async getAllUsers(): Promise<User[]> {
    const [rows]: any = await pool.execute('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    return rows;
  },

  async deleteUser(id: number | string) {
    // Eliminar order_items de los pedidos del usuario primero (por FK)
    await pool.execute(
      'DELETE oi FROM order_items oi INNER JOIN orders o ON oi.order_id = o.id WHERE o.user_id = ?',
      [id]
    );
    // Eliminar pedidos del usuario
    await pool.execute('DELETE FROM orders WHERE user_id = ?', [id]);
    // Eliminar direcciones de envío del usuario
    await pool.execute('DELETE FROM shipping_addresses WHERE user_id = ?', [id]);
    // Finalmente eliminar el usuario
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  },

  async updateUser(id: number | string, { name, email, role }: Partial<User>) {
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
      [name, email, role, id]
    );
  },

  async updateProfile(id: number | string, { name, email }: { name: string; email: string }) {
    await pool.execute(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, id]
    );
  },

  async emailExists(email: string, excludeUserId?: number | string): Promise<boolean> {
    const query = excludeUserId 
      ? 'SELECT id FROM users WHERE email = ? AND id != ?'
      : 'SELECT id FROM users WHERE email = ?';
    const params = excludeUserId ? [email, excludeUserId] : [email];
    const [rows]: any = await pool.execute(query, params);
    return rows.length > 0;
  },

  async changePassword(userId: number | string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const [rows]: any = await pool.execute('SELECT password FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const isValid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isValid) {
      return { success: false, error: 'La contraseña actual es incorrecta' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    return { success: true };
  }
};
