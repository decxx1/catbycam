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
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  },

  async updateUser(id: number | string, { name, email, role }: Partial<User>) {
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
      [name, email, role, id]
    );
  }
};
