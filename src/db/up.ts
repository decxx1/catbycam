import 'dotenv/config';
import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'catbycam';
const DB_PORT = Number(process.env.DB_PORT) || 3306;

// Lista de migraciones en orden (000-better-auth DEBE ser primero)
const migrations = [
  { name: '000-better-auth', module: () => import('./migrations/000-better-auth') },
  { name: '001-categories', module: () => import('./migrations/001-categories') },
  { name: '002-products', module: () => import('./migrations/002-products') },
  { name: '003-product-images', module: () => import('./migrations/003-product-images') },
  { name: '004-orders', module: () => import('./migrations/004-orders') },
  { name: '005-order-items', module: () => import('./migrations/005-order-items') },
  { name: '006-admin-notifications', module: () => import('./migrations/006-admin-notifications') },
  { name: '007-shipping-addresses', module: () => import('./migrations/007-shipping-addresses') },
  { name: '008-settings', module: () => import('./migrations/008-settings') },
];

export async function up() {
  console.log('=== Database Migration (db:up) ===\n');

  // 1. Create database if not exists
  console.log(`Connecting to ${DB_HOST}:${DB_PORT}...`);
  const initConnection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
  });

  console.log(`Creating database '${DB_NAME}' if not exists...`);
  await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await initConnection.end();

  // 2. Connect to database
  const pool: Pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
  });

  try {
    // 3. Create migrations table if not exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Get already executed migrations
    const [rows]: any = await pool.execute('SELECT name FROM _migrations');
    const executedMigrations = new Set(rows.map((r: any) => r.name));

    // 5. Run pending migrations
    let pendingCount = 0;
    for (const migration of migrations) {
      if (!executedMigrations.has(migration.name)) {
        console.log(`\nRunning migration: ${migration.name}`);
        const mod = await migration.module();
        await mod.up();
        
        // Mark as executed
        await pool.execute('INSERT INTO _migrations (name) VALUES (?)', [migration.name]);
        pendingCount++;
      }
    }

    if (pendingCount === 0) {
      console.log('\n✓ No pending migrations. Database is up to date.');
    } else {
      console.log(`\n✓ ${pendingCount} migration(s) executed successfully.`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Solo ejecutar si es el script principal
if (import.meta.main) {
  up();
}
