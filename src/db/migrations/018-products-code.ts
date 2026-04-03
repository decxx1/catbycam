import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Adding code column to products table...');
  const [rows]: any = await pool.execute(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'code'
  `);
  if (rows.length === 0) {
    await pool.execute(`ALTER TABLE products ADD COLUMN code VARCHAR(100) NULL AFTER id`);
  }
  console.log('✓ products code column added');
}

export async function down() {
  await pool.execute(`ALTER TABLE products DROP COLUMN code`);
  console.log('✓ products code column dropped');
}

if (import.meta.main) {
  up().then(() => pool.end());
}
