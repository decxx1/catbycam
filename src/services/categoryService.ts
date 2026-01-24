import pool from '@/utils/db';

export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at?: string;
}

export const CategoryService = {
  async getAll(): Promise<Category[]> {
    const [rows]: any = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return rows;
  },

  async create(name: string): Promise<number> {
    const slug = name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
      
    const [result]: any = await pool.execute(
      'INSERT INTO categories (name, slug) VALUES (?, ?)',
      [name, slug]
    );
    return result.insertId;
  },

  async delete(id: number | string) {
    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
  }
};
