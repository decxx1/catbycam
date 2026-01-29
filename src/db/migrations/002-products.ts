import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Creating products table...');
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(15, 2) DEFAULT 0.00,
      stock INT DEFAULT 0,
      status ENUM('active', 'inactive', 'out_of_stock', 'paused') DEFAULT 'active',
      item_condition ENUM('new', 'used', 'not_specified') DEFAULT 'not_specified',
      category_id INT,
      main_image TEXT NOT NULL,
      main_image_full TEXT,
      main_image_width INT DEFAULT 0,
      main_image_height INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);
  console.log('✓ products table created');
}

export async function down() {
  await pool.execute('DROP TABLE IF EXISTS products');
  console.log('✓ products table dropped');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  up().then(() => pool.end());
}
