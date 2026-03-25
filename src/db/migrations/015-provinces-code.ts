import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Adding code column to provinces table...');
  await pool.execute(`
    ALTER TABLE provinces
    ADD COLUMN IF NOT EXISTS code CHAR(1) NULL UNIQUE AFTER name
  `);
  console.log('✓ provinces.code column added');
}

export async function down() {
  await pool.execute('ALTER TABLE provinces DROP COLUMN code');
  console.log('✓ provinces.code column dropped');
}

if (import.meta.main) {
  up().then(() => pool.end());
}
