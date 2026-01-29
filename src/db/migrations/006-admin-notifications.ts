import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Creating admin_notifications table...');
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS admin_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type ENUM('payment_approved', 'new_order', 'low_stock', 'system') NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      data JSON,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ admin_notifications table created');
}

export async function down() {
  await pool.execute('DROP TABLE IF EXISTS admin_notifications');
  console.log('✓ admin_notifications table dropped');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  up().then(() => pool.end());
}
