import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Adding dimension columns to products table...');
  await pool.execute(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS weight INT NULL COMMENT 'Peso del paquete en gramos',
    ADD COLUMN IF NOT EXISTS pkg_height INT NULL COMMENT 'Alto del paquete en cm',
    ADD COLUMN IF NOT EXISTS pkg_width INT NULL COMMENT 'Ancho del paquete en cm',
    ADD COLUMN IF NOT EXISTS pkg_length INT NULL COMMENT 'Largo del paquete en cm'
  `);
  console.log('✓ products dimension columns added');
}

export async function down() {
  await pool.execute(`
    ALTER TABLE products
    DROP COLUMN weight,
    DROP COLUMN pkg_height,
    DROP COLUMN pkg_width,
    DROP COLUMN pkg_length
  `);
  console.log('✓ products dimension columns dropped');
}

if (import.meta.main) {
  up().then(() => pool.end());
}
