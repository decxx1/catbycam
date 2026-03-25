import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Adding shipping_type and shipping_cost to orders table...');
  const [rows]: any = await pool.execute(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'
    AND COLUMN_NAME IN ('shipping_type', 'shipping_cost')
  `);
  const existing = new Set(rows.map((r: any) => r.COLUMN_NAME));
  const additions: string[] = [];
  if (!existing.has('shipping_type')) additions.push("ADD COLUMN shipping_type ENUM('pickup', 'delivery') DEFAULT 'delivery' AFTER comments");
  if (!existing.has('shipping_cost')) additions.push('ADD COLUMN shipping_cost DECIMAL(15, 2) DEFAULT 0 AFTER shipping_type');
  if (additions.length > 0) {
    await pool.execute(`ALTER TABLE orders ${additions.join(', ')}`);
  }
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
