import pool from '../db';

async function migrate() {
  try {
    console.log('--- Adding shipping fields to orders table ---');

    // Check if columns already exist
    const [columns]: any = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = 'catbycam' AND TABLE_NAME = 'orders' 
       AND COLUMN_NAME IN ('shipping_status', 'tracking_number', 'phone', 'comments')`
    );
    
    const existingColumns = columns.map((c: any) => c.COLUMN_NAME);

    if (!existingColumns.includes('shipping_status')) {
      await pool.execute(`
        ALTER TABLE orders 
        ADD COLUMN shipping_status ENUM('processing', 'shipped', 'delivered') DEFAULT 'processing'
      `);
      console.log('Added shipping_status column');
    }

    if (!existingColumns.includes('tracking_number')) {
      await pool.execute(`
        ALTER TABLE orders 
        ADD COLUMN tracking_number VARCHAR(100) DEFAULT NULL
      `);
      console.log('Added tracking_number column');
    }

    if (!existingColumns.includes('phone')) {
      await pool.execute(`
        ALTER TABLE orders 
        ADD COLUMN phone VARCHAR(50) DEFAULT NULL
      `);
      console.log('Added phone column');
    }

    if (!existingColumns.includes('comments')) {
      await pool.execute(`
        ALTER TABLE orders 
        ADD COLUMN comments TEXT DEFAULT NULL
      `);
      console.log('Added comments column');
    }

    console.log('--- Migration completed successfully ---');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
