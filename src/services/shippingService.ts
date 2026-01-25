import pool from '@/utils/db';

export interface ShippingAddress {
  id?: number;
  user_id: number;
  address: string;
  city: string;
  state: string;
  zip?: string;
  phone: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const ShippingService = {
  async getByUserId(userId: number): Promise<ShippingAddress[]> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM shipping_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return rows;
  },

  async getDefaultByUserId(userId: number): Promise<ShippingAddress | undefined> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM shipping_addresses WHERE user_id = ? AND is_default = TRUE LIMIT 1',
      [userId]
    );
    return rows[0];
  },

  async create(address: ShippingAddress) {
    // If setting as default, unset others first
    if (address.is_default) {
      await pool.execute('UPDATE shipping_addresses SET is_default = FALSE WHERE user_id = ?', [address.user_id]);
    }

    const [result] = await pool.execute(
      'INSERT INTO shipping_addresses (user_id, address, city, state, zip, phone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [address.user_id, address.address, address.city, address.state, address.zip || '', address.phone, address.is_default ? 1 : 0]
    );
    return result;
  },

  async update(id: number, address: Partial<ShippingAddress>) {
    if (address.is_default && address.user_id) {
        await pool.execute('UPDATE shipping_addresses SET is_default = FALSE WHERE user_id = ?', [address.user_id]);
    }

    const fields = [];
    const values = [];
    
    if (address.address !== undefined) { fields.push('address = ?'); values.push(address.address); }
    if (address.city !== undefined) { fields.push('city = ?'); values.push(address.city); }
    if (address.state !== undefined) { fields.push('state = ?'); values.push(address.state); }
    if (address.zip !== undefined) { fields.push('zip = ?'); values.push(address.zip); }
    if (address.phone !== undefined) { fields.push('phone = ?'); values.push(address.phone); }
    if (address.is_default !== undefined) { fields.push('is_default = ?'); values.push(address.is_default ? 1 : 0); }

    if (fields.length === 0) return;

    values.push(id);
    await pool.execute(
      `UPDATE shipping_addresses SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(id: number) {
    await pool.execute('DELETE FROM shipping_addresses WHERE id = ?', [id]);
  }
};
