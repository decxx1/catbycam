import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Adding dimension columns to products table...');
  const [rows]: any = await pool.execute(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'
    AND COLUMN_NAME IN ('weight', 'pkg_height', 'pkg_width', 'pkg_length')
  `);
  const existing = new Set(rows.map((r: any) => r.COLUMN_NAME));
  const additions: string[] = [];
  if (!existing.has('weight')) additions.push("ADD COLUMN weight INT NULL COMMENT 'Peso del paquete en gramos'");
  if (!existing.has('pkg_height')) additions.push("ADD COLUMN pkg_height INT NULL COMMENT 'Alto del paquete en cm'");
  if (!existing.has('pkg_width')) additions.push("ADD COLUMN pkg_width INT NULL COMMENT 'Ancho del paquete en cm'");
  if (!existing.has('pkg_length')) additions.push("ADD COLUMN pkg_length INT NULL COMMENT 'Largo del paquete en cm'");
  if (additions.length > 0) {
    await pool.execute(`ALTER TABLE products ${additions.join(', ')}`);
  }
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
