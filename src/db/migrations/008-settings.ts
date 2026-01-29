import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Creating settings table...');
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      \`key\` VARCHAR(100) NOT NULL UNIQUE,
      value TEXT,
      description VARCHAR(255),
      is_encrypted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ settings table created');
}

export async function down() {
  await pool.execute('DROP TABLE IF EXISTS settings');
  console.log('✓ settings table dropped');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  up().then(() => pool.end());
}
