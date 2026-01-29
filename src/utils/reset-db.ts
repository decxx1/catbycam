import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'catbycam';
const DB_PORT = Number(process.env.DB_PORT) || 3306;

async function resetDb() {
  console.log('--- Resetting Database ---');
  console.log(`Connecting to ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);

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
    
    // Obtener todas las tablas
    const [tables]: any = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = ?`,
      [DB_NAME]
    );

    // Eliminar todas las tablas
    for (const row of tables) {
      const tableName = row.TABLE_NAME || row.table_name;
      console.log(`Dropping table: ${tableName}`);
      await pool.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    }

    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('--- Database Reset Complete ---');
    console.log('All tables have been dropped.');
    console.log('Now run: bunx @better-auth/cli migrate');
    console.log('Then run: bun run db:setup');
  } catch (error) {
    console.error('CRITICAL: Reset failed:', error);
  } finally {
    await pool.end();
  }
}

resetDb();
