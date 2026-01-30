import 'dotenv/config';
import pool from '../../utils/db-standalone';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function seed() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const rawPassword = process.env.ADMIN_PASSWORD;
  
  if (!name || !email || !rawPassword) {
    console.log('⚠ Skipping admin seed: Missing credentials in env (ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD)');
    console.log('✓ Admin seed skipped (no credentials)');
    return;
  }

  console.log('Seeding admin user...');
  
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  
  // Check if admin already exists
  const [rows]: any = await pool.execute('SELECT id FROM user WHERE email = ?', [email]);
  
  if (rows.length > 0) {
    console.log('  - Admin user already exists, updating...');
    await pool.execute(
      'UPDATE user SET name = ?, role = ? WHERE email = ?',
      [name, 'admin', email]
    );
    await pool.execute(
      'UPDATE account SET password = ? WHERE userId = ? AND providerId = ?',
      [hashedPassword, rows[0].id, 'credential']
    );
  } else {
    const userId = uuidv4();
    const now = new Date();
    
    await pool.execute(
      `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email, true, now, now, 'admin']
    );
    
    const accountId = uuidv4();
    await pool.execute(
      `INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [accountId, userId, email, 'credential', hashedPassword, now, now]
    );
    
    console.log(`  ✓ Created admin user: ${email}`);
  }
  
  console.log('✓ Admin seeded');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed().then(() => pool.end());
}
