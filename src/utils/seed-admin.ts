import pool from './db';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

async function seedAdmin() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const rawPassword = process.env.ADMIN_PASSWORD;
  
  if (!name || !email || !rawPassword) {
    console.error('Missing admin credentials in environment variables.');
    await pool.end();
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    
    // Check if admin already exists
    const [rows]: any = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    
    if (rows.length > 0) {
      console.log('Admin user already exists. Updating password/name...');
      await pool.execute(
        'UPDATE users SET name = ?, password = ?, role = "admin" WHERE email = ?',
        [name, hashedPassword, email]
      );
    } else {
      await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "admin")',
        [name, email, hashedPassword]
      );
      console.log(`Root Admin user (${email}) seeded successfully.`);
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await pool.end();
  }
}

seedAdmin();
