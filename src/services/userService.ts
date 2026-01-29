import pool from '@/utils/db';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const UserService = {
  async register({ name, email, password }: { name: string; email: string; password: string }) {
    const { v4: uuidv4 } = await import('uuid');
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const now = new Date();
    
    await pool.execute(
      `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email, false, now, now, 'user']
    );
    
    const accountId = uuidv4();
    await pool.execute(
      `INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [accountId, userId, email, 'credential', hashedPassword, now, now]
    );
    
    return { insertId: userId };
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const [rows]: any = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);
    return rows[0];
  },

  async findById(id: string): Promise<User | undefined> {
    const [rows]: any = await pool.execute('SELECT id, name, email, role, createdAt, updatedAt FROM user WHERE id = ?', [id]);
    return rows[0];
  },

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const [rows]: any = await pool.execute(
      'SELECT password FROM account WHERE userId = ? AND providerId = ?',
      [userId, 'credential']
    );
    if (rows.length === 0) return false;
    return await bcrypt.compare(password, rows[0].password);
  },

  async getAllUsers(): Promise<User[]> {
    const [rows]: any = await pool.execute('SELECT id, name, email, role, createdAt, updatedAt FROM user ORDER BY createdAt DESC');
    return rows;
  },

  async deleteUser(id: string) {
    // Eliminar order_items de los pedidos del usuario primero (por FK)
    await pool.execute(
      'DELETE oi FROM order_items oi INNER JOIN orders o ON oi.order_id = o.id WHERE o.user_id = ?',
      [id]
    );
    // Eliminar pedidos del usuario
    await pool.execute('DELETE FROM orders WHERE user_id = ?', [id]);
    // Eliminar sesiones del usuario
    await pool.execute('DELETE FROM session WHERE userId = ?', [id]);
    // Eliminar cuentas del usuario
    await pool.execute('DELETE FROM account WHERE userId = ?', [id]);
    // Finalmente eliminar el usuario
    await pool.execute('DELETE FROM user WHERE id = ?', [id]);
  },

  async updateUser(id: string, { name, email, role }: Partial<User>) {
    const now = new Date();
    await pool.execute(
      'UPDATE user SET name = ?, email = ?, role = ?, updatedAt = ? WHERE id = ?',
      [name, email, role, now, id]
    );
  },

  async updateProfile(id: string, { name, email }: { name: string; email: string }) {
    const now = new Date();
    await pool.execute(
      'UPDATE user SET name = ?, email = ?, updatedAt = ? WHERE id = ?',
      [name, email, now, id]
    );
  },

  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const query = excludeUserId 
      ? 'SELECT id FROM user WHERE email = ? AND id != ?'
      : 'SELECT id FROM user WHERE email = ?';
    const params = excludeUserId ? [email, excludeUserId] : [email];
    const [rows]: any = await pool.execute(query, params);
    return rows.length > 0;
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const [rows]: any = await pool.execute(
      'SELECT password FROM account WHERE userId = ? AND providerId = ?',
      [userId, 'credential']
    );
    if (rows.length === 0) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const isValid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isValid) {
      return { success: false, error: 'La contraseña actual es incorrecta' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE account SET password = ?, updatedAt = ? WHERE userId = ? AND providerId = ?',
      [hashedPassword, new Date(), userId, 'credential']
    );
    return { success: true };
  }
};
