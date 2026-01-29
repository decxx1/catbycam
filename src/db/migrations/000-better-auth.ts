import 'dotenv/config';
import pool from '../../utils/db-standalone';

export async function up() {
  console.log('Creating better-auth tables...');

  // User table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      emailVerified BOOLEAN DEFAULT FALSE,
      image TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      role VARCHAR(50) DEFAULT 'user',
      banned BOOLEAN DEFAULT FALSE,
      banReason TEXT,
      banExpires TIMESTAMP NULL
    )
  `);
  console.log('  ✓ user table created');

  // Session table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS session (
      id VARCHAR(36) PRIMARY KEY,
      expiresAt TIMESTAMP NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      ipAddress VARCHAR(255),
      userAgent TEXT,
      userId VARCHAR(36) NOT NULL,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    )
  `);
  console.log('  ✓ session table created');

  // Account table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS account (
      id VARCHAR(36) PRIMARY KEY,
      accountId VARCHAR(255) NOT NULL,
      providerId VARCHAR(255) NOT NULL,
      userId VARCHAR(36) NOT NULL,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      accessTokenExpiresAt TIMESTAMP NULL,
      refreshTokenExpiresAt TIMESTAMP NULL,
      scope TEXT,
      password TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    )
  `);
  console.log('  ✓ account table created');

  // Verification table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS verification (
      id VARCHAR(36) PRIMARY KEY,
      identifier VARCHAR(255) NOT NULL,
      value TEXT NOT NULL,
      expiresAt TIMESTAMP NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✓ verification table created');

  console.log('✓ better-auth tables created');
}

export async function down() {
  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
  await pool.execute('DROP TABLE IF EXISTS verification');
  await pool.execute('DROP TABLE IF EXISTS account');
  await pool.execute('DROP TABLE IF EXISTS session');
  await pool.execute('DROP TABLE IF EXISTS user');
  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✓ better-auth tables dropped');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  up().then(() => pool.end());
}
