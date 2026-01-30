import 'dotenv/config';
import pool from '../utils/db-standalone';

import { seed as categories } from './seeds/001-categories';
import { seed as admin } from './seeds/002-admin';

export async function seedAll() {
  console.log('=== Running All Seeds ===\n');
  
  try {
    await categories();
    await admin();
    
    console.log('\n=== All Seeds Completed ===');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

// Solo ejecutar si es el script principal
if (import.meta.main) {
  seedAll();
}
