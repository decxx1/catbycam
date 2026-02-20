import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Adding province_id to shipping_addresses...');
  
  // Verificar si la columna ya existe
  const [columns] = await pool.execute(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'shipping_addresses' 
    AND COLUMN_NAME = 'province_id'
  `) as any;
  
  if (columns.length === 0) {
    await pool.execute(`
      ALTER TABLE shipping_addresses 
      ADD COLUMN province_id INT NULL AFTER state,
      ADD CONSTRAINT fk_shipping_province FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE SET NULL
    `);
    console.log('✓ province_id column added to shipping_addresses');
  } else {
    console.log('✓ province_id column already exists');
  }
}

export async function down() {
  await pool.execute(`
    ALTER TABLE shipping_addresses 
    DROP FOREIGN KEY fk_shipping_province,
    DROP COLUMN province_id
  `);
  console.log('✓ province_id column removed from shipping_addresses');
}

if (import.meta.main) {
  up().then(() => pool.end());
}
