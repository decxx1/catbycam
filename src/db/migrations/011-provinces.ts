import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Creating provinces table...');
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS provinces (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ provinces table created');
}

export async function down() {
  await pool.execute('DROP TABLE IF EXISTS provinces');
  console.log('✓ provinces table dropped');
}

if (import.meta.main) {
  up().then(() => pool.end());
}
