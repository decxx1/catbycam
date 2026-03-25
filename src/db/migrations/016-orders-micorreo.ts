import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Adding MiCorreo tracking columns to orders table...');
  await pool.execute(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS mc_shipping_id VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS mc_tracking_number VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS mc_imported_at TIMESTAMP NULL
  `);
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
