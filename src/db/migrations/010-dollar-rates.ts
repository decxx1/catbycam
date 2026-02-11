import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Creating dollar_rates table...');
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS dollar_rates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      casa VARCHAR(50) NOT NULL UNIQUE,
      nombre VARCHAR(100) NOT NULL,
      compra DECIMAL(10, 2) NOT NULL,
      venta DECIMAL(10, 2) NOT NULL,
      fecha_actualizacion DATETIME NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ dollar_rates table created');
}

export async function down() {
  await pool.execute('DROP TABLE IF EXISTS dollar_rates');
  console.log('✓ dollar_rates table dropped');
}

// Run directly
if (import.meta.main) {
  up().then(() => pool.end());
}
