import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Adding dollar fields to products table...');
  
  // Check if columns already exist
  const [columns]: any = await pool.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'dollar_enabled'`
  );

  if (columns.length === 0) {
    await pool.execute(`
      ALTER TABLE products
        ADD COLUMN dollar_enabled BOOLEAN DEFAULT FALSE AFTER price,
        ADD COLUMN dollar_price DECIMAL(10, 2) DEFAULT NULL AFTER dollar_enabled
    `);
  }

  console.log('✓ dollar fields added to products');
}

export async function down() {
  await pool.execute(`
    ALTER TABLE products
      DROP COLUMN IF EXISTS dollar_enabled,
      DROP COLUMN IF EXISTS dollar_price
  `);
  console.log('✓ dollar fields removed from products');
}

// Run directly
if (import.meta.main) {
  up().then(() => pool.end());
}
