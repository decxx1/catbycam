import pool from '@/utils/db';

export interface ProductImage {
  url: string;
  urlFull?: string;
  width?: number;
  height?: number;
}

export interface Product {
  id?: number;
  title: string;
  description: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock' | 'paused';
  item_condition: 'new' | 'used' | 'not_specified';
  category_id: number | null;
  main_image: string;
  main_image_full?: string;
  main_image_width?: number;
  main_image_height?: number;
  images?: ProductImage[]; // Extra images con thumbnail, full y dimensiones
  created_at?: string;
  updated_at?: string;
  category_name?: string;
}

// Helper to convert DB row to proper Product type
const normalizeProduct = (row: any): Product => ({
  ...row,
  price: Number(row.price),
  stock: Number(row.stock),
  category_id: row.category_id ? Number(row.category_id) : null
});

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
    
    query += ` ORDER BY p.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows]: any = await pool.execute(query, params);
    
    // Fetch extra images for each product
    const products: Product[] = [];
    for (const row of rows) {
      const [imgs]: any = await pool.execute('SELECT url, url_full, width, height FROM product_images WHERE product_id = ? ORDER BY position ASC', [row.id]);
      products.push({
        ...normalizeProduct(row),
        images: imgs.map((i: any) => ({
          url: i.url,
          urlFull: i.url_full,
          width: i.width,
          height: i.height
        }))
      });
    }

    return { products, total: totalRows[0].count };
  },

  async create(data: Product): Promise<number> {
    // Si stock es 0, forzar estado a out_of_stock
    const status = data.stock <= 0 ? 'out_of_stock' : data.status;
    
    const [result]: any = await pool.execute(
      `INSERT INTO products (title, description, price, stock, status, item_condition, category_id, main_image, main_image_full, main_image_width, main_image_height) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.description, data.price, data.stock, status, data.item_condition, data.category_id, data.main_image, data.main_image_full || null, data.main_image_width || 0, data.main_image_height || 0]
    );

    const productId = result.insertId;

    if (data.images && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i];
        await pool.execute(
          'INSERT INTO product_images (product_id, url, url_full, width, height, position) VALUES (?, ?, ?, ?, ?, ?)',
          [productId, img.url, img.urlFull || null, img.width || 0, img.height || 0, i]
        );
      }
    }

    return productId;
  },

  async update(id: number | string, data: Product) {
    // Si stock es 0, forzar estado a out_of_stock
    const status = data.stock <= 0 ? 'out_of_stock' : data.status;
    
    await pool.execute(
      `UPDATE products 
       SET title = ?, description = ?, price = ?, stock = ?, status = ?, item_condition = ?, category_id = ?, main_image = ?, main_image_full = ?, main_image_width = ?, main_image_height = ?
       WHERE id = ?`,
      [data.title, data.description, data.price, data.stock, status, data.item_condition, data.category_id, data.main_image, data.main_image_full || null, data.main_image_width || 0, data.main_image_height || 0, id]
    );

    // Update images: simplest way is delete and re-insert
    await pool.execute('DELETE FROM product_images WHERE product_id = ?', [id]);
    if (data.images && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i];
        await pool.execute(
          'INSERT INTO product_images (product_id, url, url_full, width, height, position) VALUES (?, ?, ?, ?, ?, ?)',
          [id, img.url, img.urlFull || null, img.width || 0, img.height || 0, i]
        );
      }
    }
  },

  async delete(id: number | string) {
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  },

  async updateImages(
    id: number | string, 
    mainImage: { url: string; urlFull?: string; width?: number; height?: number }, 
    extraImages: ProductImage[]
  ) {
    await pool.execute(
      'UPDATE products SET main_image = ?, main_image_full = ?, main_image_width = ?, main_image_height = ? WHERE id = ?', 
      [mainImage.url, mainImage.urlFull || null, mainImage.width || 0, mainImage.height || 0, id]
    );
    
    await pool.execute('DELETE FROM product_images WHERE product_id = ?', [id]);
    if (extraImages && extraImages.length > 0) {
      for (let i = 0; i < extraImages.length; i++) {
        const img = extraImages[i];
        await pool.execute(
          'INSERT INTO product_images (product_id, url, url_full, width, height, position) VALUES (?, ?, ?, ?, ?, ?)',
          [id, img.url, img.urlFull || null, img.width || 0, img.height || 0, i]
        );
      }
    }
  },

  async findById(id: number | string): Promise<Product | null> {
    const [rows]: any = await pool.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) return null;

    const row = rows[0];
    const [imgs]: any = await pool.execute('SELECT url, url_full, width, height FROM product_images WHERE product_id = ? ORDER BY position ASC', [row.id]);

    return {
      ...normalizeProduct(row),
      images: imgs.map((i: any) => ({
        url: i.url,
        urlFull: i.url_full,
        width: i.width,
        height: i.height
      }))
    };
  },

  async bulkUpdatePrices(percentage: number, categoryId?: number | string): Promise<number> {
    const multiplier = 1 + (percentage / 100);
    let query = 'UPDATE products SET price = ROUND(price * ?, 2)';
    const params: any[] = [multiplier];

    if (categoryId) {
      query += ' WHERE category_id = ?';
      params.push(categoryId);
    }

    const [result]: any = await pool.execute(query, params);
    return result.affectedRows;
  },

  async quickUpdate(id: number | string, data: { title?: string; price?: number; stock?: number; status?: string; category_id?: number | null }) {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
    if (data.price !== undefined) { fields.push('price = ?'); params.push(data.price); }
    if (data.stock !== undefined) { 
      fields.push('stock = ?'); 
      params.push(data.stock);
      // Si stock es 0, forzar estado a out_of_stock
      if (data.stock <= 0) {
        fields.push('status = ?');
        params.push('out_of_stock');
      }
    }
    if (data.status !== undefined && data.stock === undefined) { fields.push('status = ?'); params.push(data.status); }
    if (data.category_id !== undefined) { fields.push('category_id = ?'); params.push(data.category_id); }

    if (fields.length === 0) return;

    params.push(id);
    await pool.execute(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);
  },

  async getAllSimple(): Promise<Pick<Product, 'id' | 'title' | 'price' | 'stock' | 'status' | 'category_id' | 'category_name'>[]> {
    const [rows]: any = await pool.execute(`
      SELECT p.id, p.title, p.price, p.stock, p.status, p.category_id, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.title ASC
    `);
    return rows.map(normalizeProduct);
  },

  async getFeatured(limit = 4): Promise<Product[]> {
    const [rows]: any = await pool.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT ${Number(limit)}
    `);

    const products: Product[] = [];
    for (const row of rows) {
      const [imgs]: any = await pool.execute('SELECT url, url_full, width, height FROM product_images WHERE product_id = ? ORDER BY position ASC', [row.id]);
      products.push({
        ...normalizeProduct(row),
        images: imgs.map((i: any) => ({
          url: i.url,
          urlFull: i.url_full,
          width: i.width,
          height: i.height
        }))
      });
    }

    return products;
  },

  async decreaseStock(productId: number, quantity: number): Promise<void> {
    // Descontar stock y cambiar estado a out_of_stock si llega a 0
    await pool.execute(
      `UPDATE products 
       SET stock = GREATEST(stock - ?, 0),
           status = CASE WHEN stock - ? <= 0 THEN 'out_of_stock' ELSE status END
       WHERE id = ?`,
      [quantity, quantity, productId]
    );
  },

  async decreaseStockBulk(items: { productId: number; quantity: number }[]): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const item of items) {
        await conn.execute(
          `UPDATE products 
           SET stock = GREATEST(stock - ?, 0),
               status = CASE WHEN stock - ? <= 0 THEN 'out_of_stock' ELSE status END
           WHERE id = ?`,
          [item.quantity, item.quantity, item.productId]
        );
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
};
