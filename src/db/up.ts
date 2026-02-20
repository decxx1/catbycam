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
  { name: '009-contact-settings', module: () => import('./migrations/009-contact-settings') },
  { name: '010-dollar-rates', module: () => import('./migrations/010-dollar-rates') },
  { name: '011-provinces', module: () => import('./migrations/011-provinces') },
  { name: '012-shipping-addresses-province', module: () => import('./migrations/012-shipping-addresses-province') },
  { name: '013-shipping-costs', module: () => import('./migrations/013-shipping-costs') },
  { name: '014-orders-shipping-type', module: () => import('./migrations/014-orders-shipping-type') },
];

async function waitForDatabase(maxRetries = 10, delayMs = 3000): Promise<mysql.Connection> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const conn = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        port: DB_PORT,
      });
      return conn;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' && i < maxRetries - 1) {
        console.log(`Database not ready, retrying in ${delayMs / 1000}s... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Could not connect to database after max retries');
}

export async function up() {
  console.log('=== Database Migration (db:up) ===\n');

  // 1. Create database if not exists
  console.log(`Connecting to ${DB_HOST}:${DB_PORT}...`);
  const initConnection = await waitForDatabase();

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
