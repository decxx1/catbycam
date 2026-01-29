import pool from './db-standalone';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

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
    
    // Check if admin already exists (better-auth usa tabla 'user')
    const [rows]: any = await pool.execute('SELECT id FROM user WHERE email = ?', [email]);
    
    if (rows.length > 0) {
      console.log('Admin user already exists. Updating password/name/role...');
      await pool.execute(
        'UPDATE user SET name = ?, role = ? WHERE email = ?',
        [name, 'admin', email]
      );
      // Actualizar password en tabla account
      await pool.execute(
        'UPDATE account SET password = ? WHERE userId = ? AND providerId = ?',
        [hashedPassword, rows[0].id, 'credential']
      );
    } else {
      const userId = uuidv4();
      const now = new Date();
      
      // Insertar en tabla user de better-auth
      await pool.execute(
        `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt, role) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, name, email, true, now, now, 'admin']
      );
      
      // Insertar en tabla account para credenciales
      const accountId = uuidv4();
      await pool.execute(
        `INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [accountId, userId, email, 'credential', hashedPassword, now, now]
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
