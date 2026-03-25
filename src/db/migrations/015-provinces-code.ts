import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Adding code column to provinces table...');
  const [rows]: any = await pool.execute(`
    SELECT COUNT(*) as cnt FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provinces' AND COLUMN_NAME = 'code'
  `);
  if (rows[0].cnt === 0) {
    await pool.execute(`ALTER TABLE provinces ADD COLUMN code CHAR(1) NULL UNIQUE AFTER name`);
  }
  console.log('✓ provinces.code column added');
}

export async function down() {
  await pool.execute('ALTER TABLE provinces DROP COLUMN code');
  console.log('✓ provinces.code column dropped');
}

if (import.meta.main) {
  up().then(() => pool.end());
}
