import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Creating categories table...');
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ categories table created');
}

export async function down() {
  await pool.execute('DROP TABLE IF EXISTS categories');
  console.log('✓ categories table dropped');
}

// Run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  up().then(() => pool.end());
}
