import mysql from 'mysql2/promise';
import type { Pool, PoolOptions } from 'mysql2/promise';

// Standalone DB connection for scripts (uses process.env instead of astro:env)
const poolConfig: PoolOptions = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'catbycam',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool: Pool = mysql.createPool(poolConfig);

export default pool;
