import pool from '@/utils/db';

const DOLAR_API_URL = 'https://dolarapi.com/v1/dolares';
const ALLOWED_CASAS = ['oficial', 'blue'];

interface DolarApiResponse {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export interface DollarRate {
  id?: number;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fecha_actualizacion: string;
  updated_at?: string;
}

export const DollarRateService = {
  async fetchFromApi(): Promise<DolarApiResponse[]> {
    const response = await fetch(DOLAR_API_URL);

    if (!response.ok) {
      throw new Error(`DolarAPI responded with status ${response.status}`);
    }

    const data: DolarApiResponse[] = await response.json();
    return data.filter((item) => ALLOWED_CASAS.includes(item.casa));
  },

  async upsert(rate: DolarApiResponse): Promise<void> {
    await pool.execute(
      `INSERT INTO dollar_rates (casa, nombre, compra, venta, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nombre = VALUES(nombre),
         compra = VALUES(compra),
         venta = VALUES(venta),
         fecha_actualizacion = VALUES(fecha_actualizacion)`,
      [
        rate.casa,
        rate.nombre,
        rate.compra,
        rate.venta,
        new Date(rate.fechaActualizacion),
      ]
    );
  },

  async syncRates(): Promise<void> {
    const rates = await this.fetchFromApi();

    for (const rate of rates) {
      await this.upsert(rate);
    }

    console.log(`[DollarRateService] ${rates.length} rates synced at ${new Date().toISOString()}`);
  },

  async getAll(): Promise<DollarRate[]> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM dollar_rates ORDER BY casa ASC'
    );
    return rows;
  },

  async getByCasa(casa: string): Promise<DollarRate | null> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM dollar_rates WHERE casa = ?',
      [casa]
    );
    return rows.length > 0 ? rows[0] : null;
  },
};
