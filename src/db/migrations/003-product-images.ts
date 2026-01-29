import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Creating product_images table...');
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS product_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      url TEXT NOT NULL,
      url_full TEXT,
      width INT DEFAULT 0,
      height INT DEFAULT 0,
      position INT DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ product_images table created');
}

export async function down() {
  await pool.execute('DROP TABLE IF EXISTS product_images');
  console.log('✓ product_images table dropped');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  up().then(() => pool.end());
}
