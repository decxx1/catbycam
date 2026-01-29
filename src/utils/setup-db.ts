import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'catbycam';
const DB_PORT = Number(process.env.DB_PORT) || 3306;

async function setup() {
  console.log('--- Initializing Database Setup ---');
  console.log(`Connecting to ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);

  // First, create connection without database to create it if needed
  const initConnection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
  });

  // Create database if not exists
  console.log(`Creating database '${DB_NAME}' if not exists...`);
  await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await initConnection.end();

  // Now connect to the database
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
    // 1. DROP Existing Tables (in correct order due to foreign keys)
    // NOTA: Las tablas de better-auth (user, session, account, verification) 
    // se crean con: bunx @better-auth/cli migrate
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Dropping app tables (not better-auth tables)...');
    await pool.query('DROP TABLE IF EXISTS order_items');
    await pool.query('DROP TABLE IF EXISTS orders');
    await pool.query('DROP TABLE IF EXISTS admin_notifications');
    await pool.query('DROP TABLE IF EXISTS product_images');
    await pool.query('DROP TABLE IF EXISTS products');
    await pool.query('DROP TABLE IF EXISTS categories');
    await pool.query('DROP TABLE IF EXISTS shipping_addresses');
    await pool.query('DROP TABLE IF EXISTS settings');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // 2. Create Categories Table
    console.log('Creating categories table...');
    await pool.query(`
      CREATE TABLE categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Create Products Table
    console.log('Creating products table...');
    await pool.query(`
      CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(15, 2) DEFAULT 0.00,
        stock INT DEFAULT 0,
        status ENUM('active', 'inactive', 'out_of_stock', 'paused') DEFAULT 'active',
        item_condition ENUM('new', 'used', 'not_specified') DEFAULT 'not_specified',
        category_id INT,
        main_image TEXT NOT NULL,
        main_image_full TEXT,
        main_image_width INT DEFAULT 0,
        main_image_height INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // 5. Create Product Images Table
    console.log('Creating product_images table...');
    await pool.query(`
      CREATE TABLE product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        url TEXT NOT NULL,
        url_full TEXT,
        width INT DEFAULT 0,
        height INT DEFAULT 0,
        position INT DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // 5. Create Orders Table
    // NOTA: user_id es VARCHAR(36) porque better-auth usa UUIDs
    console.log('Creating orders table...');
    await pool.query(`
      CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        total_amount DECIMAL(15, 2) NOT NULL,
        status ENUM('pending', 'paid', 'cancelled', 'refunded') DEFAULT 'pending',
        shipping_address TEXT,
        phone VARCHAR(50),
        comments TEXT,
        shipping_status ENUM('processing', 'shipped', 'delivered') DEFAULT 'processing',
        tracking_number VARCHAR(100),
        payment_id VARCHAR(100),
        preference_id VARCHAR(100),
        external_reference VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    // 7. Create Order Items Table
    console.log('Creating order_items table...');
    await pool.query(`
      CREATE TABLE order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT,
        title VARCHAR(255) NOT NULL,
        price DECIMAL(15, 2) NOT NULL,
        quantity INT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // 8. Create Admin Notifications Table
    console.log('Creating admin_notifications table...');
    await pool.query(`
      CREATE TABLE admin_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('payment_approved', 'new_order', 'low_stock', 'system') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSON,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Seed Initial Data
    console.log('Seeding initial categories...');
    const initialCats = ['Maquinaria', 'Repuestos', 'Filtros', 'Lubricantes', 'Orugas'];
    for (const cat of initialCats) {
      const slug = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
      await pool.execute('INSERT INTO categories (name, slug) VALUES (?, ?)', [cat, slug]);
    }

    console.log('--- Setup Completed Successfully ---');
    console.log('Run "bun run db:seed-admin" to create the admin user.');
  } catch (error) {
    console.error('CRITICAL: Setup failed:', error);
  } finally {
    await pool.end();
  }
}

setup();

