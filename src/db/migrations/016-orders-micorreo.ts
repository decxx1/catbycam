import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Adding MiCorreo tracking columns to orders table...');
  const [rows]: any = await pool.execute(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'
    AND COLUMN_NAME IN ('mc_shipping_id', 'mc_tracking_number', 'mc_imported_at')
  `);
  const existing = new Set(rows.map((r: any) => r.COLUMN_NAME));
  const additions: string[] = [];
  if (!existing.has('mc_shipping_id')) additions.push('ADD COLUMN mc_shipping_id VARCHAR(100) NULL');
  if (!existing.has('mc_tracking_number')) additions.push('ADD COLUMN mc_tracking_number VARCHAR(100) NULL');
  if (!existing.has('mc_imported_at')) additions.push('ADD COLUMN mc_imported_at TIMESTAMP NULL');
  if (additions.length > 0) {
    await pool.execute(`ALTER TABLE orders ${additions.join(', ')}`);
  }
  console.log('✓ orders mc_* columns added');
}

export async function down() {
  await pool.execute(`
    ALTER TABLE orders
    DROP COLUMN mc_shipping_id,
    DROP COLUMN mc_tracking_number,
    DROP COLUMN mc_imported_at
  `);
  console.log('✓ orders mc_* columns dropped');
}

if (import.meta.main) {
  up().then(() => pool.end());
}
