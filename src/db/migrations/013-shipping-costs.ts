import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Creating shipping_costs table...');
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS shipping_costs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      province_id INT NOT NULL UNIQUE,
      cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ shipping_costs table created');
}

export async function down() {
  await pool.execute('DROP TABLE IF EXISTS shipping_costs');
  console.log('✓ shipping_costs table dropped');
}

if (import.meta.main) {
  up().then(() => pool.end());
}
