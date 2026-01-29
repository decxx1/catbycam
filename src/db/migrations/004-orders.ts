import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Creating orders table...');
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      total_amount DECIMAL(15, 2) NOT NULL,
      status ENUM('pending', 'paid', 'cancelled', 'refunded') DEFAULT 'pending',
      shipping_address TEXT,
      phone VARCHAR(50),
      comments TEXT,
      shipping_status ENUM('processing', 'shipped', 'delivered') DEFAULT 'processing',
      tracking_number VARCHAR(100),
      payment_id VARCHAR(100),
      preference_id VARCHAR(100),
      external_reference VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ orders table created');
}

export async function down() {
  await pool.execute('DROP TABLE IF EXISTS orders');
  console.log('✓ orders table dropped');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  up().then(() => pool.end());
}
