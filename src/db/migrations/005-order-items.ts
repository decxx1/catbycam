import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Creating order_items table...');
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT,
      title VARCHAR(255) NOT NULL,
      price DECIMAL(15, 2) NOT NULL,
      quantity INT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ order_items table created');
}

export async function down() {
  await pool.execute('DROP TABLE IF EXISTS order_items');
  console.log('✓ order_items table dropped');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  up().then(() => pool.end());
}
