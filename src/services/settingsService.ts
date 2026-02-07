import pool from '@/utils/db';

export interface Setting {
  id?: number;
  key: string;
  value: string;
  description?: string;
  is_encrypted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const SettingsService = {
  async createTable() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        \`key\` VARCHAR(100) NOT NULL UNIQUE,
        value TEXT,
        description VARCHAR(255),
        is_encrypted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  },

  async get(key: string): Promise<string | null> {
    const [rows]: any = await pool.execute(
      'SELECT value FROM settings WHERE `key` = ?',
      [key]
    );
    return rows.length > 0 ? rows[0].value : null;
  },

  async getMultiple(keys: string[]): Promise<Record<string, string | null>> {
    if (keys.length === 0) return {};
    
    const placeholders = keys.map(() => '?').join(',');
    const [rows]: any = await pool.execute(
      `SELECT \`key\`, value FROM settings WHERE \`key\` IN (${placeholders})`,
      keys
    );
    
    const result: Record<string, string | null> = {};
    for (const key of keys) {
      const found = rows.find((r: any) => r.key === key);
      result[key] = found ? found.value : null;
    }
    return result;
  },

  async getAll(): Promise<Setting[]> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM settings ORDER BY `key` ASC'
    );
    return rows;
  },

  async set(key: string, value: string, description?: string, isEncrypted: boolean = false): Promise<void> {
    await pool.execute(
      `INSERT INTO settings (\`key\`, value, description, is_encrypted) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value), description = COALESCE(VALUES(description), description)`,
      [key, value, description || null, isEncrypted]
    );
  },

  async setMultiple(settings: { key: string; value: string; description?: string }[]): Promise<void> {
    for (const setting of settings) {
      await this.set(setting.key, setting.value, setting.description);
    }
  },

  async delete(key: string): Promise<boolean> {
    const [result]: any = await pool.execute(
      'DELETE FROM settings WHERE `key` = ?',
      [key]
    );
    return result.affectedRows > 0;
  },

  // Specific helpers for Contact Info
  async getContactInfo(): Promise<{
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    mapsUrl: string | null;
    mapsIframe: string | null;
  }> {
    const config = await this.getMultiple([
      'contact_whatsapp',
      'contact_email',
      'contact_address',
      'contact_maps_url',
      'contact_maps_iframe',
    ]);
    return {
      whatsapp: config['contact_whatsapp'],
      email: config['contact_email'],
      address: config['contact_address'],
      mapsUrl: config['contact_maps_url'],
      mapsIframe: config['contact_maps_iframe'],
    };
  },

  async setContactInfo(data: {
    whatsapp: string;
    email: string;
    address: string;
    mapsUrl: string;
    mapsIframe: string;
  }): Promise<void> {
    await this.setMultiple([
      { key: 'contact_whatsapp', value: data.whatsapp, description: 'Número de WhatsApp' },
      { key: 'contact_email', value: data.email, description: 'Correo electrónico de contacto' },
      { key: 'contact_address', value: data.address, description: 'Dirección física' },
      { key: 'contact_maps_url', value: data.mapsUrl, description: 'URL de Google Maps' },
      { key: 'contact_maps_iframe', value: data.mapsIframe, description: 'Iframe de Google Maps (base64)' },
    ]);
  },

  // Specific helpers for MercadoPago
  async getMercadoPagoConfig(): Promise<{ publicKey: string | null; accessToken: string | null }> {
    const config = await this.getMultiple(['mp_public_key', 'mp_access_token']);
    return {
      publicKey: config['mp_public_key'],
      accessToken: config['mp_access_token']
    };
  },

  async setMercadoPagoConfig(publicKey: string, accessToken: string): Promise<void> {
    await this.setMultiple([
      { key: 'mp_public_key', value: publicKey, description: 'MercadoPago Public Key' },
      { key: 'mp_access_token', value: accessToken, description: 'MercadoPago Access Token' }
    ]);
  }
};
