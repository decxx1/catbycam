import pool from './db';

async function setup() {
  try {
    console.log('--- Initializing Database Setup ---');

    // 1. DROP Existing Tables (in correct order due to foreign keys)
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Dropping old tables...');
    await pool.query('DROP TABLE IF EXISTS product_images');
    await pool.query('DROP TABLE IF EXISTS products');
    await pool.query('DROP TABLE IF EXISTS categories');
    await pool.query('DROP TABLE IF EXISTS users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // 2. Create Users Table
    console.log('Creating users table...');
    await pool.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create Categories Table
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

    // 6. Seed Initial Data
    console.log('Seeding initial categories...');
    const initialCats = ['Maquinaria', 'Repuestos', 'Filtros', 'Lubricantes', 'Orugas'];
    for (const cat of initialCats) {
      const slug = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
      await pool.execute('INSERT INTO categories (name, slug) VALUES (?, ?)', [cat, slug]);
    }

    console.log('--- Setup Completed Successfully ---');
    console.log('NOTE: You might need to re-run the admin seed script if you want the admin user back.');
  } catch (error) {
    console.error('CRITICAL: Setup failed:', error);
  } finally {
    await pool.end();
  }
}

setup();

