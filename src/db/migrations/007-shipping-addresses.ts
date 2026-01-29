import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Creating shipping_addresses table...');
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS shipping_addresses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      address VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      zip VARCHAR(20) DEFAULT '',
      phone VARCHAR(50) NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ shipping_addresses table created');
}

export async function down() {
  await pool.execute('DROP TABLE IF EXISTS shipping_addresses');
  console.log('✓ shipping_addresses table dropped');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  up().then(() => pool.end());
}
