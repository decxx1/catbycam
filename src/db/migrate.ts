import 'dotenv/config';
import pool from '../utils/db-standalone';

import { up as categories } from './migrations/001-categories';
import { up as products } from './migrations/002-products';
import { up as productImages } from './migrations/003-product-images';
import { up as orders } from './migrations/004-orders';
import { up as orderItems } from './migrations/005-order-items';
import { up as adminNotifications } from './migrations/006-admin-notifications';
import { up as shippingAddresses } from './migrations/007-shipping-addresses';
import { up as settings } from './migrations/008-settings';
import { up as dollarRates } from './migrations/010-dollar-rates';

async function migrate() {
  console.log('=== Running All Migrations ===\n');
  
  try {
    // Orden importante por dependencias de foreign keys
    await categories();
    await products();
    await productImages();
    await orders();
    await orderItems();
    await adminNotifications();
    await shippingAddresses();
    await settings();
    await dollarRates();
    
    console.log('\n=== All Migrations Completed ===');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
