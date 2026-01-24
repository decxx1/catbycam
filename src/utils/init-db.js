import mysql from 'mysql2/promise';

async function initDB() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
    });

    try {
        await connection.query('CREATE DATABASE IF NOT EXISTS catbycam');
        await connection.query('USE catbycam');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('Database and users table initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await connection.end();
    }
}

initDB();
