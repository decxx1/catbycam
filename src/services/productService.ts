import pool from '@/utils/db';

export interface Product {
  id?: number;
  title: string;
  description: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  item_condition: 'new' | 'used' | 'not_specified';
  category_id: number | null;
  main_image: string;
  images?: string[]; // Extra images
  created_at?: string;
  updated_at?: string;
  category_name?: string;
}

export const ProductService = {
  async getAll({ page = 1, limit = 10, search = '', categoryId = '' }): Promise<{ products: Product[], total: number }> {
    const offset = (page - 1) * limit;
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (p.title LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (categoryId) {
      query += ` AND p.category_id = ?`;
      params.push(categoryId);
    }

    const [totalRows]: any = await pool.execute(`SELECT COUNT(*) as count FROM (${query}) as t`, params);
    
    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(String(limit), String(offset));

    const [rows]: any = await pool.execute(query, params);
    
    // Fetch extra images for each product
    for (const product of rows) {
      const [imgs]: any = await pool.execute('SELECT url FROM product_images WHERE product_id = ? ORDER BY position ASC', [product.id]);
      product.images = imgs.map((i: any) => i.url);
    }

    return { products: rows, total: totalRows[0].count };
  },

  async create(data: Product): Promise<number> {
    const [result]: any = await pool.execute(
      `INSERT INTO products (title, description, price, stock, status, item_condition, category_id, main_image) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.description, data.price, data.stock, data.status, data.item_condition, data.category_id, data.main_image]
    );

    const productId = result.insertId;

    if (data.images && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        await pool.execute(
          'INSERT INTO product_images (product_id, url, position) VALUES (?, ?, ?)',
          [productId, data.images[i], i]
        );
      }
    }

    return productId;
  },

  async update(id: number | string, data: Product) {
    await pool.execute(
      `UPDATE products 
       SET title = ?, description = ?, price = ?, stock = ?, status = ?, item_condition = ?, category_id = ?, main_image = ?
       WHERE id = ?`,
      [data.title, data.description, data.price, data.stock, data.status, data.item_condition, data.category_id, data.main_image, id]
    );

    // Update images: simplest way is delete and re-insert
    await pool.execute('DELETE FROM product_images WHERE product_id = ?', [id]);
    if (data.images && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        await pool.execute(
          'INSERT INTO product_images (product_id, url, position) VALUES (?, ?, ?)',
          [id, data.images[i], i]
        );
      }
    }
  },

  async delete(id: number | string) {
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  }
};
