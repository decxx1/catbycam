import pool from './db-standalone';

async function setup() {
  try {
    console.log('--- Creating admin_notifications table ---');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('payment_approved', 'new_order', 'low_stock', 'system') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSON,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('--- Table created successfully ---');
  } catch (error) {
    console.error('Error creating notifications table:', error);
  } finally {
    await pool.end();
  }
}

setup();
