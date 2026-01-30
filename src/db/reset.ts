import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'catbycam';
const DB_PORT = Number(process.env.DB_PORT) || 3306;

export async function reset() {
  console.log('=== Resetting Database ===\n');
  console.log(`Connecting to ${DB_HOST}:${DB_PORT}...`);

  const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
  });

  try {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const [tables]: any = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = ?`,
      [DB_NAME]
    );

    for (const row of tables) {
      const tableName = row.TABLE_NAME || row.table_name;
      console.log(`  Dropping: ${tableName}`);
      await pool.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    }

    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n=== Database Reset Complete ===');
    console.log('\nNext steps:');
    console.log('  1. bun run db:auth     (better-auth tables)');
    console.log('  2. bun run db:migrate  (app tables)');
    console.log('  3. bun run db:seed     (initial data)');
  } catch (error) {
    console.error('\n❌ Reset failed:', error);
  } finally {
    await pool.end();
  }
}

// Solo ejecutar si es el script principal
if (import.meta.main) {
  reset();
}
