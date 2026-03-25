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
import { up as provinces } from './migrations/011-provinces';
import { up as shippingAddressesProvince } from './migrations/012-shipping-addresses-province';
import { up as shippingCosts } from './migrations/013-shipping-costs';
import { up as ordersShippingType } from './migrations/014-orders-shipping-type';
import { up as provincesCode } from './migrations/015-provinces-code';
import { up as ordersMiCorreo } from './migrations/016-orders-micorreo';
import { up as productsDimensions } from './migrations/017-products-dimensions';

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
    await provinces();
    await shippingAddressesProvince();
    await shippingCosts();
    await ordersShippingType();
    await provincesCode();
    await ordersMiCorreo();
    await productsDimensions();

    console.log('\n=== All Migrations Completed ===');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
