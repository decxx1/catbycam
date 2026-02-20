import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Adding shipping_type and shipping_cost to orders table...');
  await pool.execute(`
    ALTER TABLE orders 
    ADD COLUMN shipping_type ENUM('pickup', 'delivery') DEFAULT 'delivery' AFTER comments,
    ADD COLUMN shipping_cost DECIMAL(15, 2) DEFAULT 0 AFTER shipping_type
  `);
  console.log('✓ shipping_type and shipping_cost columns added to orders');
}

export async function down() {
  await pool.execute(`
    ALTER TABLE orders 
    DROP COLUMN shipping_type,
    DROP COLUMN shipping_cost
  `);
  console.log('✓ shipping_type and shipping_cost columns dropped from orders');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  up().then(() => pool.end());
}
